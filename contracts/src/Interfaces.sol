// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

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

    function getContentHash(
        bytes32 question_id
    ) external view returns (bytes32);

    function getTimeout(bytes32 question_id) external view returns (uint32);
}

interface IRealityProxy {
    function resolve(
        bytes32 questionId,
        uint256 templateId,
        string calldata question,
        uint256 numOutcomes
    ) external;
}

interface IRealityRegistry {
    function registerQuestion(
        bytes32 question_id,
        uint256 template_id,
        uint32 opening_ts,
        string calldata title,
        string calldata outcomes,
        string calldata category,
        string calldata language
    ) external;

    function getQuestion(
        uint256 templateId,
        string calldata title,
        string calldata outcomes,
        string calldata category,
        string calldata language
    ) external view returns (string memory question);
}

interface IConditionalTokens {
    function prepareCondition(
        address oracle,
        bytes32 questionId,
        uint outcomeSlotCount
    ) external;

    function getConditionId(
        address oracle,
        bytes32 questionId,
        uint outcomeSlotCount
    ) external pure returns (bytes32);

    function getCollectionId(
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint indexSet
    ) external view returns (bytes32);

    function getPositionId(
        address collateralToken,
        bytes32 collectionId
    ) external pure returns (uint);

    function getOutcomeSlotCount(
        bytes32 conditionId
    ) external view returns (uint);
}

interface Wrapped1155Factory {
    function requireWrapped1155(
        /*IERC1155*/ address multiToken,
        uint256 tokenId,
        bytes calldata data
    ) external returns (/*Wrapped1155*/ address);
}

interface IMavFactory {
    function create(
        uint256 _fee,
        uint256 _tickSpacing,
        int256 _lookback,
        int32 _activeTick,
        address _tokenA,
        address _tokenB
    ) external returns (address);
}
