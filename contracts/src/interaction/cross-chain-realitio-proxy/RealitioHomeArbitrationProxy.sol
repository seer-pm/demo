// SPDX-License-Identifier: MIT

/**
 *  @authors: [@hbarcelos]
 *  @reviewers: [@ferittuncer, @fnanni-0, @nix1g, @epiqueras*, @clesaege, @unknownunknown1, @madhurMongia, @mani99brar]
 *  @auditors: []
 *  @bounties: []
 *  @deployments: [0xe40DD83a262da3f56976038F1554Fe541Fa75ecd]
 */

pragma solidity ^0.7.2;

import {IAMB} from "./dependencies/IAMB.sol";
import {RealitioInterface} from "./dependencies/RealitioInterface.sol";
import {IForeignArbitrationProxy, IHomeArbitrationProxy} from "./ArbitrationProxyInterfaces.sol";

/**
 * @title Arbitration proxy for Realitio on the side-chain side (A.K.A. the Home Chain).
 * @dev This contract is meant to be deployed to side-chains (i.e.: xDAI) in which Reality.eth is deployed.
 */
contract RealitioHomeArbitrationProxy is IHomeArbitrationProxy {
    /// @dev The address of the Realitio contract (v2.1+ required). TRUSTED.
    RealitioInterface public immutable realitio;

    /// @dev ArbitraryMessageBridge contract address. TRUSTED.
    IAMB public immutable amb;

    /// @dev Address of the counter-party proxy on the Foreign Chain. TRUSTED.
    address public immutable foreignProxy;

    /// @dev The chain ID where the foreign proxy is deployed.
    bytes32 public immutable foreignChainId;

    /// @dev Metadata for Realitio interface.
    string public constant metadata = '{"foreignProxy":true}';

    enum Status {
        None,
        Rejected,
        Notified,
        AwaitingRuling,
        Ruled,
        Finished
    }

    struct Request {
        Status status;
        bytes32 arbitratorAnswer;
    }

    /// @dev Associates an arbitration request with a question ID and a requester address. requests[questionID][requester]
    mapping(bytes32 => mapping(address => Request)) public requests;

    /// @dev Associates a question ID with the requester who succeeded in requesting arbitration. questionIDToRequester[questionID]
    mapping(bytes32 => address) public questionIDToRequester;

    modifier onlyForeignProxy() {
        require(msg.sender == address(amb), "Only AMB allowed");
        require(
            amb.messageSourceChainId() == foreignChainId,
            "Only foreign chain allowed"
        );
        require(
            amb.messageSender() == foreignProxy,
            "Only foreign proxy allowed"
        );
        _;
    }

    /**
     * @notice Creates an arbitration proxy on the home chain.
     * @param _amb ArbitraryMessageBridge contract address.
     * @param _foreignProxy The address of the proxy.
     * @param _foreignChainId The ID of the chain where the foreign proxy is deployed.
     * @param _realitio Realitio contract address.
     */
    constructor(
        IAMB _amb,
        address _foreignProxy,
        bytes32 _foreignChainId,
        RealitioInterface _realitio
    ) {
        amb = _amb;
        foreignProxy = _foreignProxy;
        foreignChainId = _foreignChainId;
        realitio = _realitio;
    }

    /**
     * @dev Receives the requested arbitration for a question. TRUSTED.
     * @param _questionID The ID of the question.
     * @param _requester The address of the user that requested arbitration.
     * @param _maxPrevious The maximum value of the previous bond for the question.
     */
    function receiveArbitrationRequest(
        bytes32 _questionID,
        address _requester,
        uint256 _maxPrevious
    ) external override onlyForeignProxy {
        Request storage request = requests[_questionID][_requester];
        require(request.status == Status.None, "Request already exists");

        try
            realitio.notifyOfArbitrationRequest(
                _questionID,
                _requester,
                _maxPrevious
            )
        {
            request.status = Status.Notified;
            questionIDToRequester[_questionID] = _requester;

            emit RequestNotified(_questionID, _requester, _maxPrevious);
        } catch Error(string memory reason) {
            /*
             * Will fail if:
             *  - The question does not exist.
             *  - The question was not answered yet.
             *  - Another request was already accepted.
             *  - Someone increased the bond on the question to a value > _maxPrevious
             */
            request.status = Status.Rejected;

            emit RequestRejected(_questionID, _requester, _maxPrevious, reason);
        } catch {
            // In case `reject` did not have a reason string or some other error happened
            request.status = Status.Rejected;

            emit RequestRejected(_questionID, _requester, _maxPrevious, "");
        }
    }

    /**
     * @notice Handles arbitration request after it has been notified to Realitio for a given question.
     * @dev This method exists because `receiveArbitrationRequest` is called by the AMB and cannot send messages back to it.
     * @param _questionID The ID of the question.
     * @param _requester The address of the user that requested arbitration.
     */
    function handleNotifiedRequest(
        bytes32 _questionID,
        address _requester
    ) external override {
        Request storage request = requests[_questionID][_requester];
        require(request.status == Status.Notified, "Invalid request status");

        request.status = Status.AwaitingRuling;

        bytes4 selector = IForeignArbitrationProxy(0)
            .receiveArbitrationAcknowledgement
            .selector;
        bytes memory data = abi.encodeWithSelector(
            selector,
            _questionID,
            _requester
        );
        amb.requireToPassMessage(foreignProxy, data, amb.maxGasPerTx());

        emit RequestAcknowledged(_questionID, _requester);
    }

    /**
     * @notice Handles arbitration request after it has been rejected.
     * @dev This method exists because `receiveArbitrationRequest` is called by the AMB and cannot send messages back to it.
     * Reasons why the request might be rejected:
     *  - The question does not exist
     *  - The question was not answered yet
     *  - The question bond value changed while the arbitration was being requested
     *  - Another request was already accepted
     * @param _questionID The ID of the question.
     * @param _requester The address of the user that requested arbitration.
     */
    function handleRejectedRequest(
        bytes32 _questionID,
        address _requester
    ) external override {
        Request storage request = requests[_questionID][_requester];
        require(request.status == Status.Rejected, "Invalid request status");

        // At this point, only the request.status is set, simply reseting the status to Status.None is enough.
        request.status = Status.None;

        bytes4 selector = IForeignArbitrationProxy(0)
            .receiveArbitrationCancelation
            .selector;
        bytes memory data = abi.encodeWithSelector(
            selector,
            _questionID,
            _requester
        );
        amb.requireToPassMessage(foreignProxy, data, amb.maxGasPerTx());

        emit RequestCanceled(_questionID, _requester);
    }

    /**
     * @notice Receives a failed attempt to request arbitration. TRUSTED.
     * @dev Currently this can happen only if the arbitration cost increased.
     * @param _questionID The ID of the question.
     * @param _requester The address of the user that requested arbitration.
     */
    function receiveArbitrationFailure(
        bytes32 _questionID,
        address _requester
    ) external override onlyForeignProxy {
        Request storage request = requests[_questionID][_requester];
        require(
            request.status == Status.AwaitingRuling,
            "Invalid request status"
        );

        // At this point, only the request.status is set, simply reseting the status to Status.None is enough.
        request.status = Status.None;

        realitio.cancelArbitration(_questionID);

        emit ArbitrationFailed(_questionID, _requester);
    }

    /**
     * @notice Receives the answer to a specified question. TRUSTED.
     * @param _questionID The ID of the question.
     * @param _answer The answer from the arbitrator.
     */
    function receiveArbitrationAnswer(
        bytes32 _questionID,
        bytes32 _answer
    ) external override onlyForeignProxy {
        address requester = questionIDToRequester[_questionID];
        Request storage request = requests[_questionID][requester];
        require(
            request.status == Status.AwaitingRuling,
            "Invalid request status"
        );

        request.status = Status.Ruled;
        request.arbitratorAnswer = _answer;

        emit ArbitratorAnswered(_questionID, _answer);
    }

    /**
     * @notice Reports the answer provided by the arbitrator to a specified question.
     * @dev The Realitio contract validates the input parameters passed to this method,
     * so making this publicly accessible is safe.
     * @param _questionID The ID of the question.
     * @param _lastHistoryHash The history hash given with the last answer to the question in the Realitio contract.
     * @param _lastAnswerOrCommitmentID The last answer given, or its commitment ID if it was a commitment,
     * to the question in the Realitio contract.
     * @param _lastAnswerer The last answerer to the question in the Realitio contract.
     */
    function reportArbitrationAnswer(
        bytes32 _questionID,
        bytes32 _lastHistoryHash,
        bytes32 _lastAnswerOrCommitmentID,
        address _lastAnswerer
    ) external {
        address requester = questionIDToRequester[_questionID];
        Request storage request = requests[_questionID][requester];
        require(request.status == Status.Ruled, "Arbitrator has not ruled yet");

        realitio.assignWinnerAndSubmitAnswerByArbitrator(
            _questionID,
            request.arbitratorAnswer,
            requester,
            _lastHistoryHash,
            _lastAnswerOrCommitmentID,
            _lastAnswerer
        );

        request.status = Status.Finished;

        emit ArbitrationFinished(_questionID);
    }
}
