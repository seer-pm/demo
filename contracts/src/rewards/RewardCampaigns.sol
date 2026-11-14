// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title RewardCampaigns
/// @notice Liquidity reward campaigns of Seer's Uniswap V4 pools on this chain, and the escrow of their budgets.
/// Rewards pay out on the pool's chain, so there is one registry per chain with pools, next to that chain's Morpho
/// Universal Rewards Distributor. The weekly rewards bot (`packages/seer-pm-rewards`) rebuilds the campaigns from `CampaignSet`
/// events up to each Monday cutoff, releases what each one emitted to the distributor and then submits the root
/// that lets users claim it.
/// @dev Each campaign has one funder, the manager who created it and deposited its whole budget. The engine never
/// emits more than the budget, so the distributor can always be paid in full, and what was not emitted goes back to
/// the funder once the campaign ended. More rewards for a pool are a new campaign on the same pool, so a budget never
/// mixes the tokens of two wallets. The bot refuses campaign changes that would alter what an already published week
/// emitted, and every change here takes effect from the block that makes it, so none can:
/// - A campaign is never removed, and its pool, reward token, `minWidthTicks` and funder never change. Its budget
///   only drops, when a refund sends what the campaign cannot emit back to the funder.
/// - A campaign starts when it is created, and a rate change applies from the block it is mined in. Rate history
///   is append-only; a rate of 0 ends the campaign for good, so its rates bound everything it can still emit.
/// Reward tokens must transfer exactly the amount requested: fee-on-transfer and rebasing tokens are not supported.
/// The registry records the nominal budget and every campaign of a token shares one balance, so such a token would
/// pay one campaign's releases and refund out of the escrow of the others.
/// Reward tokens must also never revert a transfer, so tokens with a pause, a blocklist or transfer hooks are not
/// supported either. `release` pays every due campaign in one call, so one failing transfer would stop the release
/// and the weekly root of every campaign on the chain, and a blocked funder would never get its refund.
/// Managers are trusted team wallets. `createCampaign` checks neither the token nor that the pool uses the Seer hook,
/// and the bot replays each pool from the hook deployment, so an older pool would stop it for every campaign.
contract RewardCampaigns {
    using SafeERC20 for IERC20;

    /// @dev `TickMath.MAX_TICK - TickMath.MIN_TICK` of Uniswap V4: no position is wider, so a larger minimum width
    /// would leave every position out and the campaign would never emit.
    uint32 public constant MAX_WIDTH_TICKS = 1_774_544;

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
    }

    /// @dev Kept apart from `Campaign` so the weekly releases do not re-emit the whole campaign.
    struct Release {
        uint256 released; // Sent to the distributor so far: what the campaign emitted up to `upTo`.
        uint64 upTo; // Weekly cutoff of the last release.
    }

    address public immutable distributor; // This chain's Universal Rewards Distributor.
    address public owner; // Appoints managers and the releaser, and may change any campaign.
    address public releaser; // The rewards bot.
    mapping(address => bool) public isManager; // Accounts that create campaigns.
    Campaign[] internal campaigns; // Campaign id = index.
    Release[] internal releases; // By campaign id.
    /// @dev By campaign id: the wallet that deposited the budget, which changes the campaign and gets its refund.
    /// Kept apart from `Campaign` so `CampaignSet` carries only what the bot reads.
    address[] internal funders;

    /// @dev Emitted with the whole campaign after every change, so the state at any block can be rebuilt from logs.
    event CampaignSet(uint256 indexed id, Campaign campaign);
    event Released(uint256 indexed id, uint256 amount, uint256 released, uint64 upTo);
    event Refunded(uint256 indexed id, address indexed funder, uint256 amount);
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

    /// @dev The funder alone decides how its own deposit is spent; the owner may step in on any campaign.
    modifier onlyFunderOrOwner(uint256 id) {
        _campaign(id);
        require(msg.sender == funders[id] || msg.sender == owner, "Only the funder or the owner");
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
    /// the caller, who must have approved this contract for it and becomes its funder.
    /// @return id The id of the new campaign.
    function createCampaign(
        bytes32 poolId,
        address rewardToken,
        uint256 perSecond,
        uint256 budget,
        uint32 minWidthTicks
    ) external onlyManager returns (uint256 id) {
        require(poolId != bytes32(0), "Missing pool id");
        require(rewardToken != address(0), "Missing reward token");
        require(perSecond != 0, "Missing rate");
        require(budget != 0, "Missing budget");
        require(minWidthTicks <= MAX_WIDTH_TICKS, "Width too wide");

        id = campaigns.length;
        Campaign storage campaign = campaigns.push();
        releases.push();
        funders.push(msg.sender);
        campaign.poolId = poolId;
        campaign.rewardToken = rewardToken;
        campaign.budget = budget;
        campaign.minWidthTicks = minWidthTicks;
        campaign.rates.push(Rate(uint64(block.timestamp), perSecond));
        emit CampaignSet(id, campaign);
        IERC20(rewardToken).safeTransferFrom(msg.sender, address(this), budget);
    }

    /// @notice Sets the rate from this block on. A rate of 0 ends the campaign for good: more rewards for the pool
    /// are a new campaign.
    function setRate(uint256 id, uint256 perSecond) external onlyFunderOrOwner(id) {
        Campaign storage campaign = campaigns[id];
        Rate storage last = campaign.rates[campaign.rates.length - 1];
        require(last.perSecond != 0, "Campaign ended");
        // Rates are keyed by timestamp, so a second change in the same block replaces the first.
        if (last.from == block.timestamp) last.perSecond = perSecond;
        else campaign.rates.push(Rate(uint64(block.timestamp), perSecond));
        emit CampaignSet(id, campaign);
    }

    /// @notice Sends the distributor what campaigns `ids` emitted up to the weekly cutoff `upTo`, given as the
    /// cumulative `emitted` of each, so a repeated call sends nothing more.
    /// @dev A total below what was already released sends nothing: the release stays, as the distributor cannot
    /// return it.
    function release(uint256[] calldata ids, uint256[] calldata emitted, uint64 upTo) external {
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

    /// @notice Sends what an ended campaign cannot have emitted back to its funder. Anyone may call it, since the
    /// tokens can only go to the funder, so a funder who is no longer a manager still gets them.
    /// @dev Until the bot releases a week whose cutoff is at or after the end, the emission since the last release is
    /// unknown here, so the budget keeps the most the rates can have emitted since then and the rest goes back at
    /// once. Once that week is released, a second call sends back what the campaign did not emit after all. The
    /// engine never emits more than the rates do, so the final release always fits in the budget that is kept.
    function settleRefund(uint256 id) external {
        Campaign storage campaign = _campaign(id);
        Rate[] storage rates = campaign.rates;
        require(rates[rates.length - 1].perSecond == 0, "Campaign not ended");
        Release storage r = releases[id];
        uint256 keep = r.released + _maxEmittedSince(rates, r.upTo);
        // Nothing is left to send when the whole budget may still be owed, and some tokens revert on a transfer of 0.
        require(campaign.budget > keep, "Nothing to refund");
        uint256 unspent = campaign.budget - keep;
        campaign.budget = keep;
        address funder = funders[id];
        emit Refunded(id, funder, unspent);
        emit CampaignSet(id, campaign);
        IERC20(campaign.rewardToken).safeTransfer(funder, unspent);
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

    /// @notice The funder of every campaign, in id order.
    function getFunders() external view returns (address[] memory) {
        return funders;
    }

    /// @notice The release state of every campaign, in id order.
    function getReleases() external view returns (Release[] memory) {
        return releases;
    }

    /// @dev What the rates of an ended campaign emit from `from` to its end, before the budget cap: 0 once `from` is
    /// at or after the end.
    function _maxEmittedSince(Rate[] storage rates, uint64 from) internal view returns (uint256 total) {
        for (uint256 i = rates.length - 1; i > 0 && rates[i].from > from; i--) {
            Rate storage rate = rates[i - 1];
            uint64 start = rate.from > from ? rate.from : from;
            total += rate.perSecond * (rates[i].from - start);
        }
    }

    function _campaign(uint256 id) internal view returns (Campaign storage) {
        require(id < campaigns.length, "Unknown campaign");
        return campaigns[id];
    }
}
