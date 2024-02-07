// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./Market.sol";
import {IRealityETH_v3_0, IConditionalTokens, IRealityProxy, Wrapped1155Factory, IMavFactory} from "./Interfaces.sol";

contract MarketFactory {
    using Clones for address;

    struct CreateMarketParams {
        string marketName;
        string encodedQuestion;
        string[] outcomes;
        uint256 minBond;
        uint256 templateId;
        uint32 openingTime;
    }

    uint32 public constant QUESTION_TIMEOUT = 1.5 days;

    address public immutable arbitrator;
    IRealityETH_v3_0 public immutable realitio;
    Wrapped1155Factory public immutable wrapped1155Factory;
    IConditionalTokens public immutable conditionalTokens;
    address public immutable collateralToken;
    IRealityProxy public immutable oracle;
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
     *  @param _oracle Address of the Oracle implementation.
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
        IRealityProxy _oracle,
        IMavFactory _mavFactory,
        address _governor
    ) {
        market = _market;
        arbitrator = _arbitrator;
        realitio = _realitio;
        wrapped1155Factory = _wrapped1155Factory;
        conditionalTokens = _conditionalTokens;
        collateralToken = _collateralToken;
        oracle = _oracle;
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

    function createMarket(
        CreateMarketParams memory params
    ) external returns (address) {
        bytes32 questionId = askRealityQuestion(
            params.encodedQuestion,
            params.templateId,
            params.openingTime,
            params.minBond
        );

        bytes32 conditionId = prepareCondition(
            questionId,
            params.outcomes.length
        );

        address[] memory pools = deployERC20Positions(
            conditionId,
            params.outcomes.length
        );

        Market instance = Market(market.clone());
        instance.initialize(
            params.marketName,
            params.outcomes,
            conditionId,
            questionId,
            params.templateId,
            params.encodedQuestion,
            oracle,
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
        uint outcomeSlotCount
    ) internal returns (bytes32) {
        conditionalTokens.prepareCondition(
            address(oracle),
            questionId,
            outcomeSlotCount
        );

        return
            conditionalTokens.getConditionId(
                address(oracle),
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
