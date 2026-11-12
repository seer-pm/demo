// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title RewardCampaigns
/// @notice Liquidity reward campaigns of Seer's Uniswap V4 pools on this chain, and the escrow of their budgets.
/// Rewards pay out on the pool's chain, so there is one registry per chain with pools, next to that chain's Morpho
/// Universal Rewards Distributor. The weekly rewards bot (`packages/seer-pm-rewards`) rebuilds the campaigns from `CampaignSet`
/// events up to each Monday cutoff, releases what each one emitted to the distributor and then submits the root
/// that lets users claim it.
/// @dev A campaign's budget is deposited when it is created or increased, and the engine never emits more than
/// the budget, so the distributor can always be paid in full; what was not emitted is credited to the wallets
/// that deposited it once the campaign ended, and each of them withdraws its own credit. The bot refuses campaign changes that would alter what an already published week emitted, and every
/// change here takes effect from the block that makes it, so none can:
/// - A campaign is never removed, and its pool and reward token never change.
/// - A campaign starts when it is created, and a rate change applies from the block it is mined in. Rate history
///   is append-only; ending a campaign is a rate of 0.
/// - `minWidthTicks` and `excludedTokenIds` may change at any time. The bot reads them at the end of each week,
///   so they apply to the whole week in progress.
contract RewardCampaigns is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev `perSecond` reward token base units are emitted from `from` (unix seconds) until the next rate.
    struct Rate {
        uint64 from;
        uint256 perSecond;
    }

    struct Campaign {
        bytes32 poolId; // V4 pool id on this chain.
        address rewardToken; // Token on this chain.
        uint256 budget; // Total the campaign may ever emit, held here until it is released or refunded.
        uint32 minWidthTicks; // Positions narrower than this (`tickUpper - tickLower`) neither earn nor dilute.
        Rate[] rates; // Strictly increasing `from`; the first one is the start of the campaign.
        uint256[] excludedTokenIds; // PositionManager token ids that neither earn nor dilute.
    }

    /// @dev Kept apart from `Campaign` so the weekly releases do not re-emit the whole campaign.
    struct Release {
        uint256 released; // Sent to the distributor so far: what the campaign emitted up to `upTo`.
        uint64 upTo; // Weekly cutoff of the last release.
    }

    struct Deposit {
        address depositor;
        uint256 amount;
    }

    address public immutable distributor; // This chain's Universal Rewards Distributor.
    address public owner; // Appoints managers and the releaser.
    address public releaser; // The rewards bot.
    mapping(address => bool) public isManager; // Accounts that create, fund and update campaigns.
    Campaign[] internal campaigns; // Campaign id = index.
    Release[] internal releases; // By campaign id.
    /// @dev By campaign id: the deposits not yet spent or refunded, one entry per depositor.
    mapping(uint256 => Deposit[]) internal deposits;
    /// @notice Refunds credited to each depositor and not yet withdrawn, by token and depositor.
    mapping(address => mapping(address => uint256)) public refundable;

    /// @dev Emitted with the whole campaign after every change, so the state at any block can be rebuilt from logs.
    event CampaignSet(uint256 indexed id, Campaign campaign);
    event Released(uint256 indexed id, uint256 amount, uint256 released, uint64 upTo);
    event RefundCredited(uint256 indexed id, address indexed depositor, uint256 amount);
    event RefundWithdrawn(address indexed token, address indexed depositor, uint256 amount);
    event ManagerSet(address indexed account, bool active);
    event ReleaserSet(address indexed releaser);
    event OwnerSet(address indexed owner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner");
        _;
    }

    modifier onlyManager() {
        require(msg.sender == owner || isManager[msg.sender], "Only a manager");
        _;
    }

    /// @param _distributor This chain's Universal Rewards Distributor.
    /// @param _owner The owner of the registry, usually a Safe.
    /// @param _releaser The rewards bot, or the zero address to set it later.
    /// @param _managers The initial managers.
    constructor(address _distributor, address _owner, address _releaser, address[] memory _managers) {
        distributor = _distributor;
        owner = _owner;
        releaser = _releaser;
        emit OwnerSet(_owner);
        emit ReleaserSet(_releaser);
        for (uint256 i = 0; i < _managers.length; i++) {
            isManager[_managers[i]] = true;
            emit ManagerSet(_managers[i], true);
        }
    }

    /// @notice Transfers ownership. It takes effect at once.
    function setOwner(address _owner) external onlyOwner {
        owner = _owner;
        emit OwnerSet(_owner);
    }

    function setManager(address account, bool active) external onlyOwner {
        isManager[account] = active;
        emit ManagerSet(account, active);
    }

    function setReleaser(address _releaser) external onlyOwner {
        releaser = _releaser;
        emit ReleaserSet(_releaser);
    }

    /// @notice Creates a campaign that emits `perSecond` from this block on, and deposits its whole `budget` from
    /// the caller, who must have approved this contract for it.
    /// @return id The id of the new campaign.
    function createCampaign(
        bytes32 poolId,
        address rewardToken,
        uint256 perSecond,
        uint256 budget,
        uint32 minWidthTicks,
        uint256[] calldata excludedTokenIds
    ) external onlyManager nonReentrant returns (uint256 id) {
        require(poolId != bytes32(0), "Missing pool id");
        require(rewardToken != address(0), "Missing reward token");
        require(perSecond != 0, "Missing rate");
        require(budget != 0, "Missing budget");

        id = campaigns.length;
        Campaign storage campaign = campaigns.push();
        releases.push();
        campaign.poolId = poolId;
        campaign.rewardToken = rewardToken;
        campaign.budget = budget;
        campaign.minWidthTicks = minWidthTicks;
        campaign.excludedTokenIds = excludedTokenIds;
        campaign.rates.push(Rate(uint64(block.timestamp), perSecond));
        _deposit(id, rewardToken, budget);
        emit CampaignSet(id, campaign);
    }

    /// @notice Deposits `amount` more from the caller and adds it to the budget.
    function increaseBudget(uint256 id, uint256 amount) external onlyManager nonReentrant {
        require(amount != 0, "Missing amount");
        Campaign storage campaign = _campaign(id);
        campaign.budget += amount;
        _deposit(id, campaign.rewardToken, amount);
        emit CampaignSet(id, campaign);
    }

    /// @notice Sets the rate from this block on. A rate of 0 ends the campaign, and a later rate restarts it.
    function setRate(uint256 id, uint256 perSecond) external onlyManager {
        Campaign storage campaign = _campaign(id);
        Rate storage last = campaign.rates[campaign.rates.length - 1];
        // Rates are keyed by timestamp, so a second change in the same block replaces the first.
        if (last.from == block.timestamp) last.perSecond = perSecond;
        else campaign.rates.push(Rate(uint64(block.timestamp), perSecond));
        emit CampaignSet(id, campaign);
    }

    /// @notice Updates the settings that may change at any time. They apply to the whole week in progress.
    function updateSettings(uint256 id, uint32 minWidthTicks, uint256[] calldata excludedTokenIds)
        external
        onlyManager
    {
        Campaign storage campaign = _campaign(id);
        campaign.minWidthTicks = minWidthTicks;
        campaign.excludedTokenIds = excludedTokenIds;
        emit CampaignSet(id, campaign);
    }

    /// @notice Sends the distributor what campaigns `ids` emitted up to the weekly cutoff `upTo`, given as the
    /// cumulative `emitted` of each, so a repeated call sends nothing more.
    /// @dev A total below what was already released sends nothing: the release stays, as the distributor cannot
    /// return it.
    function release(uint256[] calldata ids, uint256[] calldata emitted, uint64 upTo) external nonReentrant {
        require(msg.sender == releaser, "Only the releaser");
        require(ids.length == emitted.length, "Length mismatch");
        require(upTo <= block.timestamp, "Cutoff in the future");
        for (uint256 i = 0; i < ids.length; i++) {
            Campaign storage campaign = _campaign(ids[i]);
            Release storage r = releases[ids[i]];
            require(emitted[i] <= campaign.budget, "Over budget");
            uint256 amount = emitted[i] > r.released ? emitted[i] - r.released : 0;
            r.released += amount;
            if (upTo > r.upTo) r.upTo = upTo;
            if (amount > 0) IERC20(campaign.rewardToken).safeTransfer(distributor, amount);
            emit Released(ids[i], amount, r.released, r.upTo);
        }
    }

    /// @notice Credits what an ended campaign did not emit to the wallets that deposited its budget, in proportion
    /// to their deposits; each then calls `withdrawRefund`. Nothing is transferred here, so a depositor the token
    /// refuses to pay (such as a blacklisted address) only holds back its own withdrawal. Anyone may call it, since
    /// the credits can only go to the depositors, so a depositor who is no longer a manager still gets them. It is
    /// allowed once the bot released a week whose cutoff is at or after the end; the budget then becomes what was
    /// released, so a restart first needs funds.
    /// @dev Every function that moves tokens or reads deposits is `nonReentrant`: a token callback during a deposit
    /// could otherwise settle a campaign whose budget already counts the deposit but whose depositor is not recorded.
    function settleRefund(uint256 id) external nonReentrant {
        Campaign storage campaign = _campaign(id);
        Rate storage last = campaign.rates[campaign.rates.length - 1];
        require(last.perSecond == 0, "Campaign not ended");
        Release storage r = releases[id];
        require(r.upTo >= last.from, "Final week not released");
        uint256 unspent = campaign.budget - r.released;
        campaign.budget = r.released;

        // Every earlier deposit was spent or refunded by the previous refund, so the remaining deposits cover
        // `unspent`.
        Deposit[] storage list = deposits[id];
        uint256 total;
        for (uint256 i = 0; i < list.length; i++) {
            total += list[i].amount;
        }
        // Each share is the step between floored cumulative shares, so the shares add up to `unspent` exactly and
        // none exceeds its deposit (`unspent <= total`).
        uint256 cumulative;
        uint256 credited;
        for (uint256 i = 0; i < list.length; i++) {
            cumulative += list[i].amount;
            uint256 share = (unspent * cumulative) / total - credited;
            credited += share;
            if (share > 0) {
                refundable[campaign.rewardToken][list[i].depositor] += share;
                emit RefundCredited(id, list[i].depositor, share);
            }
        }
        delete deposits[id];
        emit CampaignSet(id, campaign);
    }

    /// @notice Sends the caller every refund of `token` credited to it, across campaigns.
    function withdrawRefund(address token) external nonReentrant {
        uint256 amount = refundable[token][msg.sender];
        require(amount != 0, "Nothing to withdraw");
        refundable[token][msg.sender] = 0;
        IERC20(token).safeTransfer(msg.sender, amount);
        emit RefundWithdrawn(token, msg.sender, amount);
    }

    function campaignCount() external view returns (uint256) {
        return campaigns.length;
    }

    function getCampaign(uint256 id) external view returns (Campaign memory) {
        return _campaign(id);
    }

    /// @notice Every campaign, in id order.
    function getCampaigns() external view returns (Campaign[] memory) {
        return campaigns;
    }

    /// @notice The deposits of campaign `id` not yet spent or refunded, which share its next refund.
    function getDeposits(uint256 id) external view returns (Deposit[] memory) {
        _campaign(id);
        return deposits[id];
    }

    /// @notice The release state of every campaign, in id order.
    function getReleases() external view returns (Release[] memory) {
        return releases;
    }

    /// @dev Takes `amount` of `token` from the caller and records it as the caller's deposit in campaign `id`.
    function _deposit(uint256 id, address token, uint256 amount) internal {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        Deposit[] storage list = deposits[id];
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i].depositor == msg.sender) {
                list[i].amount += amount;
                return;
            }
        }
        list.push(Deposit(msg.sender, amount));
    }

    function _campaign(uint256 id) internal view returns (Campaign storage) {
        require(id < campaigns.length, "Unknown campaign");
        return campaigns[id];
    }
}
