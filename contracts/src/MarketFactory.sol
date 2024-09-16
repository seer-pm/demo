/**
 *  @authors: [@xyzseer]
 *  @reviewers: [@nvm1410, @madhurMongia, @unknownunknown1, @mani99brar]
 *  @auditors: []
 *  @bounties: []
 *  @deployments: []
 */

// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./Market.sol";
import "./RealityProxy.sol";
import "./WrappedERC20Factory.sol";
import {IRealityETH_v3_0, IConditionalTokens} from "./Interfaces.sol";

contract MarketFactory {
    using Clones for address;

    // Workaround "stack too deep" errors
    struct CreateMarketParams {
        string marketName; // Used only in categorical, multi categorical, and scalar markets. In multi scalar markets, the market name is formed using questionStart + outcomeType + questionEnd.
        string rules; // IPFS uri of the market rules
        string[] outcomes; // The market outcomes, doesn't include the INVALID_RESULT outcome
        string questionStart; // Used to build the Reality question on multi scalar markets
        string questionEnd; // Used to build the Reality question on multi scalar markets
        string outcomeType; // Used to build the Reality question on multi scalar markets
        uint256 parentOutcome; // conditional outcome to use (optional)
        address parentMarket; // conditional market to use (optional)
        string category; // Reality question category
        string lang; // Reality question language
        uint256 lowerBound; // Lower bound, only used for scalar markets
        uint256 upperBound; // Upper bound, only user for scalar markets
        uint256 minBond; // Min bond to use on Reality
        uint32 openingTime; // Reality question opening time
        string[] tokenNames; // Name of the ERC20 tokens associated to each outcome
    }

    // Workaround "stack too deep" errors
    struct InternalMarketConfig {
        string[] encodedQuestions; // The encoded questions containing the Reality parameters
        uint256 outcomeSlotCount; // Conditional Tokens outcomeSlotCount
        uint256 templateId; // Reality templateId
    }

    uint8 internal constant REALITY_UINT_TEMPLATE = 1; // Template for scalar and multi scalar markets
    uint8 internal constant REALITY_SINGLE_SELECT_TEMPLATE = 2; // Template for categorical markets
    uint8 internal constant REALITY_MULTI_SELECT_TEMPLATE = 3; // Template for multi categorical markets

    uint32 public immutable questionTimeout; // Reality question timeout

    address public immutable arbitrator; // Arbitrator contract
    IRealityETH_v3_0 public immutable realitio; // Reality.eth contract
    WrappedERC20Factory public immutable wrappedERC20Factory; // WrappedERC20Factory contract
    IConditionalTokens public immutable conditionalTokens; // Conditional Tokens contract
    address public immutable collateralToken; // Conditional Tokens collateral token contract
    RealityProxy public immutable realityProxy; // Oracle contract
    address[] public markets; // Markets created by this factory
    address public immutable market; // Market contract

    /// @dev To be emitted when a new market is created
    event NewMarket(
        address indexed market,
        string marketName,
        address parentMarket,
        string rules,
        bytes32 conditionId,
        bytes32 questionId,
        bytes32[] questionsIds
    );

    /**
     *  @dev Constructor.
     *  @param _market Address of the market contract that is going to be used for each new deployment.
     *  @param _arbitrator Address of the arbitrator that is going to resolve Realitio disputes.
     *  @param _realitio Address of the Realitio implementation.
     *  @param _wrappedERC20Factory Address of the WrappedERC20Factory implementation.
     *  @param _conditionalTokens Address of the ConditionalTokens implementation.
     *  @param _collateralToken Address of the collateral token.
     *  @param _realityProxy Address of the RealityProxy implementation.
     *  @param _questionTimeout Reality question timeout.
     */
    constructor(
        address _market,
        address _arbitrator,
        IRealityETH_v3_0 _realitio,
        WrappedERC20Factory _wrappedERC20Factory,
        IConditionalTokens _conditionalTokens,
        address _collateralToken,
        RealityProxy _realityProxy,
        uint32 _questionTimeout
    ) {
        market = _market;
        arbitrator = _arbitrator;
        realitio = _realitio;
        wrappedERC20Factory = _wrappedERC20Factory;
        conditionalTokens = _conditionalTokens;
        collateralToken = _collateralToken;
        realityProxy = _realityProxy;
        questionTimeout = _questionTimeout;
    }

    /// @dev Creates a Categorical market. Reverts if a market with the same question already exists.
    /// @notice Categorical markets are associated with a Reality question that has only one answer
    function createCategoricalMarket(
        CreateMarketParams calldata params
    ) external returns (address) {
        require(
            params.outcomes.length >= 2,
            "Outcomes count must be 2 or more"
        );

        string[] memory encodedQuestions = new string[](1);
        encodedQuestions[0] = encodeRealityQuestionWithOutcomes(
            params.marketName,
            params.outcomes,
            params.category,
            params.lang
        );

        return
            createMarket(
                params,
                params.marketName,
                InternalMarketConfig({
                    encodedQuestions: encodedQuestions,
                    outcomeSlotCount: params.outcomes.length + 1, // additional outcome for Invalid Result
                    templateId: REALITY_SINGLE_SELECT_TEMPLATE
                })
            );
    }

    /// @dev Creates a Multi Categorical market.
    /// @notice Multi Categorical markets are associated with a Reality question that has one or more answers
    function createMultiCategoricalMarket(
        CreateMarketParams calldata params
    ) external returns (address) {
        require(
            params.outcomes.length >= 2,
            "Outcomes count must be 2 or more"
        );

        string[] memory encodedQuestions = new string[](1);
        encodedQuestions[0] = encodeRealityQuestionWithOutcomes(
            params.marketName,
            params.outcomes,
            params.category,
            params.lang
        );

        return
            createMarket(
                params,
                params.marketName,
                InternalMarketConfig({
                    encodedQuestions: encodedQuestions,
                    outcomeSlotCount: params.outcomes.length + 1, // additional outcome for Invalid Result
                    templateId: REALITY_MULTI_SELECT_TEMPLATE
                })
            );
    }

    /// @dev Creates a Scalar market.
    /// @notice Scalar markets are associated with a Reality question that resolves to a numeric value
    function createScalarMarket(
        CreateMarketParams calldata params
    ) external returns (address) {
        require(
            params.upperBound > params.lowerBound,
            "upperBound must be higher than lowerBound"
        );
        // values reserved by Reality for INVALID and UNRESOLVED_ANSWER
        require(
            params.upperBound < type(uint256).max - 2,
            "upperBound must be less than uint256.max - 2"
        );
        require(params.outcomes.length == 2, "Outcomes count must be 2");

        string[] memory encodedQuestions = new string[](1);
        encodedQuestions[0] = encodeRealityQuestionWithoutOutcomes(
            params.marketName,
            params.category,
            params.lang
        );

        return
            createMarket(
                params,
                params.marketName,
                InternalMarketConfig({
                    encodedQuestions: encodedQuestions,
                    outcomeSlotCount: 3, // additional outcome for Invalid Result
                    templateId: REALITY_UINT_TEMPLATE
                })
            );
    }

    /// @dev Creates a Multi Scalar market
    /// @notice Multi Scalar markets are associated with two or more Reality questions, and each one of them resolves to a numeric value
    function createMultiScalarMarket(
        CreateMarketParams calldata params
    ) external returns (address) {
        require(
            params.outcomes.length >= 2,
            "Outcomes count must be 2 or more"
        );

        string[] memory encodedQuestions = new string[](params.outcomes.length);

        for (uint256 i = 0; i < params.outcomes.length; i++) {
            encodedQuestions[i] = encodeRealityQuestionWithoutOutcomes(
                string(
                    abi.encodePacked(
                        params.questionStart,
                        params.outcomes[i],
                        params.questionEnd
                    )
                ),
                params.category,
                params.lang
            );
        }

        return
            createMarket(
                params,
                string(
                    abi.encodePacked(
                        params.questionStart,
                        "[",
                        params.outcomeType,
                        "]",
                        params.questionEnd
                    )
                ),
                InternalMarketConfig({
                    encodedQuestions: encodedQuestions,
                    outcomeSlotCount: params.outcomes.length + 1, // additional outcome for Invalid Result
                    templateId: REALITY_UINT_TEMPLATE
                })
            );
    }

    /// @dev Creates the Market and deploys the wrapped ERC20 tokens
    function createMarket(
        CreateMarketParams memory params,
        string memory marketName,
        InternalMarketConfig memory config
    ) internal returns (address) {
        (
            Market.ConditionalTokensParams memory conditionalTokensParams,
            Market.RealityParams memory realityParams
        ) = getNewMarketParams(params, config);

        deployERC20Positions(
            conditionalTokensParams.parentCollectionId,
            conditionalTokensParams.conditionId,
            config.outcomeSlotCount,
            params.tokenNames
        );

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
            params.rules,
            conditionalTokensParams.conditionId,
            conditionalTokensParams.questionId,
            realityParams.questionsIds
        );

        markets.push(address(instance));

        return address(instance);
    }

    /// @dev Creates the structures needed to initialize the new market
    function getNewMarketParams(
        CreateMarketParams memory params,
        InternalMarketConfig memory config
    )
        internal
        returns (
            Market.ConditionalTokensParams memory,
            Market.RealityParams memory
        )
    {
        bytes32 parentCollectionId = params.parentMarket == address(0)
            ? bytes32(0)
            : conditionalTokens.getCollectionId(
                Market(params.parentMarket).parentCollectionId(),
                Market(params.parentMarket).conditionId(),
                1 << params.parentOutcome
            );

        bytes32[] memory questionsIds = new bytes32[](
            config.encodedQuestions.length
        );

        for (uint256 i = 0; i < config.encodedQuestions.length; i++) {
            questionsIds[i] = askRealityQuestion(
                config.encodedQuestions[i],
                config.templateId,
                params.openingTime,
                params.minBond
            );
        }

        // questionId must be a hash of all the values that RealityProxy.resolve() uses to resolve a market,
        // this way if an attacker tries to resolve a fake market by changing some value
        // its questionId will not match the id of a valid market
        bytes32 questionId = keccak256(
            abi.encode(
                questionsIds,
                params.outcomes.length,
                config.templateId,
                params.lowerBound,
                params.upperBound
            )
        );
        bytes32 conditionId = prepareCondition(
            questionId,
            config.outcomeSlotCount
        );

        return (
            Market.ConditionalTokensParams({
                conditionId: conditionId,
                questionId: questionId,
                parentCollectionId: parentCollectionId,
                parentOutcome: params.parentOutcome,
                parentMarket: params.parentMarket
            }),
            Market.RealityParams({
                questionsIds: questionsIds,
                templateId: config.templateId,
                encodedQuestions: config.encodedQuestions
            })
        );
    }

    /// @dev Encodes the question, outcomes, category and language following the Reality structure
    /// If any parameter has a special character like quotes, it must be properly escaped
    /// @param question The question text
    /// @param outcomes[] The question outcomes
    /// @param category The question category
    /// @param lang The question language
    /// @return The encoded question
    function encodeRealityQuestionWithOutcomes(
        string memory question,
        string[] calldata outcomes,
        string memory category,
        string memory lang
    ) internal pure returns (string memory) {
        bytes memory separator = abi.encodePacked(unicode"\u241f");

        bytes memory encodedOutcomes = abi.encodePacked('"', outcomes[0], '"');

        for (uint256 i = 1; i < outcomes.length; i++) {
            encodedOutcomes = abi.encodePacked(
                encodedOutcomes,
                ',"',
                outcomes[i],
                '"'
            );
        }

        return
            string(
                abi.encodePacked(
                    question,
                    separator,
                    encodedOutcomes,
                    separator,
                    category,
                    separator,
                    lang
                )
            );
    }

    /// @dev Encodes the question, category and language following the Reality structure
    /// If any parameter has a special character like quotes, it must be properly escaped
    /// @param question The question text
    /// @param category The question category
    /// @param lang The question language
    /// @return The encoded question
    function encodeRealityQuestionWithoutOutcomes(
        string memory question,
        string memory category,
        string memory lang
    ) internal pure returns (string memory) {
        bytes memory separator = abi.encodePacked(unicode"\u241f");

        return
            string(
                abi.encodePacked(question, separator, category, separator, lang)
            );
    }

    /// @dev Asks a question on reality.
    /// @param encodedQuestion The encoded question containing the Reality parameters
    /// @param templateId The Reality template id
    /// @param openingTime The question opening time
    /// @param minBond The question min bond
    /// @return The question id
    function askRealityQuestion(
        string memory encodedQuestion,
        uint256 templateId,
        uint32 openingTime,
        uint256 minBond
    ) internal returns (bytes32) {
        bytes32 content_hash = keccak256(
            abi.encodePacked(templateId, openingTime, encodedQuestion)
        );

        bytes32 question_id = keccak256(
            abi.encodePacked(
                content_hash,
                arbitrator,
                questionTimeout,
                minBond,
                address(realitio),
                address(this),
                uint256(0)
            )
        );

        if (realitio.getTimeout(question_id) != 0) {
            return question_id;
        }

        return
            realitio.askQuestionWithMinBond(
                templateId,
                encodedQuestion,
                arbitrator,
                questionTimeout,
                openingTime,
                0,
                minBond
            );
    }

    /// @dev Prepares the CTF condition and returns the conditionId
    /// @param questionId An identifier for the question to be answered by the oracle.
    /// @param outcomeSlotCount The number of outcome slots which must be used for this condition. Must not exceed 256.
    function prepareCondition(
        bytes32 questionId,
        uint outcomeSlotCount
    ) internal returns (bytes32) {
        bytes32 conditionId = conditionalTokens.getConditionId(
            address(realityProxy),
            questionId,
            outcomeSlotCount
        );

        if (conditionalTokens.getOutcomeSlotCount(conditionId) == 0) {
            conditionalTokens.prepareCondition(
                address(realityProxy),
                questionId,
                outcomeSlotCount
            );
        }

        return conditionId;
    }

    /// @dev Wraps the ERC1155 outcome tokens to ERC20. The INVALID_RESULT outcome is always called SEER_INVALID_RESULT.
    /// @param parentCollectionId The parentCollectionId
    /// @param conditionId The conditionId
    /// @param outcomeSlotCount The amount of outcomes
    /// @param tokenNames The name of each outcome token
    function deployERC20Positions(
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256 outcomeSlotCount,
        string[] memory tokenNames
    ) internal {
        uint256 invalidResultIndex = outcomeSlotCount - 1;

        for (uint j = 0; j < outcomeSlotCount; j++) {
            bytes32 collectionId = conditionalTokens.getCollectionId(
                parentCollectionId,
                conditionId,
                1 << j
            );
            uint256 tokenId = conditionalTokens.getPositionId(
                collateralToken,
                collectionId
            );

            require(
                j == invalidResultIndex || bytes(tokenNames[j]).length != 0,
                "Missing token name"
            );

            wrappedERC20Factory.createWrappedToken(
                address(conditionalTokens),
                tokenId,
                j == invalidResultIndex ? "SEER_INVALID_RESULT" : tokenNames[j],
                j == invalidResultIndex ? "SEER_INVALID_RESULT" : tokenNames[j]
            );
        }
    }

    /// @dev Returns all the markets created by this factory
    /// @return The addresses of the markets
    function allMarkets() external view returns (address[] memory) {
        return markets;
    }

    /// @notice Returns the amount of markets created by this factory
    /// @return The amount of markets
    function marketCount() external view returns (uint256) {
        return markets.length;
    }
}
