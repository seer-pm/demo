/**
 *  @authors: [@xyzseer]
 *  @reviewers: []
 *  @auditors: []
 *  @bounties: []
 *  @deployments: []
 */

// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./FutarchyProposal.sol";
import {IConditionalTokens, IRealityETH_v3_0} from "./Interfaces.sol";

contract FutarchyRealityProxy {
    /// @dev Conditional Tokens contract.
    IConditionalTokens public immutable conditionalTokens;
    /// @dev Reality.eth contract.
    IRealityETH_v3_0 public immutable realitio;

    /// @dev Constructor.
    /// @param _conditionalTokens Conditional Tokens contract address.
    /// @param _realitio Reality.eth contract address.
    constructor(IConditionalTokens _conditionalTokens, IRealityETH_v3_0 _realitio) {
        conditionalTokens = _conditionalTokens;
        realitio = _realitio;
    }

    /// @dev Resolves the specified proposal.
    /// @param proposal Proposal to resolve. UNTRUSTED.
    function resolve(FutarchyProposal proposal) external {
        bytes32 questionId = proposal.questionId();

        uint256 answer = uint256(realitio.resultForOnceSettled(questionId));
        uint256[] memory payouts = new uint256[](2);

        // FutarchyFactory prepares the condition with two outcomes (YES / NO)
        if (answer == 0) {
            // accept proposal if result is YES
            payouts[0] = 1;
        } else {
            // reject proposal if result is NO or INVALID
            payouts[1] = 1;
        }

        conditionalTokens.reportPayouts(questionId, payouts);
    }
}
