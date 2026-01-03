/**
 *  @authors: [@xyzseer]
 *  @reviewers: []
 *  @auditors: []
 *  @bounties: []
 *  @deployments: []
 */

// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./Market.sol";
import "./MarketFactory.sol";
import "./RealityProxy.sol";
import {IConditionalTokens, IWrapped1155Factory, IERC20} from "./Interfaces.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

contract MarketPreDeployHelper {
    /// @dev Workaround "stack too deep" errors.
    /// @param marketName Used only in categorical, multi categorical, and scalar markets. In multi scalar markets, the market name is formed using questionStart + outcomeType + questionEnd.
    /// @param outcomes The market outcomes, doesn't include the INVALID_RESULT outcome.
    /// @param questionStart Used to build the Reality question on multi scalar markets.
    /// @param questionEnd Used to build the Reality question on multi scalar markets.
    /// @param outcomeType Used to build the Reality question on multi scalar markets.
    /// @param parentOutcome conditional outcome to use (optional).
    /// @param parentMarket conditional market to use (optional). UNTRUSTED.
    /// @param category Reality question category.
    /// @param lang Reality question language.
    /// @param lowerBound Lower bound, only used for scalar markets.
    /// @param upperBound Upper bound, only used for scalar markets.
    /// @param minBond Min bond to use on Reality.
    /// @param openingTime Reality question opening time.
    /// @param tokenNames Name of the ERC20 tokens associated to each outcome.
    struct CreateMarketParams {
        string marketName;
        string[] outcomes;
        string questionStart;
        string questionEnd;
        string outcomeType;
        uint256 parentOutcome;
        address parentMarket;
        string category;
        string lang;
        uint256 lowerBound;
        uint256 upperBound;
        uint256 minBond;
        uint32 openingTime;
        string[] tokenNames;
    }

    /// @dev Workaround "stack too deep" errors.
    /// @param encodedQuestions The encoded questions containing the Reality parameters.
    /// @param templateId Reality templateId.
    struct InternalMarketConfig {
        string[] encodedQuestions;
        uint256 templateId;
    }

    /// @dev Template for scalar and multi scalar markets.
    uint8 internal constant REALITY_UINT_TEMPLATE = 1;
    /// @dev Template for categorical markets.
    uint8 internal constant REALITY_SINGLE_SELECT_TEMPLATE = 2;
    /// @dev Template for multi categorical markets.
    uint8 internal constant REALITY_MULTI_SELECT_TEMPLATE = 3;

    /// @dev MarketFactory contract.
    MarketFactory public immutable marketFactory;
    /// @dev Conditional Tokens contract.
    IConditionalTokens public immutable conditionalTokens;
    /// @dev Conditional Tokens collateral token contract.
    address public immutable collateralToken;
    /// @dev Wrapped1155Factory contract.
    IWrapped1155Factory public immutable wrapped1155Factory;

    /**
     *  @dev Constructor.
     *  @param _marketFactory Address of the MarketFactory contract.
     *  @param _conditionalTokens Address of the ConditionalTokens implementation.
     *  @param _collateralToken Address of the collateral token.
     *  @param _wrapped1155Factory Address of the Wrapped1155Factory implementation.
     */
    constructor(
        MarketFactory _marketFactory,
        IConditionalTokens _conditionalTokens,
        address _collateralToken,
        IWrapped1155Factory _wrapped1155Factory
    ) {
        marketFactory = _marketFactory;
        conditionalTokens = _conditionalTokens;
        collateralToken = _collateralToken;
        wrapped1155Factory = _wrapped1155Factory;
    }

    /// @dev Creates Categorical markets.
    /// @notice Categorical markets are associated with a Reality question that has only one answer.
    /// @param params CreateMarketParams instance.
    /// @param from Starting index (inclusive) for pagination of questions/ERC20 creation.
    /// @param to Ending index (exclusive) for pagination of questions/ERC20 creation.
    /// @param createQuestions Whether to create the questions on Reality.
    /// @param deployERC20 Whether to deploy ERC20 tokens.
    function createCategoricalMarket(
        CreateMarketParams calldata params,
        uint256 from,
        uint256 to,
        bool createQuestions,
        bool deployERC20
    ) external {
        require(params.outcomes.length >= 2, "Outcomes count must be 2 or more");

        string[] memory encodedQuestions = new string[](1);
        encodedQuestions[0] =
            encodeRealityQuestionWithOutcomes(params.marketName, params.outcomes, params.category, params.lang);

        createNewMarketParams(params, InternalMarketConfig({
            encodedQuestions: encodedQuestions,
            templateId: REALITY_SINGLE_SELECT_TEMPLATE
        }), from, to, createQuestions, deployERC20);
    }

    /// @dev Creates Multi Categorical markets.
    /// @notice Multi Categorical markets are associated with a Reality question that has one or more answers.
    /// @param params CreateMarketParams instance.
    /// @param from Starting index (inclusive) for pagination of questions/ERC20 creation.
    /// @param to Ending index (exclusive) for pagination of questions/ERC20 creation.
    /// @param createQuestions Whether to create the questions on Reality.
    /// @param deployERC20 Whether to deploy ERC20 tokens.
    function createMultiCategoricalMarket(
        CreateMarketParams calldata params,
        uint256 from,
        uint256 to,
        bool createQuestions,
        bool deployERC20
    ) external {
        require(params.outcomes.length >= 2, "Outcomes count must be 2 or more");

        string[] memory encodedQuestions = new string[](1);
        encodedQuestions[0] =
            encodeRealityQuestionWithOutcomes(params.marketName, params.outcomes, params.category, params.lang);

        createNewMarketParams(params, InternalMarketConfig({
            encodedQuestions: encodedQuestions,
            templateId: REALITY_MULTI_SELECT_TEMPLATE
        }), from, to, createQuestions, deployERC20);
    }

    /// @dev Creates Scalar markets.
    /// @notice Scalar markets are associated with a Reality question that resolves to a numeric value.
    /// @param params CreateMarketParams instance.
    /// @param from Starting index (inclusive) for pagination of questions/ERC20 creation.
    /// @param to Ending index (exclusive) for pagination of questions/ERC20 creation.
    /// @param createQuestions Whether to create the questions on Reality.
    /// @param deployERC20 Whether to deploy ERC20 tokens.
    function createScalarMarket(
        CreateMarketParams calldata params,
        uint256 from,
        uint256 to,
        bool createQuestions,
        bool deployERC20
    ) external {
        require(params.upperBound > params.lowerBound, "upperBound must be higher than lowerBound");
        // values reserved by Reality for INVALID and UNRESOLVED_ANSWER.
        require(params.upperBound < type(uint256).max - 2, "upperBound must be less than uint256.max - 2");
        require(params.outcomes.length == 2, "Outcomes count must be 2");

        string[] memory encodedQuestions = new string[](1);
        encodedQuestions[0] = encodeRealityQuestionWithoutOutcomes(params.marketName, params.category, params.lang);

        createNewMarketParams(params, InternalMarketConfig({
            encodedQuestions: encodedQuestions,
            templateId: REALITY_UINT_TEMPLATE
        }), from, to, createQuestions, deployERC20);
    }

    /// @dev Creates Multi Scalar markets.
    /// @notice Multi Scalar markets are associated with two or more Reality questions, and each one of them resolves to a numeric value.
    /// @param params CreateMarketParams instance.
    /// @param from Starting index (inclusive) for pagination of questions/ERC20 creation.
    /// @param to Ending index (exclusive) for pagination of questions/ERC20 creation.
    /// @param createQuestions Whether to create the questions on Reality.
    /// @param deployERC20 Whether to deploy ERC20 tokens.
    function createMultiScalarMarket(
        CreateMarketParams calldata params,
        uint256 from,
        uint256 to,
        bool createQuestions,
        bool deployERC20
    ) external {
        require(params.outcomes.length >= 2, "Outcomes count must be 2 or more");

        string[] memory encodedQuestions = new string[](params.outcomes.length);

        for (uint256 j = 0; j < params.outcomes.length; j++) {
            encodedQuestions[j] = encodeRealityQuestionWithoutOutcomes(
                string(abi.encodePacked(params.questionStart, params.outcomes[j], params.questionEnd)),
                params.category,
                params.lang
            );
        }

        createNewMarketParams(params, InternalMarketConfig({
            encodedQuestions: encodedQuestions,
            templateId: REALITY_UINT_TEMPLATE
        }), from, to, createQuestions, deployERC20);
    }

    /// @dev Creates the structures needed to initialize the new market and optionally deploys ERC20 tokens.
    /// @param params The parameters required to create the market.
    /// @param config The internal configuration for the market.
    /// @param from Starting index (inclusive) for pagination of questions/ERC20 creation.
    /// @param to Ending index (exclusive) for pagination of questions/ERC20 creation.
    /// @param createQuestions Whether to create the questions on Reality.
    /// @param deployERC20 Whether to deploy ERC20 tokens.
    function createNewMarketParams(
        CreateMarketParams memory params,
        InternalMarketConfig memory config,
        uint256 from,
        uint256 to,
        bool createQuestions,
        bool deployERC20
    ) internal {
        bytes32[] memory questionsIds = new bytes32[](config.encodedQuestions.length);

        // Always calculate all question IDs (needed for questionId calculation)
        for (uint256 i = 0; i < config.encodedQuestions.length; i++) {
            questionsIds[i] = calculateRealityQuestionId(
                config.encodedQuestions[i],
                config.templateId,
                params.openingTime,
                params.minBond
            );
        }

        // Optionally create questions on Reality (limited by from/to)
        if (createQuestions) {
            require(from <= to, "from must be <= to");
            require(to <= config.encodedQuestions.length, "to exceeds encodedQuestions length");

            for (uint256 i = from; i < to; i++) {
                marketFactory.askRealityQuestion(
                    config.encodedQuestions[i],
                    config.templateId,
                    params.openingTime,
                    params.minBond
                );
            }
        }

        // Optionally deploy ERC20 tokens (limited by from/to)
        if (deployERC20) {
            bytes32 parentCollectionId = params.parentMarket == address(0)
            ? bytes32(0)
            : conditionalTokens.getCollectionId(
                Market(params.parentMarket).parentCollectionId(),
                Market(params.parentMarket).conditionId(),
                1 << params.parentOutcome
            );

            // questionId must be a hash of all the values that RealityProxy.resolve() uses to resolve a market, this way if an attacker tries to resolve a fake market by changing some value its questionId will not match the id of a valid market.
            bytes32 questionId = keccak256(
                abi.encode(questionsIds, params.outcomes.length, config.templateId, params.lowerBound, params.upperBound)
            );

            uint256 outcomeSlotCount = getOutcomeSlotCount(config.templateId, params.outcomes.length);
            bytes32 conditionId = prepareCondition(questionId, outcomeSlotCount);

            require(from <= to, "from must be <= to");
            require(to <= outcomeSlotCount, "to exceeds outcomeSlotCount");

            deployERC20Positions(parentCollectionId, conditionId, outcomeSlotCount, params.tokenNames, from, to);
        }
    }

    /// @dev Encodes the question, outcomes, category and language following the Reality structure.
    /// If any parameter has a special character like quotes, it must be properly escaped.
    /// @param question The question text.
    /// @param outcomes[] The question outcomes.
    /// @param category The question category.
    /// @param lang The question language.
    /// @return The encoded question.
    function encodeRealityQuestionWithOutcomes(
        string memory question,
        string[] calldata outcomes,
        string memory category,
        string memory lang
    ) internal pure returns (string memory) {
        bytes memory separator = abi.encodePacked(unicode"\u241f");

        bytes memory encodedOutcomes = abi.encodePacked('"', outcomes[0], '"');

        for (uint256 i = 1; i < outcomes.length; i++) {
            encodedOutcomes = abi.encodePacked(encodedOutcomes, ',"', outcomes[i], '"');
        }

        return string(abi.encodePacked(question, separator, encodedOutcomes, separator, category, separator, lang));
    }

    /// @dev Encodes the question, category and language following the Reality structure.
    /// If any parameter has a special character like quotes, it must be properly escaped.
    /// @param question The question text.
    /// @param category The question category.
    /// @param lang The question language.
    /// @return The encoded question.
    function encodeRealityQuestionWithoutOutcomes(
        string memory question,
        string memory category,
        string memory lang
    ) internal pure returns (string memory) {
        bytes memory separator = abi.encodePacked(unicode"\u241f");

        return string(abi.encodePacked(question, separator, category, separator, lang));
    }

    /// @dev Wraps the ERC1155 outcome tokens to ERC20. The INVALID_RESULT outcome is always called SER-INVALID.
    /// @notice The INVALID_RESULT outcome (at index outcomeSlotCount - 1) is always deployed, even if not in the [from, to) range.
    /// @param parentCollectionId The parentCollectionId.
    /// @param conditionId The conditionId.
    /// @param outcomeSlotCount The amount of outcomes.
    /// @param tokenNames The name of each outcome token.
    /// @param from Starting index (inclusive) for pagination.
    /// @param to Ending index (exclusive) for pagination.
    /// @return wrapped1155 Array of outcome tokens wrapped to ERC20.
    /// @return data Array of token data used to create each ERC20.
    function deployERC20Positions(
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256 outcomeSlotCount,
        string[] memory tokenNames,
        uint256 from,
        uint256 to
    ) public returns (IERC20[] memory wrapped1155, bytes[] memory data) {
        uint256 invalidResultIndex = outcomeSlotCount - 1;

        wrapped1155 = new IERC20[](outcomeSlotCount);
        data = new bytes[](outcomeSlotCount);

        // Deploy ERC20s in the specified range
        for (uint256 j = from; j < to; j++) {
            bytes32 collectionId = conditionalTokens.getCollectionId(parentCollectionId, conditionId, 1 << j);
            uint256 tokenId = conditionalTokens.getPositionId(collateralToken, collectionId);

            require(j == invalidResultIndex || bytes(tokenNames[j]).length != 0, "Missing token name");

            bytes memory _data = abi.encodePacked(
                toString31(j == invalidResultIndex ? "SER-INVALID" : tokenNames[j]),
                toString31(j == invalidResultIndex ? "SER-INVALID" : tokenNames[j]),
                uint8(18)
            );

            IERC20 _wrapped1155 = wrapped1155Factory.requireWrapped1155(address(conditionalTokens), tokenId, _data);

            wrapped1155[j] = _wrapped1155;
            data[j] = _data;
        }

        // Always deploy INVALID_RESULT ERC20 if it wasn't in the range
        if (invalidResultIndex < from || invalidResultIndex >= to) {
            bytes32 collectionId = conditionalTokens.getCollectionId(parentCollectionId, conditionId, 1 << invalidResultIndex);
            uint256 tokenId = conditionalTokens.getPositionId(collateralToken, collectionId);

            bytes memory _data = abi.encodePacked(
                toString31("SER-INVALID"),
                toString31("SER-INVALID"),
                uint8(18)
            );

            IERC20 _wrapped1155 = wrapped1155Factory.requireWrapped1155(address(conditionalTokens), tokenId, _data);

            wrapped1155[invalidResultIndex] = _wrapped1155;
            data[invalidResultIndex] = _data;
        }
    }

    /// @dev Calculates the Reality question ID without creating the question.
    /// This is the same calculation used in MarketFactory.askRealityQuestion but without the actual question creation.
    /// @param encodedQuestion The encoded question containing the Reality parameters.
    /// @param templateId The Reality template id.
    /// @param openingTime The question opening time.
    /// @param minBond The question min bond.
    /// @return The question id.
    function calculateRealityQuestionId(
        string memory encodedQuestion,
        uint256 templateId,
        uint32 openingTime,
        uint256 minBond
    ) public view returns (bytes32) {
        bytes32 content_hash = keccak256(abi.encodePacked(templateId, openingTime, encodedQuestion));

        return keccak256(
            abi.encodePacked(
                content_hash,
                marketFactory.arbitrator(),
                marketFactory.questionTimeout(),
                minBond,
                address(marketFactory.realitio()),
                address(marketFactory),
                uint256(0)
            )
        );
    }

    /// @dev Prepares the CTF condition and returns the conditionId.
    /// @param questionId An identifier for the question to be answered by the oracle.
    /// @param outcomeSlotCount The number of outcome slots which must be used for this condition. Must not exceed 256.
    /// @return Condition ID.
    function prepareCondition(bytes32 questionId, uint256 outcomeSlotCount) public returns (bytes32) {
        RealityProxy realityProxy = marketFactory.realityProxy();
        bytes32 conditionId = conditionalTokens.getConditionId(address(realityProxy), questionId, outcomeSlotCount);

        if (conditionalTokens.getOutcomeSlotCount(conditionId) == 0) {
            conditionalTokens.prepareCondition(address(realityProxy), questionId, outcomeSlotCount);
        }

        return conditionId;
    }

    /// @dev Calculates the outcome slot count based on the template type and number of outcomes.
    /// @param templateId The Reality template id.
    /// @param outcomesLength The number of outcomes (excluding INVALID_RESULT).
    /// @return The outcome slot count.
    function getOutcomeSlotCount(uint256 templateId, uint256 outcomesLength) internal pure returns (uint256) {
        if (templateId == REALITY_UINT_TEMPLATE) {
            // Scalar markets have 2 outcomes + 1 for INVALID_RESULT = 3
            // Multi scalar markets have outcomesLength + 1 for INVALID_RESULT
            return outcomesLength == 2 ? 3 : outcomesLength + 1;
        } else {
            // Categorical and Multi Categorical markets have outcomesLength + 1 for INVALID_RESULT
            return outcomesLength + 1;
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
}
