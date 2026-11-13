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

contract FutarchyCategoricalRealityProxy {
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

    /// @dev Resolves the specified proposal: answer i pays slot i, and Invalid or an answer >= N pays slot N (INVALID).
    /// @param proposal Proposal to resolve. UNTRUSTED.
    function resolve(FutarchyProposal proposal) external {
        bytes32 questionId = proposal.questionId();
        uint256 numOutcomes = proposal.numOutcomes();

        uint256 answer = uint256(realitio.resultForOnceSettled(questionId));
        uint256[] memory payouts = new uint256[](numOutcomes + 1);

        payouts[answer < numOutcomes ? answer : numOutcomes] = 1;

        conditionalTokens.reportPayouts(questionId, payouts);
    }
}
