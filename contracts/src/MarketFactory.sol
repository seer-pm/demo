// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./Market.sol";
import "./RealityProxy.sol";
import "./WrappedERC20Factory.sol";
import {IRealityETH_v3_0, IConditionalTokens} from "./Interfaces.sol";

contract MarketFactory {
    using Clones for address;

    struct CreateMarketParams {
        string marketName;
        string[] encodedQuestions;
        string[] outcomes;
        uint256 lowerBound;
        uint256 upperBound;
        uint256 minBond;
        uint32 openingTime;
        string[] tokenNames;
    }

    struct InternalMarketConfig {
        bytes32 questionId;
        bytes32[] questionsIds;
        bytes32 conditionId;
        uint256 outcomeSlotCount;
        uint256 templateId;
    }

    uint256 internal constant REALITY_UINT_TEMPLATE = 1;
    uint256 internal constant REALITY_SINGLE_SELECT_TEMPLATE = 2;
    uint256 internal constant REALITY_MULTI_SELECT_TEMPLATE = 3;

    uint32 public constant QUESTION_TIMEOUT = 1.5 days;

    address public immutable arbitrator;
    IRealityETH_v3_0 public immutable realitio;
    WrappedERC20Factory public immutable wrappedERC20Factory;
    IConditionalTokens public immutable conditionalTokens;
    address public immutable collateralToken;
    RealityProxy public immutable realityProxy;
    address public governor;
    address[] public markets;
    address public market;

    event NewMarket(
        address indexed market,
        string marketName,
        string[] outcomes,
        uint256 lowerBound,
        uint256 upperBound,
        bytes32 conditionId,
        bytes32 questionId,
        bytes32[] questionsIds,
        uint256 templateId,
        string[] encodedQuestions
    );

    /**
     *  @dev Constructor.
     *  @param _market Address of the market contract that is going to be used for each new deployment.
     *  @param _arbitrator Address of the arbitrator that is going to resolve Realitio disputes.
     *  @param _realitio Address of the Realitio implementation.
     *  @param _wrappedERC20Factory Address of the WrappedERC20Factory implementation.
     *  @param _conditionalTokens Address of the ConditionalTokens implementation.
     *  @param _collateralToken Address of the collateral token.
     *  @param _realityProxy Address of the RealityProxy implementation.
     *  @param _governor Address of the governor of this contract.
     */
    constructor(
        address _market,
        address _arbitrator,
        IRealityETH_v3_0 _realitio,
        WrappedERC20Factory _wrappedERC20Factory,
        IConditionalTokens _conditionalTokens,
        address _collateralToken,
        RealityProxy _realityProxy,
        address _governor
    ) {
        market = _market;
        arbitrator = _arbitrator;
        realitio = _realitio;
        wrappedERC20Factory = _wrappedERC20Factory;
        conditionalTokens = _conditionalTokens;
        collateralToken = _collateralToken;
        realityProxy = _realityProxy;
        governor = _governor;
    }

    function changeGovernor(address _governor) external {
        require(msg.sender == governor, "Not authorized");
        governor = _governor;
    }

    function changeMarket(address _market) external {
        require(msg.sender == governor, "Not authorized");
        market = _market;
    }

    function createCategoricalMarket(
        CreateMarketParams memory params
    ) external returns (address) {
        require(params.outcomes.length >= 2, "Invalid outcomes count");

        (bytes32 questionId, bytes32 conditionId) = setUpQuestionAndCondition(
            params.encodedQuestions[0],
            REALITY_SINGLE_SELECT_TEMPLATE,
            params.openingTime,
            params.minBond,
            params.outcomes.length,
            address(realityProxy)
        );

        bytes32[] memory questionsIds = new bytes32[](1);
        questionsIds[0] = questionId;

        address marketId = createMarket(
            params,
            InternalMarketConfig({
                questionId: questionId,
                questionsIds: questionsIds,
                conditionId: conditionId,
                outcomeSlotCount: params.outcomes.length,
                templateId: REALITY_SINGLE_SELECT_TEMPLATE
            })
        );

        return marketId;
    }

    function createMultiCategoricalMarket(
        CreateMarketParams memory params
    ) external returns (address) {
        require(params.outcomes.length >= 2, "Invalid outcomes count");

        (bytes32 questionId, bytes32 conditionId) = setUpQuestionAndCondition(
            params.encodedQuestions[0],
            REALITY_MULTI_SELECT_TEMPLATE,
            params.openingTime,
            params.minBond,
            params.outcomes.length,
            address(realityProxy)
        );

        bytes32[] memory questionsIds = new bytes32[](1);
        questionsIds[0] = questionId;

        address marketId = createMarket(
            params,
            InternalMarketConfig({
                questionId: questionId,
                questionsIds: questionsIds,
                conditionId: conditionId,
                outcomeSlotCount: params.outcomes.length,
                templateId: REALITY_MULTI_SELECT_TEMPLATE
            })
        );

        return marketId;
    }

    function createScalarMarket(
        CreateMarketParams memory params
    ) external returns (address) {
        require(params.upperBound > params.lowerBound, "Invalid bounds");
        // values reserved by Reality for INVALID and UNRESOLVED_ANSWER
        require(
            params.upperBound < type(uint256).max - 2,
            "Invalid high point"
        );
        require(params.outcomes.length == 2, "Invalid outcomes");

        (bytes32 questionId, bytes32 conditionId) = setUpQuestionAndCondition(
            params.encodedQuestions[0],
            REALITY_UINT_TEMPLATE,
            params.openingTime,
            params.minBond,
            params.outcomes.length,
            address(realityProxy)
        );

        bytes32[] memory questionsIds = new bytes32[](1);
        questionsIds[0] = questionId;

        address marketId = createMarket(
            params,
            InternalMarketConfig({
                questionId: questionId,
                questionsIds: questionsIds,
                conditionId: conditionId,
                outcomeSlotCount: 2,
                templateId: REALITY_UINT_TEMPLATE
            })
        );

        return marketId;
    }

    function createMultiScalarMarket(
        CreateMarketParams memory params
    ) external returns (address) {
        require(
            params.outcomes.length == params.encodedQuestions.length,
            "Lenght mismatch"
        );

        bytes32[] memory questionsIds = new bytes32[](params.outcomes.length);

        bytes32 questionId = bytes32(0);

        for (uint256 i = 0; i < params.outcomes.length; i++) {
            questionsIds[i] = askRealityQuestion(
                params.encodedQuestions[i],
                REALITY_UINT_TEMPLATE,
                params.openingTime,
                params.minBond
            );

            questionId = keccak256(
                abi.encodePacked(questionId, questionsIds[i])
            );
        }

        bytes32 conditionId = prepareCondition(
            questionId,
            params.outcomes.length,
            address(realityProxy)
        );

        address marketId = createMarket(
            params,
            InternalMarketConfig({
                questionId: questionId,
                questionsIds: questionsIds,
                conditionId: conditionId,
                outcomeSlotCount: params.outcomes.length,
                templateId: REALITY_UINT_TEMPLATE
            })
        );

        return marketId;
    }

    function setUpQuestionAndCondition(
        string memory question,
        uint256 templateId,
        uint32 openingTime,
        uint256 minBond,
        uint256 outcomeSlotCount,
        address oracle
    ) internal returns (bytes32 questionId, bytes32 conditionId) {
        questionId = askRealityQuestion(
            question,
            templateId,
            openingTime,
            minBond
        );

        conditionId = prepareCondition(questionId, outcomeSlotCount, oracle);
    }

    function createMarket(
        CreateMarketParams memory params,
        InternalMarketConfig memory config
    ) internal returns (address) {
        Market instance = Market(market.clone());

        deployERC20Positions(
            config.conditionId,
            config.outcomeSlotCount,
            params.tokenNames
        );
        instance.initialize(
            params.marketName,
            params.outcomes,
            params.lowerBound,
            params.upperBound,
            config.conditionId,
            config.questionId,
            config.questionsIds,
            config.templateId,
            params.encodedQuestions,
            realityProxy
        );

        emit NewMarket(
            address(instance),
            params.marketName,
            params.outcomes,
            params.lowerBound,
            params.upperBound,
            config.conditionId,
            config.questionId,
            config.questionsIds,
            config.templateId,
            params.encodedQuestions
        );
        markets.push(address(instance));

        return address(instance);
    }

    function askRealityQuestion(
        string memory question,
        uint256 templateId,
        uint32 openingTime,
        uint256 minBond
    ) internal returns (bytes32) {
        bytes32 content_hash = keccak256(
            abi.encodePacked(templateId, openingTime, question)
        );

        bytes32 question_id = keccak256(
            abi.encodePacked(
                content_hash,
                arbitrator,
                QUESTION_TIMEOUT,
                minBond,
                address(realitio),
                address(this),
                uint256(0)
            )
        );

        if (realitio.getTimeout(question_id) != 0) {
            return question_id;
        }

        return
            realitio.askQuestionWithMinBond(
                templateId,
                question,
                arbitrator,
                QUESTION_TIMEOUT,
                openingTime,
                0,
                minBond
            );
    }

    function prepareCondition(
        bytes32 questionId,
        uint outcomeSlotCount,
        address oracle
    ) internal returns (bytes32) {
        conditionalTokens.prepareCondition(
            oracle,
            questionId,
            outcomeSlotCount
        );

        return
            conditionalTokens.getConditionId(
                oracle,
                questionId,
                outcomeSlotCount
            );
    }

    function deployERC20Positions(
        bytes32 conditionId,
        uint256 outcomeSlotCount,
        string[] memory tokenNames
    ) internal {
        uint[] memory partition = generateBasicPartition(outcomeSlotCount);
        for (uint j = 0; j < partition.length; j++) {
            bytes32 collectionId = conditionalTokens.getCollectionId(
                bytes32(0),
                conditionId,
                partition[j]
            );
            uint256 tokenId = conditionalTokens.getPositionId(
                collateralToken,
                collectionId
            );

            require(bytes(tokenNames[j]).length != 0);

            wrappedERC20Factory.createWrappedToken(
                address(conditionalTokens),
                tokenId,
                tokenNames[j],
                tokenNames[j]
            );
        }
    }

    function generateBasicPartition(
        uint outcomeSlotCount
    ) private pure returns (uint[] memory partition) {
        partition = new uint[](outcomeSlotCount);
        for (uint i = 0; i < outcomeSlotCount; i++) {
            partition[i] = 1 << i;
        }
    }

    function allMarkets() external view returns (address[] memory) {
        return markets;
    }

    function marketCount() external view returns (uint256) {
        return markets.length;
    }
}
