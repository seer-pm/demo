/**
 *  @authors: [@xyzseer]
 *  @reviewers: [@nvm1410, @madhurMongia, @unknownunknown1, @mani99brar]
 *  @auditors: []
 *  @bounties: []
 *  @deployments: []
 */

// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {IConditionalTokens, IRealityETH_v3_0, IWrapped1155Factory} from "./Interfaces.sol";
import "./Market.sol";
import "./RealityProxy.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

contract MarketFactory {
    using Clones for address;

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
    /// @param outcomeSlotCount Conditional Tokens outcomeSlotCount.
    /// @param templateId Reality templateId.
    struct InternalMarketConfig {
        string[] encodedQuestions;
        uint256 outcomeSlotCount;
        uint256 templateId;
    }

    /// @dev Template for scalar and multi scalar markets.
    uint8 internal constant REALITY_UINT_TEMPLATE = 1;
    /// @dev Template for categorical markets.
    uint8 internal constant REALITY_SINGLE_SELECT_TEMPLATE = 2;
    /// @dev Template for multi categorical markets.
    uint8 internal constant REALITY_MULTI_SELECT_TEMPLATE = 3;

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
    /// @dev Conditional Tokens collateral token contract.
    address public immutable collateralToken;
    /// @dev Oracle contract.
    RealityProxy public immutable realityProxy;
    /// @dev Markets created by this factory.
    address[] public markets;
    /// @dev Market contract.
    address public immutable market;

    /// @dev To be emitted when a new market is created.
    /// @param market The new market address.
    /// @param marketName The name of the market.
    /// @param parentMarket Conditional market to use.
    /// @param conditionId Conditional Tokens conditionId.
    /// @param questionId Conditional Tokens questionId.
    /// @param questionsIds Reality questions ids.
    event NewMarket(
        address indexed market,
        string marketName,
        address parentMarket,
        bytes32 conditionId,
        bytes32 questionId,
        bytes32[] questionsIds
    );

    /**
     *  @dev Constructor.
     *  @param _market Address of the market contract that is going to be used for each new deployment.
     *  @param _arbitrator Address of the arbitrator that is going to resolve Realitio disputes.
     *  @param _realitio Address of the Realitio implementation.
     *  @param _wrapped1155Factory Address of the Wrapped1155Factory implementation.
     *  @param _conditionalTokens Address of the ConditionalTokens implementation.
     *  @param _collateralToken Address of the collateral token.
     *  @param _realityProxy Address of the RealityProxy implementation.
     *  @param _questionTimeout Reality question timeout.
     */
    constructor(
        address _market,
        address _arbitrator,
        IRealityETH_v3_0 _realitio,
        IWrapped1155Factory _wrapped1155Factory,
        IConditionalTokens _conditionalTokens,
        address _collateralToken,
        RealityProxy _realityProxy,
        uint32 _questionTimeout
    ) {
        market = _market;
        arbitrator = _arbitrator;
        realitio = _realitio;
        wrapped1155Factory = _wrapped1155Factory;
        conditionalTokens = _conditionalTokens;
        collateralToken = _collateralToken;
        realityProxy = _realityProxy;
        questionTimeout = _questionTimeout;
    }

    /// @dev Creates a Categorical market.
    /// @notice Categorical markets are associated with a Reality question that has only one answer.
    /// @param params CreateMarketParams instance.
    /// @return The new market address.
    function createCategoricalMarket(CreateMarketParams calldata params) external returns (address) {
        require(params.outcomes.length >= 2, "Outcomes count must be 2 or more");

        string[] memory encodedQuestions = new string[](1);
        encodedQuestions[0] =
            encodeRealityQuestionWithOutcomes(params.marketName, params.outcomes, params.category, params.lang);

        return createMarket(
            params,
            params.marketName,
            InternalMarketConfig({
                encodedQuestions: encodedQuestions,
                outcomeSlotCount: params.outcomes.length + 1, // additional outcome for Invalid Result.
                templateId: REALITY_SINGLE_SELECT_TEMPLATE
            })
        );
    }

    /// @dev Creates a Multi Categorical market.
    /// @notice Multi Categorical markets are associated with a Reality question that has one or more answers.
    /// @param params CreateMarketParams instance.
    /// @return The new market address.
    function createMultiCategoricalMarket(CreateMarketParams calldata params) external returns (address) {
        require(params.outcomes.length >= 2, "Outcomes count must be 2 or more");

        string[] memory encodedQuestions = new string[](1);
        encodedQuestions[0] =
            encodeRealityQuestionWithOutcomes(params.marketName, params.outcomes, params.category, params.lang);

        return createMarket(
            params,
            params.marketName,
            InternalMarketConfig({
                encodedQuestions: encodedQuestions,
                outcomeSlotCount: params.outcomes.length + 1, // additional outcome for Invalid Result.
                templateId: REALITY_MULTI_SELECT_TEMPLATE
            })
        );
    }

    /// @dev Creates a Scalar market.
    /// @notice Scalar markets are associated with a Reality question that resolves to a numeric value.
    /// @param params CreateMarketParams instance.
    /// @return The new market address.
    function createScalarMarket(CreateMarketParams calldata params) external returns (address) {
        require(params.upperBound > params.lowerBound, "upperBound must be higher than lowerBound");
        // values reserved by Reality for INVALID and UNRESOLVED_ANSWER.
        require(params.upperBound < type(uint256).max - 2, "upperBound must be less than uint256.max - 2");
        require(params.outcomes.length == 2, "Outcomes count must be 2");

        string[] memory encodedQuestions = new string[](1);
        encodedQuestions[0] = encodeRealityQuestionWithoutOutcomes(params.marketName, params.category, params.lang);

        return createMarket(
            params,
            params.marketName,
            InternalMarketConfig({
                encodedQuestions: encodedQuestions,
                outcomeSlotCount: 3, // additional outcome for Invalid Result.
                templateId: REALITY_UINT_TEMPLATE
            })
        );
    }

    /// @dev Creates a Multi Scalar market.
    /// @notice Multi Scalar markets are associated with two or more Reality questions, and each one of them resolves to a numeric value.
    /// @param params CreateMarketParams instance.
    /// @return The new market address.
    function createMultiScalarMarket(CreateMarketParams calldata params) external returns (address) {
        require(params.outcomes.length >= 2, "Outcomes count must be 2 or more");

        string[] memory encodedQuestions = new string[](params.outcomes.length);

        for (uint256 i = 0; i < params.outcomes.length; i++) {
            encodedQuestions[i] = encodeRealityQuestionWithoutOutcomes(
                string(abi.encodePacked(params.questionStart, params.outcomes[i], params.questionEnd)),
                params.category,
                params.lang
            );
        }

        return createMarket(
            params,
            string(abi.encodePacked(params.questionStart, "[", params.outcomeType, "]", params.questionEnd)),
            InternalMarketConfig({
                encodedQuestions: encodedQuestions,
                outcomeSlotCount: params.outcomes.length + 1, // additional outcome for Invalid Result.
                templateId: REALITY_UINT_TEMPLATE
            })
        );
    }

    /// @dev Creates the Market and deploys the wrapped ERC20 tokens.
    /// @param params CreateMarketParams instance.
    /// @param marketName The market name.
    /// @param config InternalMarketConfig instance.
    /// @return The new market address.
    function createMarket(
        CreateMarketParams memory params,
        string memory marketName,
        InternalMarketConfig memory config
    ) internal returns (address) {
        (Market.ConditionalTokensParams memory conditionalTokensParams, Market.RealityParams memory realityParams) =
            createNewMarketParams(params, config);

        Market instance = Market(market.clone());

        instance.initialize(
            marketName,
            params.outcomes,
            params.lowerBound,
            params.upperBound,
            conditionalTokensParams,
            realityParams,
            realityProxy
        );

        emit NewMarket(
            address(instance),
            marketName,
            params.parentMarket,
            conditionalTokensParams.conditionId,
            conditionalTokensParams.questionId,
            realityParams.questionsIds
        );

        markets.push(address(instance));

        return address(instance);
    }

    /// @dev Creates the structures needed to initialize the new market.
    /// @param params CreateMarketParams instance.
    /// @param config InternalMarketConfig instance.
    /// @return Market.ConditionalTokensParams instance.
    /// @return Market.RealityParams instance.
    function createNewMarketParams(
        CreateMarketParams memory params,
        InternalMarketConfig memory config
    ) internal returns (Market.ConditionalTokensParams memory, Market.RealityParams memory) {
        bytes32 parentCollectionId = params.parentMarket == address(0)
            ? bytes32(0)
            : conditionalTokens.getCollectionId(
                Market(params.parentMarket).parentCollectionId(),
                Market(params.parentMarket).conditionId(),
                1 << params.parentOutcome
            );

        bytes32[] memory questionsIds = new bytes32[](config.encodedQuestions.length);

        for (uint256 i = 0; i < config.encodedQuestions.length; i++) {
            questionsIds[i] =
                askRealityQuestion(config.encodedQuestions[i], config.templateId, params.openingTime, params.minBond);
        }

        // questionId must be a hash of all the values that RealityProxy.resolve() uses to resolve a market, this way if an attacker tries to resolve a fake market by changing some value its questionId will not match the id of a valid market.
        bytes32 questionId = keccak256(
            abi.encode(questionsIds, params.outcomes.length, config.templateId, params.lowerBound, params.upperBound)
        );
        bytes32 conditionId = prepareCondition(questionId, config.outcomeSlotCount);

        (IERC20[] memory wrapped1155, bytes[] memory data) =
            deployERC20Positions(parentCollectionId, conditionId, config.outcomeSlotCount, params.tokenNames);

        return (
            Market.ConditionalTokensParams({
                conditionId: conditionId,
                questionId: questionId,
                parentCollectionId: parentCollectionId,
                parentOutcome: params.parentOutcome,
                parentMarket: params.parentMarket,
                wrapped1155: wrapped1155,
                data: data
            }),
            Market.RealityParams({
                questionsIds: questionsIds,
                templateId: config.templateId,
                encodedQuestions: config.encodedQuestions
            })
        );
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
            conditionalTokens.prepareCondition(address(realityProxy), questionId, outcomeSlotCount);
        }

        return conditionId;
    }

    /// @dev Wraps the ERC1155 outcome tokens to ERC20. The INVALID_RESULT outcome is always called SER-INVALID.
    /// @param parentCollectionId The parentCollectionId.
    /// @param conditionId The conditionId.
    /// @param outcomeSlotCount The amount of outcomes.
    /// @param tokenNames The name of each outcome token.
    /// @return wrapped1155 Array of outcome tokens wrapped to ERC20.
    /// @return data Array of token data used to create each ERC20.
    function deployERC20Positions(
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256 outcomeSlotCount,
        string[] memory tokenNames
    ) internal returns (IERC20[] memory wrapped1155, bytes[] memory data) {
        uint256 invalidResultIndex = outcomeSlotCount - 1;

        wrapped1155 = new IERC20[](outcomeSlotCount);
        data = new bytes[](outcomeSlotCount);

        for (uint256 j = 0; j < outcomeSlotCount; j++) {
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

    /// @dev Returns all the markets created by this factory.
    /// @return The addresses of the markets.
    function allMarkets() external view returns (address[] memory) {
        return markets;
    }

    /// @notice Returns the amount of markets created by this factory.
    /// @return The amount of markets.
    function marketCount() external view returns (uint256) {
        return markets.length;
    }
}
