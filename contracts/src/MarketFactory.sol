// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./Market.sol";
import "./RealityProxy.sol";
import {IRealityETH_v3_0, IConditionalTokens, Wrapped1155Factory, IMavFactory} from "./Interfaces.sol";

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

    uint32 public constant QUESTION_TIMEOUT = 1.5 days;

    address public immutable arbitrator;
    IRealityETH_v3_0 public immutable realitio;
    Wrapped1155Factory public immutable wrapped1155Factory;
    IConditionalTokens public immutable conditionalTokens;
    address public immutable collateralToken;
    RealityProxy public immutable realityProxy;
    IMavFactory public immutable mavFactory;
    address public governor;
    address[] public markets;
    address public market;

    // this needs to be the same ERC20_DATA used by Router
    bytes internal constant ERC20_DATA =
        hex"5365657200000000000000000000000000000000000000000000000000000008534545520000000000000000000000000000000000000000000000000000000812";

    event NewMarket(address indexed market);

    /**
     *  @dev Constructor.
     *  @param _market Address of the market contract that is going to be used for each new deployment.
     *  @param _arbitrator Address of the arbitrator that is going to resolve Realitio disputes.
     *  @param _realitio Address of the Realitio implementation.
     *  @param _wrapped1155Factory Address of the Wrapped1155Factory implementation.
     *  @param _conditionalTokens Address of the ConditionalTokens implementation.
     *  @param _collateralToken Address of the collateral token.
     *  @param _realityProxy Address of the RealityProxy implementation.
     *  @param _mavFactory Address of the Maverick Factory implementation.
     *  @param _governor Address of the governor of this contract.
     */
    constructor(
        address _market,
        address _arbitrator,
        IRealityETH_v3_0 _realitio,
        Wrapped1155Factory _wrapped1155Factory,
        IConditionalTokens _conditionalTokens,
        address _collateralToken,
        RealityProxy _realityProxy,
        IMavFactory _mavFactory,
        address _governor
    ) {
        market = _market;
        arbitrator = _arbitrator;
        realitio = _realitio;
        wrapped1155Factory = _wrapped1155Factory;
        conditionalTokens = _conditionalTokens;
        collateralToken = _collateralToken;
        realityProxy = _realityProxy;
        mavFactory = _mavFactory;
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

    function createScalarMarket(
        CreateMarketParams memory params
    ) external returns (address) {
        require(params.upperBound > params.lowerBound, "Invalid bounds");

        (bytes32 questionId, bytes32 conditionId) = setUpQuestionAndCondition(
            params.encodedQuestions[0],
            REALITY_UINT_TEMPLATE,
            params.openingTime,
            params.minBond,
            2,
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

        address[] memory pools = deployERC20Positions(
            config.conditionId,
            config.outcomeSlotCount
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
            realityProxy,
            pools
        );

        emit NewMarket(address(instance));
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
        uint256 outcomeSlotCount
    ) internal returns (address[] memory) {
        address[] memory pools = new address[](outcomeSlotCount);
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

            address wrapped1155 = address(
                wrapped1155Factory.requireWrapped1155(
                    address(conditionalTokens),
                    tokenId,
                    ERC20_DATA
                )
            );

            (address token0, address token1) = wrapped1155 < collateralToken
                ? (wrapped1155, collateralToken)
                : (collateralToken, wrapped1155);
            pools[j] = mavFactory.create(
                300000000000000,
                10,
                10800000000000000000000,
                17,
                token0,
                token1
            );
        }

        return pools;
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
