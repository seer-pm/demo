/* solhint-disable no-unused-vars */
// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;

import "../dependencies/RealitioInterface.sol";

/**
 * @dev This is a barebones partial implementation of Realitio.
 * This code only exists for purposes of testing and SHOULD NOT be used in production environments.
 */
contract MockRealitio is RealitioInterface {
    enum Status {
        None,
        Open,
        PendingArbitration,
        Finalized
    }

    struct Question {
        Status status;
        address answerer;
        string description;
        bytes32 answer;
        uint256 bond;
        uint256 accumulatedBond;
    }

    address public arbitrator;

    Question[] public questions;

    event MockNewAnswer(
        bytes32 _answer,
        bytes32 indexed _questionId,
        bytes32 _lastHistoryHash,
        address _answerer,
        uint256 _bond,
        uint256 _ts,
        bool _isCommitment
    );

    event MockNewQuestion(bytes32 indexed _questionId, string _description, address indexed _asker);
    event MockFinalize(bytes32 indexed _questionId, bytes32 _finalAnswer);
    event MockNotifyOfArbitrationRequest(bytes32 indexed _questionId, address indexed _requester);
    event MockCancelArbitrationRequest(bytes32 indexed _questionId);

    function setArbitrator(address _arbitrator) external {
        arbitrator = _arbitrator;
    }

    function askQuestion(string calldata _description) external payable {
        Question storage question = questions.push();
        bytes32 questionId = bytes32(questions.length - 1);
        question.status = Status.Open;
        question.description = _description;

        emit MockNewQuestion(questionId, _description, msg.sender);
    }

    function submitAnswer(
        bytes32 _questionId,
        bytes32 _answer,
        uint256 _maxPrevious
    ) external payable {
        Question storage question = questions[uint256(_questionId)];
        require(question.status == Status.Open, "Question is not open");
        require(msg.value > question.bond, "Bond must increase");

        question.answer = _answer;
        question.answerer = msg.sender;
        question.bond = msg.value;
        question.accumulatedBond += msg.value;

        emit MockNewAnswer(_answer, _questionId, bytes32(0), msg.sender, question.bond, block.timestamp, false);
    }

    function finalizeQuestion(bytes32 _questionId) external {
        Question storage question = questions[uint256(_questionId)];
        require(question.status == Status.Open, "Question is not Open");

        question.status = Status.Finalized;

        payable(question.answerer).send(question.accumulatedBond);

        emit MockFinalize(_questionId, question.answer);
    }

    function notifyOfArbitrationRequest(
        bytes32 _questionId,
        address _requester,
        uint256 _maxPrevious
    ) external override {
        Question storage question = questions[uint256(_questionId)];
        require(question.status == Status.Open, "Invalid question status");
        require(question.bond > 0, "Question not answered");
        if (_maxPrevious > 0) {
            require(question.bond <= _maxPrevious, "Bond has changed");
        }

        question.status = Status.PendingArbitration;

        emit MockNotifyOfArbitrationRequest(_questionId, _requester);
    }

    function cancelArbitration(bytes32 _questionId) external override {
        Question storage question = questions[uint256(_questionId)];
        require(question.status == Status.PendingArbitration, "Invalid question status");

        question.status = Status.Open;

        emit MockCancelArbitrationRequest(_questionId);
    }

    function assignWinnerAndSubmitAnswerByArbitrator(
        bytes32 _questionId,
        bytes32 _answer,
        address _payeeIfWrong,
        bytes32 _lastHistoryHash,
        bytes32 _lastAnswerOrCommitmentId,
        address _lastAnswerer
    ) external override {
        Question storage question = questions[uint256(_questionId)];
        require(question.status == Status.PendingArbitration, "Invalid question status");

        question.status = Status.Finalized;

        if (question.answer != _answer) {
            question.answer = _answer;
            question.answerer = _payeeIfWrong;
        }

        payable(question.answerer).send(question.accumulatedBond);

        emit MockFinalize(_questionId, _answer);
    }
}
