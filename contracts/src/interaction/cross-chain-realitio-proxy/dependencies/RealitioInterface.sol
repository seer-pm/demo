/* solhint-disable var-name-mixedcase */
// SPDX-License-Identifier: MIT

/** Interface of https://github.com/realitio/realitio-contracts/blob/master/truffle/contracts/Realitio_v2_1.sol original contract is to be reviewed.
 *  @reviewers: [@hbarcelos, @fnanni-0, @nix1g, @unknownunknown1, @ferittuncer, @madhurMongia]
 *  @auditors: []
 *  @bounties: []
 *  @deployments: []
 */

pragma solidity ^0.7.2;

interface RealitioInterface {
    event LogNewAnswer(
        bytes32 answer,
        bytes32 indexed question_id,
        bytes32 history_hash,
        address indexed user,
        uint256 bond,
        uint256 ts,
        bool is_commitment
    );

    event LogNewTemplate(uint256 indexed template_id, address indexed user, string question_text);

    event LogNewQuestion(
        bytes32 indexed question_id,
        address indexed user,
        uint256 template_id,
        string question,
        bytes32 indexed content_hash,
        address arbitrator,
        uint32 timeout,
        uint32 opening_ts,
        uint256 nonce,
        uint256 created
    );

    /**
     * @dev The arbitrator contract is trusted to only call this if they've been paid, and tell us who paid them.
     * @notice Notify the contract that the arbitrator has been paid for a question, freezing it pending their decision.
     * @param question_id The ID of the question.
     * @param requester The account that requested arbitration.
     * @param max_previous If specified, reverts if a bond higher than this was submitted after you sent your transaction.
     */
    function notifyOfArbitrationRequest(
        bytes32 question_id,
        address requester,
        uint256 max_previous
    ) external;

    /**
     * @notice Cancel a previously-requested arbitration and extend the timeout
     * @dev Useful when doing arbitration across chains that can't be requested atomically
     * @param question_id The ID of the question
     */
    function cancelArbitration(bytes32 question_id) external;

    /**
     * @notice Submit the answer for a question, for use by the arbitrator, working out the appropriate winner based on the last answer details.
     * @dev Doesn't require (or allow) a bond.
     * @param question_id The ID of the question
     * @param answer The answer, encoded into bytes32
     * @param payee_if_wrong The account to be credited as winner if the last answer given is wrong, usually the account that paid the arbitrator
     * @param last_history_hash The history hash before the final one
     * @param last_answer_or_commitment_id The last answer given, or the commitment ID if it was a commitment.
     * @param last_answerer The address that supplied the last answer
     */
    function assignWinnerAndSubmitAnswerByArbitrator(
        bytes32 question_id,
        bytes32 answer,
        address payee_if_wrong,
        bytes32 last_history_hash,
        bytes32 last_answer_or_commitment_id,
        address last_answerer
    ) external;
}
