/**
 *  @authors: [@xyzseer]
 *  @reviewers: []
 *  @auditors: []
 *  @bounties: []
 *  @deployments: []
 */

// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./FutarchyCategoricalRealityProxy.sol";
import "./FutarchyProposal.sol";
import {IConditionalTokens, IRealityETH_v3_0, IWrapped1155Factory} from "./Interfaces.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

/// @dev FutarchyFactory for questions with N answers, such as "Which candidate will win?".
/// The condition has N + 1 outcome slots: one per answer plus INVALID, which wins when Reality answers
/// Invalid or an index >= N. Yes/No proposals, where Invalid counts as No, keep using FutarchyFactory.
/// Each slot is split into both collateral tokens, so a proposal has 2N + 2 wrapped tokens, ordered so that
/// wrappedOutcome(i) and wrappedOutcome(i + N) mean the same as in FutarchyFactory proposals:
/// [answer 0..N-1 of collateral1, answer 0..N-1 of collateral2, INVALID of collateral1, INVALID of collateral2].
/// Proposals are FutarchyProposal clones whose `outcomes` are the N answers, so numOutcomes() returns N.
contract FutarchyCategoricalFactory {
    using Clones for address;

    /// @dev Workaround "stack too deep" errors.
    /// @param marketName The name of the proposal.
    /// @param outcomes The answers to the Reality question. At least two.
    /// @param tokenNames Prefix of each answer's tokens, such as "CANDIDATE" for CANDIDATE_PNK and CANDIDATE_sDAI.
    /// @param collateralToken1 First collateral token.
    /// @param collateralToken2 Second collateral token.
    /// @param category Reality question category.
    /// @param lang Reality question language.
    /// @param minBond Min bond to use on Reality.
    /// @param openingTime Reality question opening time.
    struct CreateProposalParams {
        string marketName;
        string[] outcomes;
        string[] tokenNames;
        IERC20 collateralToken1;
        IERC20 collateralToken2;
        string category;
        string lang;
        uint256 minBond;
        uint32 openingTime;
    }

    /// @dev Template for proposals.
    uint8 internal constant REALITY_SINGLE_SELECT_TEMPLATE = 2;

    /// @dev Reality question timeout.
    uint32 public immutable questionTimeout;

    /// @dev Arbitrator contract.
    address public immutable arbitrator;
    /// @dev Reality.eth contract.
    IRealityETH_v3_0 public immutable realitio;
    /// @dev Wrapped1155Factory contract.
    IWrapped1155Factory public immutable wrapped1155Factory;
    /// @dev Conditional Tokens contract.
    IConditionalTokens public immutable conditionalTokens;
    /// @dev Oracle contract.
    FutarchyCategoricalRealityProxy public immutable realityProxy;
    /// @dev Proposals created by this factory.
    address[] public proposals;
    /// @dev FutarchyProposal contract.
    address public immutable proposal;

    /// @dev To be emitted when a new proposal is created.
    /// @param proposal The new proposal address.
    /// @param marketName The name of the proposal.
    /// @param conditionId Conditional Tokens conditionId.
    /// @param questionId Conditional Tokens & Reality.eth questionId.
    event NewProposal(address indexed proposal, string marketName, bytes32 conditionId, bytes32 questionId);

    /**
     *  @dev Constructor.
     *  @param _proposal Address of the FutarchyProposal contract that is going to be used for each new deployment.
     *  @param _arbitrator Address of the arbitrator that is going to resolve Realitio disputes.
     *  @param _realitio Address of the Realitio implementation.
     *  @param _wrapped1155Factory Address of the Wrapped1155Factory implementation.
     *  @param _conditionalTokens Address of the ConditionalTokens implementation.
     *  @param _realityProxy Address of the FutarchyCategoricalRealityProxy implementation.
     *  @param _questionTimeout Reality question timeout.
     */
    constructor(
        address _proposal,
        address _arbitrator,
        IRealityETH_v3_0 _realitio,
        IWrapped1155Factory _wrapped1155Factory,
        IConditionalTokens _conditionalTokens,
        FutarchyCategoricalRealityProxy _realityProxy,
        uint32 _questionTimeout
    ) {
        proposal = _proposal;
        arbitrator = _arbitrator;
        realitio = _realitio;
        wrapped1155Factory = _wrapped1155Factory;
        conditionalTokens = _conditionalTokens;
        realityProxy = _realityProxy;
        questionTimeout = _questionTimeout;
    }

    /// @dev Creates the Proposal and deploys the wrapped ERC20 tokens.
    /// @param params CreateProposalParams instance.
    /// @return The new proposal address.
    function createProposal(CreateProposalParams memory params) external returns (address) {
        require(params.outcomes.length >= 2, "Outcomes count must be 2 or more");
        require(params.tokenNames.length == params.outcomes.length, "Token names count mismatch");

        string[] memory tokenNames = getTokenNames(params.tokenNames, params.collateralToken1, params.collateralToken2);

        (FutarchyProposal.FutarchyProposalParams memory futarchyProposalParams) =
            createNewProposalParams(params, tokenNames);

        FutarchyProposal instance = FutarchyProposal(proposal.clone());

        // FutarchyProposal.resolve() calls realityProxy.resolve(this), which this proxy implements.
        instance.initialize(
            params.marketName, params.outcomes, futarchyProposalParams, FutarchyRealityProxy(address(realityProxy))
        );

        emit NewProposal(
            address(instance), params.marketName, futarchyProposalParams.conditionId, futarchyProposalParams.questionId
        );

        proposals.push(address(instance));

        return address(instance);
    }

    /// @dev Names of the wrapped tokens, in the order described at the top of this contract.
    /// @param outcomeTokenNames The prefix of each answer's tokens.
    /// @param collateralToken1 First collateral token.
    /// @param collateralToken2 Second collateral token.
    /// @return tokenNames The name of each wrapped token.
    function getTokenNames(
        string[] memory outcomeTokenNames,
        IERC20 collateralToken1,
        IERC20 collateralToken2
    ) internal view returns (string[] memory tokenNames) {
        string memory tokenSymbol1 = collateralToken1.symbol();
        string memory tokenSymbol2 = collateralToken2.symbol();
        uint256 numOutcomes = outcomeTokenNames.length;

        tokenNames = new string[](2 * numOutcomes + 2);
        for (uint256 i = 0; i < numOutcomes; i++) {
            require(bytes(outcomeTokenNames[i]).length != 0, "Missing token name");
            tokenNames[i] = string(abi.encodePacked(outcomeTokenNames[i], "_", tokenSymbol1));
            tokenNames[i + numOutcomes] = string(abi.encodePacked(outcomeTokenNames[i], "_", tokenSymbol2));
        }
        tokenNames[2 * numOutcomes] = string(abi.encodePacked("INVALID_", tokenSymbol1));
        tokenNames[2 * numOutcomes + 1] = string(abi.encodePacked("INVALID_", tokenSymbol2));
    }

    /// @dev Creates the structures needed to initialize the new proposal.
    /// @param params CreateProposalParams instance.
    /// @param tokenNames Token names.
    /// @return FutarchyProposal.FutarchyProposalParams instance.
    function createNewProposalParams(
        CreateProposalParams memory params,
        string[] memory tokenNames
    ) internal returns (FutarchyProposal.FutarchyProposalParams memory) {
        bytes32 parentCollectionId = bytes32(0);
        string memory encodedQuestion =
            encodeRealityQuestion(params.marketName, params.outcomes, params.category, params.lang);
        bytes32 questionId =
            askRealityQuestion(encodedQuestion, REALITY_SINGLE_SELECT_TEMPLATE, params.openingTime, params.minBond);
        // one slot per answer plus INVALID.
        bytes32 conditionId = prepareCondition(questionId, params.outcomes.length + 1);

        (IERC20[] memory wrapped1155, bytes[] memory tokenData) = deployERC20Positions(
            params.collateralToken1, params.collateralToken2, parentCollectionId, conditionId, tokenNames
        );

        return FutarchyProposal.FutarchyProposalParams({
            conditionId: conditionId,
            collateralToken1: params.collateralToken1,
            collateralToken2: params.collateralToken2,
            questionId: questionId,
            parentCollectionId: parentCollectionId,
            parentOutcome: 0,
            parentMarket: address(0),
            wrapped1155: wrapped1155,
            tokenData: tokenData,
            encodedQuestion: encodedQuestion
        });
    }

    /// @dev Encodes the question, outcomes, category and language following the Reality structure.
    /// If any parameter has a special character like quotes, it must be properly escaped.
    /// @param question The question text.
    /// @param outcomes The question outcomes.
    /// @param category The question category.
    /// @param lang The question language.
    /// @return The encoded question.
    function encodeRealityQuestion(
        string memory question,
        string[] memory outcomes,
        string memory category,
        string memory lang
    ) internal pure returns (string memory) {
        bytes memory separator = abi.encodePacked(unicode"\u241f");

        bytes memory encodedOutcomes = abi.encodePacked("\"", outcomes[0], "\"");

        for (uint256 i = 1; i < outcomes.length; i++) {
            encodedOutcomes = abi.encodePacked(encodedOutcomes, ",\"", outcomes[i], "\"");
        }

        return string(abi.encodePacked(question, separator, encodedOutcomes, separator, category, separator, lang));
    }

    /// @dev Asks a question on reality.
    /// @param encodedQuestion The encoded question containing the Reality parameters.
    /// @param templateId The Reality template id.
    /// @param openingTime The question opening time.
    /// @param minBond The question min bond.
    /// @return The question id.
    function askRealityQuestion(
        string memory encodedQuestion,
        uint256 templateId,
        uint32 openingTime,
        uint256 minBond
    ) internal returns (bytes32) {
        bytes32 content_hash = keccak256(abi.encodePacked(templateId, openingTime, encodedQuestion));

        bytes32 question_id = keccak256(
            abi.encodePacked(
                content_hash, arbitrator, questionTimeout, minBond, address(realitio), address(this), uint256(0)
            )
        );

        if (realitio.getTimeout(question_id) != 0) {
            // question already exists
            return question_id;
        }

        return realitio.askQuestionWithMinBond(
            templateId, encodedQuestion, arbitrator, questionTimeout, openingTime, 0, minBond
        );
    }

    /// @dev Prepares the CTF condition and returns the conditionId.
    /// @param questionId An identifier for the question to be answered by the oracle.
    /// @param outcomeSlotCount The number of outcome slots which must be used for this condition. Must not exceed 256.
    /// @return Condition ID.
    function prepareCondition(bytes32 questionId, uint256 outcomeSlotCount) internal returns (bytes32) {
        bytes32 conditionId = conditionalTokens.getConditionId(address(realityProxy), questionId, outcomeSlotCount);

        if (conditionalTokens.getOutcomeSlotCount(conditionId) == 0) {
            // prepare the condition if it doesn't already exist
            conditionalTokens.prepareCondition(address(realityProxy), questionId, outcomeSlotCount);
        }

        return conditionId;
    }

    /// @dev Wraps the ERC1155 outcome tokens to ERC20.
    /// @param collateralToken1 The first collateral token.
    /// @param collateralToken2 The second collateral token.
    /// @param parentCollectionId The parentCollectionId.
    /// @param conditionId The conditionId.
    /// @param tokenNames The name of each outcome token.
    /// @return wrapped1155 Array of outcome tokens wrapped to ERC20.
    /// @return data Array of token data used to create each ERC20.
    function deployERC20Positions(
        IERC20 collateralToken1,
        IERC20 collateralToken2,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        string[] memory tokenNames
    ) internal returns (IERC20[] memory wrapped1155, bytes[] memory data) {
        wrapped1155 = new IERC20[](tokenNames.length);
        data = new bytes[](tokenNames.length);

        uint256 numOutcomes = (tokenNames.length - 2) / 2;

        for (uint256 j = 0; j < tokenNames.length; j++) {
            // the first 2N tokens are the answers of collateral1 and of collateral2, the last two are INVALID (slot N)
            uint256 slot = j < 2 * numOutcomes ? j % numOutcomes : numOutcomes;
            bool isFirstCollateral = j < 2 * numOutcomes ? j < numOutcomes : j == 2 * numOutcomes;
            bytes32 collectionId = conditionalTokens.getCollectionId(parentCollectionId, conditionId, 1 << slot);
            uint256 tokenId = conditionalTokens.getPositionId(
                address(isFirstCollateral ? collateralToken1 : collateralToken2), collectionId
            );

            require(bytes(tokenNames[j]).length != 0, "Missing token name");

            bytes memory _data = abi.encodePacked(toString31(tokenNames[j]), toString31(tokenNames[j]), uint8(18));

            IERC20 _wrapped1155 = wrapped1155Factory.requireWrapped1155(address(conditionalTokens), tokenId, _data);

            wrapped1155[j] = _wrapped1155;
            data[j] = _data;
        }
    }

    /// @dev Encodes a short string (less than than 31 bytes long) as for storage as expected by Solidity.
    /// See https://github.com/gnosis/1155-to-20/pull/4#discussion_r573630922
    /// @param value String to encode.
    /// @return encodedString The encoded string.
    function toString31(string memory value) internal pure returns (bytes32 encodedString) {
        uint256 length = bytes(value).length;
        require(length < 32, "string too long");

        // Read the right-padded string data, which is guaranteed to fit into a single word because its length is less than 32.
        assembly {
            encodedString := mload(add(value, 0x20))
        }

        // Now mask the string data, this ensures that the bytes past the string length are all 0s.
        bytes32 mask = bytes32(type(uint256).max << ((32 - length) << 3));
        encodedString = encodedString & mask;

        // Finally, set the least significant byte to be the hex length of the encoded string, that is its byte-length times two.
        encodedString = encodedString | bytes32(length << 1);
    }

    /// @dev Returns all the proposals created by this factory.
    /// @return The addresses of the proposals.
    function allMarkets() external view returns (address[] memory) {
        return proposals;
    }

    /// @notice Returns the total number of proposals created by this factory.
    /// @return The count of proposals.
    function marketsCount() external view returns (uint256) {
        return proposals.length;
    }
}
