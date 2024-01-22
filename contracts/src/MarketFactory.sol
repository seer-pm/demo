// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./Market.sol";
import {IRealityETH_v3_0, IConditionalTokens, IRealityProxy, Wrapped1155Factory, IUniswapV3Factory} from "./Interfaces.sol";

contract MarketFactory {
    using Clones for address;

    uint32 public constant QUESTION_TIMEOUT = 1.5 days;

    address public immutable arbitrator;
    IRealityETH_v3_0 public immutable realitio;
    Wrapped1155Factory public immutable wrapped1155Factory;
    IConditionalTokens public immutable conditionalTokens;
    address public immutable collateralToken;
    IRealityProxy public immutable oracle;
    IUniswapV3Factory public immutable uniswapv3Factory;
    address public governor;
    address[] public markets;
    address public market;

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
     *  @param _uniswapv3Factory Address of the Uniswapv3Factory implementation.
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
        IUniswapV3Factory _uniswapv3Factory,
        address _governor
    ) {
        market = _market;
        arbitrator = _arbitrator;
        realitio = _realitio;
        wrapped1155Factory = _wrapped1155Factory;
        conditionalTokens = _conditionalTokens;
        collateralToken = _collateralToken;
        oracle = _oracle;
        uniswapv3Factory = _uniswapv3Factory;
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
        string memory marketName,
        string memory encodedQuestion,
        string[] memory outcomes,
        uint256 minBond,
        uint256 templateId,
        uint32 openingTime
    ) external returns (address) {
        bytes32 questionId = askRealityQuestion(
            encodedQuestion,
            templateId,
            openingTime,
            minBond
        );

        bytes32 conditionId = prepareCondition(questionId, outcomes.length);

        deployERC20Positions(conditionId, outcomes.length);

        Market instance = Market(market.clone());
        instance.initialize(
            marketName,
            outcomes,
            conditionId,
            questionId,
            templateId,
            encodedQuestion,
            oracle
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
        bytes32 questionId = realitio.askQuestionWithMinBond(
            templateId,
            question,
            arbitrator,
            QUESTION_TIMEOUT,
            openingTime,
            0,
            minBond
        );

        return questionId;
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
            address wrapped1155 = wrapped1155Factory.requireWrapped1155(
                address(conditionalTokens),
                tokenId,
                ""
            );
            uniswapv3Factory.createPool(wrapped1155, collateralToken, 3000);
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
