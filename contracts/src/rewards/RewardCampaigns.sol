// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

interface IRewardsRoot {
    function root() external view returns (bytes32);
}

/// @title RewardCampaigns
/// @notice Liquidity reward campaigns of Seer's Uniswap V4 pools on this chain, and the escrow of their budgets.
/// Rewards pay out on the pool's chain, so there is one registry per chain with pools, next to that chain's Morpho
/// Universal Rewards Distributor. The weekly rewards bot (`packages/seer-pm-rewards`) rebuilds the campaigns from `CampaignSet`
/// events up to each Monday cutoff and submits a root with what users can claim and what each campaign emitted.
/// Once the distributor accepts that root, `release` pays the distributor the emitted totals it proves.
/// @dev A manager creates a campaign without depositing anything, and it earns from that block on. Its budget is
/// deposited later, at any time and also after the campaign ended, by whichever manager calls `fund`, who becomes its
/// funder: until then its creator is. Until it is funded the bot keeps it out of every root, so no claim, release or
/// settlement counts on tokens the registry does not hold, and the first root after `fund` pays everything it earned.
/// The engine never emits more than the budget, so the distributor can always be paid in full, and what was not
/// emitted goes back to the funder once the campaign ended. More rewards for a pool are a new campaign on the same
/// pool, so a budget never mixes the tokens of two wallets. The bot refuses campaign changes that would alter what an
/// already published week emitted, and every change here takes effect from the block that makes it, so none can:
/// - A campaign is never removed, and its pool, reward token and `minWidthTicks` never change. Its funder changes
///   once, when it is funded. Its budget only drops, when a refund sends what the campaign cannot emit back to the
///   funder, or before the deposit, when ending the campaign lowers what `fund` takes.
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
        uint256 budget; // Total the campaign may ever emit, held here once funded until it is released or refunded.
        uint32 minWidthTicks; // Positions narrower than this (`tickUpper - tickLower`) neither earn nor dilute.
        address funder; // Controls the rate and receives refunds: the creator until `fund`, then whoever funded it.
        bool funded; // Whether the budget was deposited. Until then nothing is released or refunded.
        uint256 released; // Cumulative amount transferred to the distributor.
        Rate[] rates; // Strictly increasing `from`; the first one is the start of the campaign.
    }

    address public immutable distributor; // This chain's Universal Rewards Distributor.
    address public owner; // Appoints managers.
    mapping(address => bool) public isManager; // Accounts that create campaigns.
    Campaign[] internal campaigns; // Campaign id = index.

    /// @dev Snapshots the earning rules and budget. Subsequent payouts update `released` through `Released` only.
    event CampaignSet(uint256 indexed id, Campaign campaign);
    /// @param upTo The cutoff supplied for this call, including corrections to earlier cutoffs.
    event Released(uint256 indexed id, uint256 amount, uint256 released, uint64 upTo);
    event Refunded(uint256 indexed id, address indexed funder, uint256 amount);
    event ManagerSet(address indexed account, bool active);
    event OwnerSet(address indexed owner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner");
        _;
    }

    modifier onlyManager() {
        require(isManager[msg.sender], "Only a manager");
        _;
    }

    /// @param _distributor This chain's Universal Rewards Distributor.
    /// @param _owner The owner of the registry, usually a Safe.
    /// @param _managers The initial managers.
    constructor(address _distributor, address _owner, address[] memory _managers) {
        distributor = _distributor;
        owner = _owner;
        emit OwnerSet(_owner);
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

    /// @notice Creates a campaign that emits `perSecond` from this block on, up to `budget` in total. Nothing is
    /// deposited: the caller controls it until a manager funds it with `fund`.
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
        require(budget <= type(uint128).max, "Budget too large");
        require(perSecond <= budget, "Rate over budget");
        require(minWidthTicks <= MAX_WIDTH_TICKS, "Width too wide");

        id = campaigns.length;
        Campaign storage campaign = campaigns.push();
        campaign.funder = msg.sender;
        campaign.poolId = poolId;
        campaign.rewardToken = rewardToken;
        campaign.budget = budget;
        campaign.minWidthTicks = minWidthTicks;
        campaign.rates.push(Rate(uint64(block.timestamp), perSecond));
        emit CampaignSet(id, campaign);
    }

    /// @notice Deposits campaign `id`'s budget from the caller, who must have approved this contract for it and
    /// becomes the campaign's funder: it controls the rate from now on and receives the refunds. A campaign is funded
    /// once, at any time, also after it ended, and the first root after this pays everything it earned.
    function fund(uint256 id) external onlyManager {
        Campaign storage campaign = _campaign(id);
        require(!campaign.funded, "Already funded");
        campaign.funded = true;
        campaign.funder = msg.sender;
        emit CampaignSet(id, campaign);
        IERC20(campaign.rewardToken).safeTransferFrom(msg.sender, address(this), campaign.budget);
    }

    /// @notice Sets the rate from this block on. A rate of 0 ends the campaign for good: more rewards for the pool
    /// are a new campaign.
    /// @dev A rate is at most the budget, which fits in 128 bits, so `release` and `settleRefund` multiply it by a
    /// `uint64` span of seconds without overflowing; one overflowing campaign would revert the weekly release of every
    /// campaign on the chain.
    function setRate(uint256 id, uint256 perSecond) external {
        Campaign storage campaign = _campaign(id);
        require(msg.sender == campaign.funder, "Only the funder");
        require(perSecond <= campaign.budget, "Rate over budget");
        Rate storage last = campaign.rates[campaign.rates.length - 1];
        require(last.perSecond != 0, "Campaign ended");
        // Rates are keyed by timestamp, so a second change in the same block replaces the first.
        if (last.from == block.timestamp) last.perSecond = perSecond;
        else campaign.rates.push(Rate(uint64(block.timestamp), perSecond));
        if (perSecond == 0) _refund(id, campaign, _maxEmission(campaign.rates, uint64(block.timestamp)));
        emit CampaignSet(id, campaign);
    }

    /// @notice Sends the distributor what campaigns `ids` emitted up to the weekly cutoff `upTo`, given as the
    /// cumulative `emitted` of each, so a repeated call sends nothing more. Anyone may call it.
    /// @dev Each total must be a release leaf of the root the distributor accepted, so it went through the
    /// distributor's timelock and its owner's veto like the claims it pays. The key that proposes roots therefore
    /// cannot pay out escrow at once, and every total is also bounded by the integral of the rates up to `upTo`.
    function release(uint256[] calldata ids, uint256[] calldata emitted, uint64 upTo, bytes32[][] calldata proofs)
        external
    {
        require(ids.length == emitted.length && ids.length == proofs.length, "Length mismatch");
        require(upTo <= block.timestamp, "Cutoff in the future");
        bytes32 root = IRewardsRoot(distributor).root();
        for (uint256 i = 0; i < ids.length; i++) {
            Campaign storage campaign = _campaign(ids[i]);
            // Every campaign of a token shares one balance, so an unfunded one would be paid from the others' escrow.
            require(campaign.funded, "Not funded");
            require(emitted[i] <= campaign.budget, "Over budget");
            require(emitted[i] <= _maxEmission(campaign.rates, upTo), "Over rate");
            // The tag keeps this leaf apart from a settlement leaf, whose words have the same types after it.
            bytes32 leaf = keccak256(
                bytes.concat(keccak256(abi.encode("release", block.chainid, address(this), ids[i], upTo, emitted[i])))
            );
            require(MerkleProof.verifyCalldata(proofs[i], root, leaf), "Invalid release proof");
            uint256 amount = emitted[i] > campaign.released ? emitted[i] - campaign.released : 0;
            if (amount > 0) {
                campaign.released = emitted[i];
                IERC20(campaign.rewardToken).safeTransfer(distributor, amount);
            }
            emit Released(ids[i], amount, campaign.released, upTo);
        }
    }

    /// @notice Returns the remaining escrow to the funder once the accepted distribution covers the end.
    function settleRefund(uint256 id, uint256 emitted, bytes32[] calldata proof) external {
        Campaign storage campaign = _campaign(id);
        Rate storage end = campaign.rates[campaign.rates.length - 1];
        require(end.perSecond == 0, "Campaign not ended");
        require(campaign.funded, "Not funded");
        uint256 paid = campaign.released;
        require(emitted <= paid, "Not released");
        // The five-word preimage cannot be read as a three-word URD claim or an eight-word release leaf. Bind to this
        // deployment and end.
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(block.chainid, address(this), id, end.from, emitted))));
        require(MerkleProof.verifyCalldata(proof, IRewardsRoot(distributor).root(), leaf), "Invalid settlement proof");
        if (_refund(id, campaign, paid)) emit CampaignSet(id, campaign);
    }

    function _refund(uint256 id, Campaign storage campaign, uint256 keep) private returns (bool) {
        if (keep >= campaign.budget) return false;
        uint256 amount = campaign.budget - keep;
        campaign.budget = keep;
        // Before the deposit there is nothing to send back: the lower budget is what `fund` will take.
        if (!campaign.funded) return true;
        emit Refunded(id, campaign.funder, amount);
        IERC20(campaign.rewardToken).safeTransfer(campaign.funder, amount);
        return true;
    }

    function campaignCount() external view returns (uint256) {
        return campaigns.length;
    }

    function getCampaign(uint256 id) external view returns (Campaign memory) {
        return _campaign(id);
    }

    /// @notice The campaigns with ids from `from` up to, but not including, `to`, in id order.
    /// @dev Each campaign carries its whole rate history, so one call returning every campaign would outgrow an
    /// `eth_call` gas cap as campaigns accumulate. A `to` past the last campaign stops at it and an empty range
    /// returns nothing, so a reader pages with a fixed size from `campaignCount`.
    function getCampaigns(uint256 from, uint256 to) external view returns (Campaign[] memory page) {
        if (to > campaigns.length) to = campaigns.length;
        if (from >= to) return page;
        page = new Campaign[](to - from);
        for (uint256 i = from; i < to; i++) {
            page[i - from] = campaigns[i];
        }
    }

    function _maxEmission(Rate[] storage rates, uint64 to) private view returns (uint256 total) {
        for (uint256 i; i < rates.length && rates[i].from < to; i++) {
            uint64 until = i + 1 < rates.length && rates[i + 1].from < to ? rates[i + 1].from : to;
            total += rates[i].perSecond * (until - rates[i].from);
        }
    }

    function _campaign(uint256 id) internal view returns (Campaign storage) {
        require(id < campaigns.length, "Unknown campaign");
        return campaigns[id];
    }
}
