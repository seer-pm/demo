// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

interface IERC20 {
    function symbol() external view returns (string memory);

    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    function transfer(address to, uint256 amount) external returns (bool);

    function approve(address spender, uint256 amount) external returns (bool);

    function balanceOf(address owner) external returns (uint256);

    function totalSupply() external view returns (uint256);
}

// https://github.com/RealityETH/reality-eth-monorepo/blob/main/packages/contracts/flat/RealityETH-3.0.sol
interface IRealityETH_v3_0 {
    function askQuestionWithMinBond(
        uint256 template_id,
        string memory question,
        address arbitrator,
        uint32 timeout,
        uint32 opening_ts,
        uint256 nonce,
        uint256 min_bond
    ) external payable returns (bytes32);

    function resultForOnceSettled(bytes32 question_id) external view returns (bytes32);

    function getContentHash(bytes32 question_id) external view returns (bytes32);

    function getTimeout(bytes32 question_id) external view returns (uint32);

    function submitAnswer(bytes32 question_id, bytes32 answer, uint256 max_previous) external payable;
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

interface IWrapped1155Factory {
    function requireWrapped1155(
        /*IERC1155*/
        address multiToken,
        uint256 tokenId,
        bytes calldata data
    ) external /*Wrapped1155*/ returns (IERC20);

    function unwrap(
        /*IERC1155*/
        address multiToken,
        uint256 tokenId,
        uint256 amount,
        address recipient,
        bytes calldata data
    ) external;
}
