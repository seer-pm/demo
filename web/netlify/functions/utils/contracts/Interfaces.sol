
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IUniswapV2Router {
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity);
}

interface IRouter {
    function splitPosition(
        address collateral, 
        address market, 
        uint256 amount
    ) external;
}

interface IMarket {
    /// @dev Market initialization parameters
    struct RealityParams {
        bytes32[] questionsIds;
        uint256 templateId;
        string[] encodedQuestions;
    }

    /// @dev Conditional Tokens parameters
    struct ConditionalTokensParams {
        bytes32 conditionId;
        bytes32 parentCollectionId;
        uint256 parentOutcome;
        address parentMarket;
        bytes32 questionId;
        IERC20[] wrapped1155;
        bytes[] data;
    }

    /// @dev Initialize the market
    function initialize(
        string memory _marketName,
        string[] memory _outcomes,
        uint256 _lowerBound,
        uint256 _upperBound,
        ConditionalTokensParams memory _conditionalTokensParams,
        RealityParams memory _realityParams,
        address _realityProxy
    ) external;

    /// @dev Getter for template ID
    function templateId() external view returns (uint256);

    /// @dev Getter for questions IDs
    function questionsIds() external view returns (bytes32[] memory);

    /// @dev Getter for encoded questions
    function encodedQuestions(uint256 index) external view returns (string memory);

    /// @dev Getter for question ID
    function questionId() external view returns (bytes32);

    /// @dev Getter for condition ID
    function conditionId() external view returns (bytes32);

    /// @dev Getter for parent collection ID
    function parentCollectionId() external view returns (bytes32);

    /// @dev Getter for parent market
    function parentMarket() external view returns (address);

    /// @dev Getter for parent outcome
    function parentOutcome() external view returns (uint256);

    /// @dev Getter for wrapped outcome
    function wrappedOutcome(uint256 index) external view returns (IERC20 wrapped1155, bytes memory data);

    /// @dev Getter for parent wrapped outcome
    function parentWrappedOutcome() external view returns (IERC20 wrapped1155, bytes memory data);

    /// @dev Getter for number of outcomes
    function numOutcomes() external view returns (uint256);

    /// @dev Resolve the market
    function resolve() external;

    /// @dev Public getters for market properties
    function marketName() external view returns (string memory);
    function outcomes(uint256 index) external view returns (string memory);
    function lowerBound() external view returns (uint256);
    function upperBound() external view returns (uint256);
    function initialized() external view returns (bool);
}

interface IConditionalTokens {
    function payoutNumerators(bytes32 conditionId, uint256 index) external view returns (uint256);

    function payoutDenominator(bytes32 conditionId) external view returns (uint256);

    function prepareCondition(address oracle, bytes32 questionId, uint256 outcomeSlotCount) external;

    function reportPayouts(bytes32 questionId, uint256[] calldata payouts) external;

    function splitPosition(
        /*IERC20*/
        address collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256[] calldata partition,
        uint256 amount
    ) external;

    function mergePositions(
        /*IERC20*/
        address collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256[] calldata partition,
        uint256 amount
    ) external;

    function redeemPositions(
        /*IERC20*/
        address collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256[] calldata indexSets
    ) external;

    function getConditionId(
        address oracle,
        bytes32 questionId,
        uint256 outcomeSlotCount
    ) external pure returns (bytes32);

    function getCollectionId(
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256 indexSet
    ) external view returns (bytes32);

    function getPositionId(address collateralToken, bytes32 collectionId) external pure returns (uint256);

    function getOutcomeSlotCount(bytes32 conditionId) external view returns (uint256);

    function safeTransferFrom(address from, address to, uint256 id, uint256 value, bytes calldata data) external;

    function balanceOf(address owner, uint256 id) external view returns (uint256);
}