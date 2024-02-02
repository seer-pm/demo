// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Market} from "./Market.sol";
import {IConditionalTokens} from "./Interfaces.sol";

contract MarketView {
    function getMarket(
        IConditionalTokens conditionalTokens,
        address marketId
    )
        public
        view
        returns (
            string memory,
            string[] memory,
            bytes32,
            bytes32,
            uint256,
            string memory,
            address,
            address[] memory
        )
    {
        Market market = Market(marketId);

        bytes32 conditionId = market.conditionId();

        uint256 outcomeSlotCount = conditionalTokens.getOutcomeSlotCount(
            conditionId
        );

        string[] memory outcomes = new string[](outcomeSlotCount);
        address[] memory pools = new address[](outcomeSlotCount);

        for (uint256 i = 0; i < outcomeSlotCount; i++) {
            outcomes[i] = market.outcomes(i);
            pools[i] = market.pools(i);
        }

        return (
            market.marketName(),
            outcomes,
            conditionId,
            market.questionId(),
            market.templateId(),
            market.encodedQuestion(),
            address(market.oracle()),
            pools
        );
    }
}
