import * as wagmi_codegen from 'wagmi/codegen';

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA)
 */
declare const marketViewAbi: readonly [{
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "marketFactory";
        readonly internalType: "contract IMarketFactory";
        readonly type: "address";
    }, {
        readonly name: "market";
        readonly internalType: "contract Market";
        readonly type: "address";
    }];
    readonly name: "getMarket";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "struct MarketView.MarketInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "id";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "marketName";
            readonly internalType: "string";
            readonly type: "string";
        }, {
            readonly name: "outcomes";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "parentMarket";
            readonly internalType: "struct MarketView.ParentMarketInfo";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "id";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "marketName";
                readonly internalType: "string";
                readonly type: "string";
            }, {
                readonly name: "outcomes";
                readonly internalType: "string[]";
                readonly type: "string[]";
            }, {
                readonly name: "wrappedTokens";
                readonly internalType: "address[]";
                readonly type: "address[]";
            }, {
                readonly name: "conditionId";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "payoutReported";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "payoutNumerators";
                readonly internalType: "uint256[]";
                readonly type: "uint256[]";
            }];
        }, {
            readonly name: "parentOutcome";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "collateralToken";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "wrappedTokens";
            readonly internalType: "address[]";
            readonly type: "address[]";
        }, {
            readonly name: "outcomesSupply";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "lowerBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "upperBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "parentCollectionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "collateralToken1";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "collateralToken2";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "conditionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "questionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "templateId";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "questions";
            readonly internalType: "struct IRealityETH_v3_0.Question[]";
            readonly type: "tuple[]";
            readonly components: readonly [{
                readonly name: "content_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "arbitrator";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "opening_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "timeout";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "finalize_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "is_pending_arbitration";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "bounty";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "best_answer";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "history_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "min_bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }];
        }, {
            readonly name: "questionsIds";
            readonly internalType: "bytes32[]";
            readonly type: "bytes32[]";
        }, {
            readonly name: "encodedQuestions";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "payoutReported";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "payoutNumerators";
            readonly internalType: "uint256[]";
            readonly type: "uint256[]";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "count";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "marketFactory";
        readonly internalType: "contract IMarketFactory";
        readonly type: "address";
    }];
    readonly name: "getMarkets";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "struct MarketView.MarketInfo[]";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "id";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "marketName";
            readonly internalType: "string";
            readonly type: "string";
        }, {
            readonly name: "outcomes";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "parentMarket";
            readonly internalType: "struct MarketView.ParentMarketInfo";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "id";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "marketName";
                readonly internalType: "string";
                readonly type: "string";
            }, {
                readonly name: "outcomes";
                readonly internalType: "string[]";
                readonly type: "string[]";
            }, {
                readonly name: "wrappedTokens";
                readonly internalType: "address[]";
                readonly type: "address[]";
            }, {
                readonly name: "conditionId";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "payoutReported";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "payoutNumerators";
                readonly internalType: "uint256[]";
                readonly type: "uint256[]";
            }];
        }, {
            readonly name: "parentOutcome";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "collateralToken";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "wrappedTokens";
            readonly internalType: "address[]";
            readonly type: "address[]";
        }, {
            readonly name: "outcomesSupply";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "lowerBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "upperBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "parentCollectionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "collateralToken1";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "collateralToken2";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "conditionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "questionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "templateId";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "questions";
            readonly internalType: "struct IRealityETH_v3_0.Question[]";
            readonly type: "tuple[]";
            readonly components: readonly [{
                readonly name: "content_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "arbitrator";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "opening_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "timeout";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "finalize_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "is_pending_arbitration";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "bounty";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "best_answer";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "history_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "min_bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }];
        }, {
            readonly name: "questionsIds";
            readonly internalType: "bytes32[]";
            readonly type: "bytes32[]";
        }, {
            readonly name: "encodedQuestions";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "payoutReported";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "payoutNumerators";
            readonly internalType: "uint256[]";
            readonly type: "uint256[]";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "questionId";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }, {
        readonly name: "realitio";
        readonly internalType: "contract IRealityETH_v3_0";
        readonly type: "address";
    }];
    readonly name: "getQuestionId";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }];
    readonly stateMutability: "view";
}];
/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA)
 */
declare const marketViewAddress: {
    readonly 1: "0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a";
    readonly 10: "0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00";
    readonly 100: "0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C";
    readonly 8453: "0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD";
    readonly 11155111: "0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA";
};
/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA)
 */
declare const marketViewConfig: {
    readonly address: {
        readonly 1: "0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a";
        readonly 10: "0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00";
        readonly 100: "0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C";
        readonly 8453: "0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD";
        readonly 11155111: "0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA";
    };
    readonly abi: readonly [{
        readonly type: "function";
        readonly inputs: readonly [{
            readonly name: "marketFactory";
            readonly internalType: "contract IMarketFactory";
            readonly type: "address";
        }, {
            readonly name: "market";
            readonly internalType: "contract Market";
            readonly type: "address";
        }];
        readonly name: "getMarket";
        readonly outputs: readonly [{
            readonly name: "";
            readonly internalType: "struct MarketView.MarketInfo";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "id";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "marketName";
                readonly internalType: "string";
                readonly type: "string";
            }, {
                readonly name: "outcomes";
                readonly internalType: "string[]";
                readonly type: "string[]";
            }, {
                readonly name: "parentMarket";
                readonly internalType: "struct MarketView.ParentMarketInfo";
                readonly type: "tuple";
                readonly components: readonly [{
                    readonly name: "id";
                    readonly internalType: "address";
                    readonly type: "address";
                }, {
                    readonly name: "marketName";
                    readonly internalType: "string";
                    readonly type: "string";
                }, {
                    readonly name: "outcomes";
                    readonly internalType: "string[]";
                    readonly type: "string[]";
                }, {
                    readonly name: "wrappedTokens";
                    readonly internalType: "address[]";
                    readonly type: "address[]";
                }, {
                    readonly name: "conditionId";
                    readonly internalType: "bytes32";
                    readonly type: "bytes32";
                }, {
                    readonly name: "payoutReported";
                    readonly internalType: "bool";
                    readonly type: "bool";
                }, {
                    readonly name: "payoutNumerators";
                    readonly internalType: "uint256[]";
                    readonly type: "uint256[]";
                }];
            }, {
                readonly name: "parentOutcome";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "collateralToken";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "wrappedTokens";
                readonly internalType: "address[]";
                readonly type: "address[]";
            }, {
                readonly name: "outcomesSupply";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "lowerBound";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "upperBound";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "parentCollectionId";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "collateralToken1";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "collateralToken2";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "conditionId";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "questionId";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "templateId";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "questions";
                readonly internalType: "struct IRealityETH_v3_0.Question[]";
                readonly type: "tuple[]";
                readonly components: readonly [{
                    readonly name: "content_hash";
                    readonly internalType: "bytes32";
                    readonly type: "bytes32";
                }, {
                    readonly name: "arbitrator";
                    readonly internalType: "address";
                    readonly type: "address";
                }, {
                    readonly name: "opening_ts";
                    readonly internalType: "uint32";
                    readonly type: "uint32";
                }, {
                    readonly name: "timeout";
                    readonly internalType: "uint32";
                    readonly type: "uint32";
                }, {
                    readonly name: "finalize_ts";
                    readonly internalType: "uint32";
                    readonly type: "uint32";
                }, {
                    readonly name: "is_pending_arbitration";
                    readonly internalType: "bool";
                    readonly type: "bool";
                }, {
                    readonly name: "bounty";
                    readonly internalType: "uint256";
                    readonly type: "uint256";
                }, {
                    readonly name: "best_answer";
                    readonly internalType: "bytes32";
                    readonly type: "bytes32";
                }, {
                    readonly name: "history_hash";
                    readonly internalType: "bytes32";
                    readonly type: "bytes32";
                }, {
                    readonly name: "bond";
                    readonly internalType: "uint256";
                    readonly type: "uint256";
                }, {
                    readonly name: "min_bond";
                    readonly internalType: "uint256";
                    readonly type: "uint256";
                }];
            }, {
                readonly name: "questionsIds";
                readonly internalType: "bytes32[]";
                readonly type: "bytes32[]";
            }, {
                readonly name: "encodedQuestions";
                readonly internalType: "string[]";
                readonly type: "string[]";
            }, {
                readonly name: "payoutReported";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "payoutNumerators";
                readonly internalType: "uint256[]";
                readonly type: "uint256[]";
            }];
        }];
        readonly stateMutability: "view";
    }, {
        readonly type: "function";
        readonly inputs: readonly [{
            readonly name: "count";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "marketFactory";
            readonly internalType: "contract IMarketFactory";
            readonly type: "address";
        }];
        readonly name: "getMarkets";
        readonly outputs: readonly [{
            readonly name: "";
            readonly internalType: "struct MarketView.MarketInfo[]";
            readonly type: "tuple[]";
            readonly components: readonly [{
                readonly name: "id";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "marketName";
                readonly internalType: "string";
                readonly type: "string";
            }, {
                readonly name: "outcomes";
                readonly internalType: "string[]";
                readonly type: "string[]";
            }, {
                readonly name: "parentMarket";
                readonly internalType: "struct MarketView.ParentMarketInfo";
                readonly type: "tuple";
                readonly components: readonly [{
                    readonly name: "id";
                    readonly internalType: "address";
                    readonly type: "address";
                }, {
                    readonly name: "marketName";
                    readonly internalType: "string";
                    readonly type: "string";
                }, {
                    readonly name: "outcomes";
                    readonly internalType: "string[]";
                    readonly type: "string[]";
                }, {
                    readonly name: "wrappedTokens";
                    readonly internalType: "address[]";
                    readonly type: "address[]";
                }, {
                    readonly name: "conditionId";
                    readonly internalType: "bytes32";
                    readonly type: "bytes32";
                }, {
                    readonly name: "payoutReported";
                    readonly internalType: "bool";
                    readonly type: "bool";
                }, {
                    readonly name: "payoutNumerators";
                    readonly internalType: "uint256[]";
                    readonly type: "uint256[]";
                }];
            }, {
                readonly name: "parentOutcome";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "collateralToken";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "wrappedTokens";
                readonly internalType: "address[]";
                readonly type: "address[]";
            }, {
                readonly name: "outcomesSupply";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "lowerBound";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "upperBound";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "parentCollectionId";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "collateralToken1";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "collateralToken2";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "conditionId";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "questionId";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "templateId";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "questions";
                readonly internalType: "struct IRealityETH_v3_0.Question[]";
                readonly type: "tuple[]";
                readonly components: readonly [{
                    readonly name: "content_hash";
                    readonly internalType: "bytes32";
                    readonly type: "bytes32";
                }, {
                    readonly name: "arbitrator";
                    readonly internalType: "address";
                    readonly type: "address";
                }, {
                    readonly name: "opening_ts";
                    readonly internalType: "uint32";
                    readonly type: "uint32";
                }, {
                    readonly name: "timeout";
                    readonly internalType: "uint32";
                    readonly type: "uint32";
                }, {
                    readonly name: "finalize_ts";
                    readonly internalType: "uint32";
                    readonly type: "uint32";
                }, {
                    readonly name: "is_pending_arbitration";
                    readonly internalType: "bool";
                    readonly type: "bool";
                }, {
                    readonly name: "bounty";
                    readonly internalType: "uint256";
                    readonly type: "uint256";
                }, {
                    readonly name: "best_answer";
                    readonly internalType: "bytes32";
                    readonly type: "bytes32";
                }, {
                    readonly name: "history_hash";
                    readonly internalType: "bytes32";
                    readonly type: "bytes32";
                }, {
                    readonly name: "bond";
                    readonly internalType: "uint256";
                    readonly type: "uint256";
                }, {
                    readonly name: "min_bond";
                    readonly internalType: "uint256";
                    readonly type: "uint256";
                }];
            }, {
                readonly name: "questionsIds";
                readonly internalType: "bytes32[]";
                readonly type: "bytes32[]";
            }, {
                readonly name: "encodedQuestions";
                readonly internalType: "string[]";
                readonly type: "string[]";
            }, {
                readonly name: "payoutReported";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "payoutNumerators";
                readonly internalType: "uint256[]";
                readonly type: "uint256[]";
            }];
        }];
        readonly stateMutability: "view";
    }, {
        readonly type: "function";
        readonly inputs: readonly [{
            readonly name: "questionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "realitio";
            readonly internalType: "contract IRealityETH_v3_0";
            readonly type: "address";
        }];
        readonly name: "getQuestionId";
        readonly outputs: readonly [{
            readonly name: "";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }];
        readonly stateMutability: "view";
    }];
};
/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketViewAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA)
 */
declare const useReadMarketView: wagmi_codegen.CreateUseReadContractReturnType<readonly [{
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "marketFactory";
        readonly internalType: "contract IMarketFactory";
        readonly type: "address";
    }, {
        readonly name: "market";
        readonly internalType: "contract Market";
        readonly type: "address";
    }];
    readonly name: "getMarket";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "struct MarketView.MarketInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "id";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "marketName";
            readonly internalType: "string";
            readonly type: "string";
        }, {
            readonly name: "outcomes";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "parentMarket";
            readonly internalType: "struct MarketView.ParentMarketInfo";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "id";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "marketName";
                readonly internalType: "string";
                readonly type: "string";
            }, {
                readonly name: "outcomes";
                readonly internalType: "string[]";
                readonly type: "string[]";
            }, {
                readonly name: "wrappedTokens";
                readonly internalType: "address[]";
                readonly type: "address[]";
            }, {
                readonly name: "conditionId";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "payoutReported";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "payoutNumerators";
                readonly internalType: "uint256[]";
                readonly type: "uint256[]";
            }];
        }, {
            readonly name: "parentOutcome";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "collateralToken";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "wrappedTokens";
            readonly internalType: "address[]";
            readonly type: "address[]";
        }, {
            readonly name: "outcomesSupply";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "lowerBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "upperBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "parentCollectionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "collateralToken1";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "collateralToken2";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "conditionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "questionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "templateId";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "questions";
            readonly internalType: "struct IRealityETH_v3_0.Question[]";
            readonly type: "tuple[]";
            readonly components: readonly [{
                readonly name: "content_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "arbitrator";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "opening_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "timeout";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "finalize_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "is_pending_arbitration";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "bounty";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "best_answer";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "history_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "min_bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }];
        }, {
            readonly name: "questionsIds";
            readonly internalType: "bytes32[]";
            readonly type: "bytes32[]";
        }, {
            readonly name: "encodedQuestions";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "payoutReported";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "payoutNumerators";
            readonly internalType: "uint256[]";
            readonly type: "uint256[]";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "count";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "marketFactory";
        readonly internalType: "contract IMarketFactory";
        readonly type: "address";
    }];
    readonly name: "getMarkets";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "struct MarketView.MarketInfo[]";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "id";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "marketName";
            readonly internalType: "string";
            readonly type: "string";
        }, {
            readonly name: "outcomes";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "parentMarket";
            readonly internalType: "struct MarketView.ParentMarketInfo";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "id";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "marketName";
                readonly internalType: "string";
                readonly type: "string";
            }, {
                readonly name: "outcomes";
                readonly internalType: "string[]";
                readonly type: "string[]";
            }, {
                readonly name: "wrappedTokens";
                readonly internalType: "address[]";
                readonly type: "address[]";
            }, {
                readonly name: "conditionId";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "payoutReported";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "payoutNumerators";
                readonly internalType: "uint256[]";
                readonly type: "uint256[]";
            }];
        }, {
            readonly name: "parentOutcome";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "collateralToken";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "wrappedTokens";
            readonly internalType: "address[]";
            readonly type: "address[]";
        }, {
            readonly name: "outcomesSupply";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "lowerBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "upperBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "parentCollectionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "collateralToken1";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "collateralToken2";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "conditionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "questionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "templateId";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "questions";
            readonly internalType: "struct IRealityETH_v3_0.Question[]";
            readonly type: "tuple[]";
            readonly components: readonly [{
                readonly name: "content_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "arbitrator";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "opening_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "timeout";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "finalize_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "is_pending_arbitration";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "bounty";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "best_answer";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "history_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "min_bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }];
        }, {
            readonly name: "questionsIds";
            readonly internalType: "bytes32[]";
            readonly type: "bytes32[]";
        }, {
            readonly name: "encodedQuestions";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "payoutReported";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "payoutNumerators";
            readonly internalType: "uint256[]";
            readonly type: "uint256[]";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "questionId";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }, {
        readonly name: "realitio";
        readonly internalType: "contract IRealityETH_v3_0";
        readonly type: "address";
    }];
    readonly name: "getQuestionId";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }];
    readonly stateMutability: "view";
}], {
    readonly 1: "0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a";
    readonly 10: "0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00";
    readonly 100: "0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C";
    readonly 8453: "0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD";
    readonly 11155111: "0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA";
}, undefined, "address" | "abi" | "chainId">;
/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketViewAbi}__ and `functionName` set to `"getMarket"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA)
 */
declare const useReadMarketViewGetMarket: wagmi_codegen.CreateUseReadContractReturnType<readonly [{
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "marketFactory";
        readonly internalType: "contract IMarketFactory";
        readonly type: "address";
    }, {
        readonly name: "market";
        readonly internalType: "contract Market";
        readonly type: "address";
    }];
    readonly name: "getMarket";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "struct MarketView.MarketInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "id";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "marketName";
            readonly internalType: "string";
            readonly type: "string";
        }, {
            readonly name: "outcomes";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "parentMarket";
            readonly internalType: "struct MarketView.ParentMarketInfo";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "id";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "marketName";
                readonly internalType: "string";
                readonly type: "string";
            }, {
                readonly name: "outcomes";
                readonly internalType: "string[]";
                readonly type: "string[]";
            }, {
                readonly name: "wrappedTokens";
                readonly internalType: "address[]";
                readonly type: "address[]";
            }, {
                readonly name: "conditionId";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "payoutReported";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "payoutNumerators";
                readonly internalType: "uint256[]";
                readonly type: "uint256[]";
            }];
        }, {
            readonly name: "parentOutcome";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "collateralToken";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "wrappedTokens";
            readonly internalType: "address[]";
            readonly type: "address[]";
        }, {
            readonly name: "outcomesSupply";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "lowerBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "upperBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "parentCollectionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "collateralToken1";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "collateralToken2";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "conditionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "questionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "templateId";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "questions";
            readonly internalType: "struct IRealityETH_v3_0.Question[]";
            readonly type: "tuple[]";
            readonly components: readonly [{
                readonly name: "content_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "arbitrator";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "opening_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "timeout";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "finalize_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "is_pending_arbitration";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "bounty";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "best_answer";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "history_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "min_bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }];
        }, {
            readonly name: "questionsIds";
            readonly internalType: "bytes32[]";
            readonly type: "bytes32[]";
        }, {
            readonly name: "encodedQuestions";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "payoutReported";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "payoutNumerators";
            readonly internalType: "uint256[]";
            readonly type: "uint256[]";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "count";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "marketFactory";
        readonly internalType: "contract IMarketFactory";
        readonly type: "address";
    }];
    readonly name: "getMarkets";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "struct MarketView.MarketInfo[]";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "id";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "marketName";
            readonly internalType: "string";
            readonly type: "string";
        }, {
            readonly name: "outcomes";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "parentMarket";
            readonly internalType: "struct MarketView.ParentMarketInfo";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "id";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "marketName";
                readonly internalType: "string";
                readonly type: "string";
            }, {
                readonly name: "outcomes";
                readonly internalType: "string[]";
                readonly type: "string[]";
            }, {
                readonly name: "wrappedTokens";
                readonly internalType: "address[]";
                readonly type: "address[]";
            }, {
                readonly name: "conditionId";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "payoutReported";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "payoutNumerators";
                readonly internalType: "uint256[]";
                readonly type: "uint256[]";
            }];
        }, {
            readonly name: "parentOutcome";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "collateralToken";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "wrappedTokens";
            readonly internalType: "address[]";
            readonly type: "address[]";
        }, {
            readonly name: "outcomesSupply";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "lowerBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "upperBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "parentCollectionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "collateralToken1";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "collateralToken2";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "conditionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "questionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "templateId";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "questions";
            readonly internalType: "struct IRealityETH_v3_0.Question[]";
            readonly type: "tuple[]";
            readonly components: readonly [{
                readonly name: "content_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "arbitrator";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "opening_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "timeout";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "finalize_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "is_pending_arbitration";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "bounty";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "best_answer";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "history_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "min_bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }];
        }, {
            readonly name: "questionsIds";
            readonly internalType: "bytes32[]";
            readonly type: "bytes32[]";
        }, {
            readonly name: "encodedQuestions";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "payoutReported";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "payoutNumerators";
            readonly internalType: "uint256[]";
            readonly type: "uint256[]";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "questionId";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }, {
        readonly name: "realitio";
        readonly internalType: "contract IRealityETH_v3_0";
        readonly type: "address";
    }];
    readonly name: "getQuestionId";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }];
    readonly stateMutability: "view";
}], {
    readonly 1: "0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a";
    readonly 10: "0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00";
    readonly 100: "0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C";
    readonly 8453: "0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD";
    readonly 11155111: "0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA";
}, "getMarket", "address" | "abi" | "chainId" | "functionName">;
/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketViewAbi}__ and `functionName` set to `"getMarkets"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA)
 */
declare const useReadMarketViewGetMarkets: wagmi_codegen.CreateUseReadContractReturnType<readonly [{
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "marketFactory";
        readonly internalType: "contract IMarketFactory";
        readonly type: "address";
    }, {
        readonly name: "market";
        readonly internalType: "contract Market";
        readonly type: "address";
    }];
    readonly name: "getMarket";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "struct MarketView.MarketInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "id";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "marketName";
            readonly internalType: "string";
            readonly type: "string";
        }, {
            readonly name: "outcomes";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "parentMarket";
            readonly internalType: "struct MarketView.ParentMarketInfo";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "id";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "marketName";
                readonly internalType: "string";
                readonly type: "string";
            }, {
                readonly name: "outcomes";
                readonly internalType: "string[]";
                readonly type: "string[]";
            }, {
                readonly name: "wrappedTokens";
                readonly internalType: "address[]";
                readonly type: "address[]";
            }, {
                readonly name: "conditionId";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "payoutReported";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "payoutNumerators";
                readonly internalType: "uint256[]";
                readonly type: "uint256[]";
            }];
        }, {
            readonly name: "parentOutcome";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "collateralToken";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "wrappedTokens";
            readonly internalType: "address[]";
            readonly type: "address[]";
        }, {
            readonly name: "outcomesSupply";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "lowerBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "upperBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "parentCollectionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "collateralToken1";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "collateralToken2";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "conditionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "questionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "templateId";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "questions";
            readonly internalType: "struct IRealityETH_v3_0.Question[]";
            readonly type: "tuple[]";
            readonly components: readonly [{
                readonly name: "content_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "arbitrator";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "opening_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "timeout";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "finalize_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "is_pending_arbitration";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "bounty";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "best_answer";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "history_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "min_bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }];
        }, {
            readonly name: "questionsIds";
            readonly internalType: "bytes32[]";
            readonly type: "bytes32[]";
        }, {
            readonly name: "encodedQuestions";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "payoutReported";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "payoutNumerators";
            readonly internalType: "uint256[]";
            readonly type: "uint256[]";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "count";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "marketFactory";
        readonly internalType: "contract IMarketFactory";
        readonly type: "address";
    }];
    readonly name: "getMarkets";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "struct MarketView.MarketInfo[]";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "id";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "marketName";
            readonly internalType: "string";
            readonly type: "string";
        }, {
            readonly name: "outcomes";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "parentMarket";
            readonly internalType: "struct MarketView.ParentMarketInfo";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "id";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "marketName";
                readonly internalType: "string";
                readonly type: "string";
            }, {
                readonly name: "outcomes";
                readonly internalType: "string[]";
                readonly type: "string[]";
            }, {
                readonly name: "wrappedTokens";
                readonly internalType: "address[]";
                readonly type: "address[]";
            }, {
                readonly name: "conditionId";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "payoutReported";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "payoutNumerators";
                readonly internalType: "uint256[]";
                readonly type: "uint256[]";
            }];
        }, {
            readonly name: "parentOutcome";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "collateralToken";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "wrappedTokens";
            readonly internalType: "address[]";
            readonly type: "address[]";
        }, {
            readonly name: "outcomesSupply";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "lowerBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "upperBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "parentCollectionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "collateralToken1";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "collateralToken2";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "conditionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "questionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "templateId";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "questions";
            readonly internalType: "struct IRealityETH_v3_0.Question[]";
            readonly type: "tuple[]";
            readonly components: readonly [{
                readonly name: "content_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "arbitrator";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "opening_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "timeout";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "finalize_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "is_pending_arbitration";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "bounty";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "best_answer";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "history_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "min_bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }];
        }, {
            readonly name: "questionsIds";
            readonly internalType: "bytes32[]";
            readonly type: "bytes32[]";
        }, {
            readonly name: "encodedQuestions";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "payoutReported";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "payoutNumerators";
            readonly internalType: "uint256[]";
            readonly type: "uint256[]";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "questionId";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }, {
        readonly name: "realitio";
        readonly internalType: "contract IRealityETH_v3_0";
        readonly type: "address";
    }];
    readonly name: "getQuestionId";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }];
    readonly stateMutability: "view";
}], {
    readonly 1: "0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a";
    readonly 10: "0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00";
    readonly 100: "0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C";
    readonly 8453: "0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD";
    readonly 11155111: "0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA";
}, "getMarkets", "address" | "abi" | "chainId" | "functionName">;
/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketViewAbi}__ and `functionName` set to `"getQuestionId"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA)
 */
declare const useReadMarketViewGetQuestionId: wagmi_codegen.CreateUseReadContractReturnType<readonly [{
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "marketFactory";
        readonly internalType: "contract IMarketFactory";
        readonly type: "address";
    }, {
        readonly name: "market";
        readonly internalType: "contract Market";
        readonly type: "address";
    }];
    readonly name: "getMarket";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "struct MarketView.MarketInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "id";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "marketName";
            readonly internalType: "string";
            readonly type: "string";
        }, {
            readonly name: "outcomes";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "parentMarket";
            readonly internalType: "struct MarketView.ParentMarketInfo";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "id";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "marketName";
                readonly internalType: "string";
                readonly type: "string";
            }, {
                readonly name: "outcomes";
                readonly internalType: "string[]";
                readonly type: "string[]";
            }, {
                readonly name: "wrappedTokens";
                readonly internalType: "address[]";
                readonly type: "address[]";
            }, {
                readonly name: "conditionId";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "payoutReported";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "payoutNumerators";
                readonly internalType: "uint256[]";
                readonly type: "uint256[]";
            }];
        }, {
            readonly name: "parentOutcome";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "collateralToken";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "wrappedTokens";
            readonly internalType: "address[]";
            readonly type: "address[]";
        }, {
            readonly name: "outcomesSupply";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "lowerBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "upperBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "parentCollectionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "collateralToken1";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "collateralToken2";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "conditionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "questionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "templateId";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "questions";
            readonly internalType: "struct IRealityETH_v3_0.Question[]";
            readonly type: "tuple[]";
            readonly components: readonly [{
                readonly name: "content_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "arbitrator";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "opening_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "timeout";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "finalize_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "is_pending_arbitration";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "bounty";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "best_answer";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "history_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "min_bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }];
        }, {
            readonly name: "questionsIds";
            readonly internalType: "bytes32[]";
            readonly type: "bytes32[]";
        }, {
            readonly name: "encodedQuestions";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "payoutReported";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "payoutNumerators";
            readonly internalType: "uint256[]";
            readonly type: "uint256[]";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "count";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "marketFactory";
        readonly internalType: "contract IMarketFactory";
        readonly type: "address";
    }];
    readonly name: "getMarkets";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "struct MarketView.MarketInfo[]";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "id";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "marketName";
            readonly internalType: "string";
            readonly type: "string";
        }, {
            readonly name: "outcomes";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "parentMarket";
            readonly internalType: "struct MarketView.ParentMarketInfo";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "id";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "marketName";
                readonly internalType: "string";
                readonly type: "string";
            }, {
                readonly name: "outcomes";
                readonly internalType: "string[]";
                readonly type: "string[]";
            }, {
                readonly name: "wrappedTokens";
                readonly internalType: "address[]";
                readonly type: "address[]";
            }, {
                readonly name: "conditionId";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "payoutReported";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "payoutNumerators";
                readonly internalType: "uint256[]";
                readonly type: "uint256[]";
            }];
        }, {
            readonly name: "parentOutcome";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "collateralToken";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "wrappedTokens";
            readonly internalType: "address[]";
            readonly type: "address[]";
        }, {
            readonly name: "outcomesSupply";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "lowerBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "upperBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "parentCollectionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "collateralToken1";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "collateralToken2";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "conditionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "questionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "templateId";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "questions";
            readonly internalType: "struct IRealityETH_v3_0.Question[]";
            readonly type: "tuple[]";
            readonly components: readonly [{
                readonly name: "content_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "arbitrator";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "opening_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "timeout";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "finalize_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "is_pending_arbitration";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "bounty";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "best_answer";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "history_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "min_bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }];
        }, {
            readonly name: "questionsIds";
            readonly internalType: "bytes32[]";
            readonly type: "bytes32[]";
        }, {
            readonly name: "encodedQuestions";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "payoutReported";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "payoutNumerators";
            readonly internalType: "uint256[]";
            readonly type: "uint256[]";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "questionId";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }, {
        readonly name: "realitio";
        readonly internalType: "contract IRealityETH_v3_0";
        readonly type: "address";
    }];
    readonly name: "getQuestionId";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }];
    readonly stateMutability: "view";
}], {
    readonly 1: "0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a";
    readonly 10: "0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00";
    readonly 100: "0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C";
    readonly 8453: "0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD";
    readonly 11155111: "0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA";
}, "getQuestionId", "address" | "abi" | "chainId" | "functionName">;
/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketViewAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA)
 */
declare const readMarketView: wagmi_codegen.CreateReadContractReturnType<readonly [{
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "marketFactory";
        readonly internalType: "contract IMarketFactory";
        readonly type: "address";
    }, {
        readonly name: "market";
        readonly internalType: "contract Market";
        readonly type: "address";
    }];
    readonly name: "getMarket";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "struct MarketView.MarketInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "id";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "marketName";
            readonly internalType: "string";
            readonly type: "string";
        }, {
            readonly name: "outcomes";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "parentMarket";
            readonly internalType: "struct MarketView.ParentMarketInfo";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "id";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "marketName";
                readonly internalType: "string";
                readonly type: "string";
            }, {
                readonly name: "outcomes";
                readonly internalType: "string[]";
                readonly type: "string[]";
            }, {
                readonly name: "wrappedTokens";
                readonly internalType: "address[]";
                readonly type: "address[]";
            }, {
                readonly name: "conditionId";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "payoutReported";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "payoutNumerators";
                readonly internalType: "uint256[]";
                readonly type: "uint256[]";
            }];
        }, {
            readonly name: "parentOutcome";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "collateralToken";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "wrappedTokens";
            readonly internalType: "address[]";
            readonly type: "address[]";
        }, {
            readonly name: "outcomesSupply";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "lowerBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "upperBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "parentCollectionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "collateralToken1";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "collateralToken2";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "conditionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "questionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "templateId";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "questions";
            readonly internalType: "struct IRealityETH_v3_0.Question[]";
            readonly type: "tuple[]";
            readonly components: readonly [{
                readonly name: "content_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "arbitrator";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "opening_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "timeout";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "finalize_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "is_pending_arbitration";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "bounty";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "best_answer";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "history_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "min_bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }];
        }, {
            readonly name: "questionsIds";
            readonly internalType: "bytes32[]";
            readonly type: "bytes32[]";
        }, {
            readonly name: "encodedQuestions";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "payoutReported";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "payoutNumerators";
            readonly internalType: "uint256[]";
            readonly type: "uint256[]";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "count";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "marketFactory";
        readonly internalType: "contract IMarketFactory";
        readonly type: "address";
    }];
    readonly name: "getMarkets";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "struct MarketView.MarketInfo[]";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "id";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "marketName";
            readonly internalType: "string";
            readonly type: "string";
        }, {
            readonly name: "outcomes";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "parentMarket";
            readonly internalType: "struct MarketView.ParentMarketInfo";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "id";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "marketName";
                readonly internalType: "string";
                readonly type: "string";
            }, {
                readonly name: "outcomes";
                readonly internalType: "string[]";
                readonly type: "string[]";
            }, {
                readonly name: "wrappedTokens";
                readonly internalType: "address[]";
                readonly type: "address[]";
            }, {
                readonly name: "conditionId";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "payoutReported";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "payoutNumerators";
                readonly internalType: "uint256[]";
                readonly type: "uint256[]";
            }];
        }, {
            readonly name: "parentOutcome";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "collateralToken";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "wrappedTokens";
            readonly internalType: "address[]";
            readonly type: "address[]";
        }, {
            readonly name: "outcomesSupply";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "lowerBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "upperBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "parentCollectionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "collateralToken1";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "collateralToken2";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "conditionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "questionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "templateId";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "questions";
            readonly internalType: "struct IRealityETH_v3_0.Question[]";
            readonly type: "tuple[]";
            readonly components: readonly [{
                readonly name: "content_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "arbitrator";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "opening_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "timeout";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "finalize_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "is_pending_arbitration";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "bounty";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "best_answer";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "history_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "min_bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }];
        }, {
            readonly name: "questionsIds";
            readonly internalType: "bytes32[]";
            readonly type: "bytes32[]";
        }, {
            readonly name: "encodedQuestions";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "payoutReported";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "payoutNumerators";
            readonly internalType: "uint256[]";
            readonly type: "uint256[]";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "questionId";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }, {
        readonly name: "realitio";
        readonly internalType: "contract IRealityETH_v3_0";
        readonly type: "address";
    }];
    readonly name: "getQuestionId";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }];
    readonly stateMutability: "view";
}], {
    readonly 1: "0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a";
    readonly 10: "0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00";
    readonly 100: "0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C";
    readonly 8453: "0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD";
    readonly 11155111: "0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA";
}, undefined, "address" | "abi" | "chainId">;
/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketViewAbi}__ and `functionName` set to `"getMarket"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA)
 */
declare const readMarketViewGetMarket: wagmi_codegen.CreateReadContractReturnType<readonly [{
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "marketFactory";
        readonly internalType: "contract IMarketFactory";
        readonly type: "address";
    }, {
        readonly name: "market";
        readonly internalType: "contract Market";
        readonly type: "address";
    }];
    readonly name: "getMarket";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "struct MarketView.MarketInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "id";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "marketName";
            readonly internalType: "string";
            readonly type: "string";
        }, {
            readonly name: "outcomes";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "parentMarket";
            readonly internalType: "struct MarketView.ParentMarketInfo";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "id";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "marketName";
                readonly internalType: "string";
                readonly type: "string";
            }, {
                readonly name: "outcomes";
                readonly internalType: "string[]";
                readonly type: "string[]";
            }, {
                readonly name: "wrappedTokens";
                readonly internalType: "address[]";
                readonly type: "address[]";
            }, {
                readonly name: "conditionId";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "payoutReported";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "payoutNumerators";
                readonly internalType: "uint256[]";
                readonly type: "uint256[]";
            }];
        }, {
            readonly name: "parentOutcome";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "collateralToken";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "wrappedTokens";
            readonly internalType: "address[]";
            readonly type: "address[]";
        }, {
            readonly name: "outcomesSupply";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "lowerBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "upperBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "parentCollectionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "collateralToken1";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "collateralToken2";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "conditionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "questionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "templateId";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "questions";
            readonly internalType: "struct IRealityETH_v3_0.Question[]";
            readonly type: "tuple[]";
            readonly components: readonly [{
                readonly name: "content_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "arbitrator";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "opening_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "timeout";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "finalize_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "is_pending_arbitration";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "bounty";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "best_answer";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "history_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "min_bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }];
        }, {
            readonly name: "questionsIds";
            readonly internalType: "bytes32[]";
            readonly type: "bytes32[]";
        }, {
            readonly name: "encodedQuestions";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "payoutReported";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "payoutNumerators";
            readonly internalType: "uint256[]";
            readonly type: "uint256[]";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "count";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "marketFactory";
        readonly internalType: "contract IMarketFactory";
        readonly type: "address";
    }];
    readonly name: "getMarkets";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "struct MarketView.MarketInfo[]";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "id";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "marketName";
            readonly internalType: "string";
            readonly type: "string";
        }, {
            readonly name: "outcomes";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "parentMarket";
            readonly internalType: "struct MarketView.ParentMarketInfo";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "id";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "marketName";
                readonly internalType: "string";
                readonly type: "string";
            }, {
                readonly name: "outcomes";
                readonly internalType: "string[]";
                readonly type: "string[]";
            }, {
                readonly name: "wrappedTokens";
                readonly internalType: "address[]";
                readonly type: "address[]";
            }, {
                readonly name: "conditionId";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "payoutReported";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "payoutNumerators";
                readonly internalType: "uint256[]";
                readonly type: "uint256[]";
            }];
        }, {
            readonly name: "parentOutcome";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "collateralToken";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "wrappedTokens";
            readonly internalType: "address[]";
            readonly type: "address[]";
        }, {
            readonly name: "outcomesSupply";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "lowerBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "upperBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "parentCollectionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "collateralToken1";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "collateralToken2";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "conditionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "questionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "templateId";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "questions";
            readonly internalType: "struct IRealityETH_v3_0.Question[]";
            readonly type: "tuple[]";
            readonly components: readonly [{
                readonly name: "content_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "arbitrator";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "opening_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "timeout";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "finalize_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "is_pending_arbitration";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "bounty";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "best_answer";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "history_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "min_bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }];
        }, {
            readonly name: "questionsIds";
            readonly internalType: "bytes32[]";
            readonly type: "bytes32[]";
        }, {
            readonly name: "encodedQuestions";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "payoutReported";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "payoutNumerators";
            readonly internalType: "uint256[]";
            readonly type: "uint256[]";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "questionId";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }, {
        readonly name: "realitio";
        readonly internalType: "contract IRealityETH_v3_0";
        readonly type: "address";
    }];
    readonly name: "getQuestionId";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }];
    readonly stateMutability: "view";
}], {
    readonly 1: "0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a";
    readonly 10: "0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00";
    readonly 100: "0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C";
    readonly 8453: "0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD";
    readonly 11155111: "0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA";
}, "getMarket", "address" | "abi" | "chainId" | "functionName">;
/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketViewAbi}__ and `functionName` set to `"getMarkets"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA)
 */
declare const readMarketViewGetMarkets: wagmi_codegen.CreateReadContractReturnType<readonly [{
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "marketFactory";
        readonly internalType: "contract IMarketFactory";
        readonly type: "address";
    }, {
        readonly name: "market";
        readonly internalType: "contract Market";
        readonly type: "address";
    }];
    readonly name: "getMarket";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "struct MarketView.MarketInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "id";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "marketName";
            readonly internalType: "string";
            readonly type: "string";
        }, {
            readonly name: "outcomes";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "parentMarket";
            readonly internalType: "struct MarketView.ParentMarketInfo";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "id";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "marketName";
                readonly internalType: "string";
                readonly type: "string";
            }, {
                readonly name: "outcomes";
                readonly internalType: "string[]";
                readonly type: "string[]";
            }, {
                readonly name: "wrappedTokens";
                readonly internalType: "address[]";
                readonly type: "address[]";
            }, {
                readonly name: "conditionId";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "payoutReported";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "payoutNumerators";
                readonly internalType: "uint256[]";
                readonly type: "uint256[]";
            }];
        }, {
            readonly name: "parentOutcome";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "collateralToken";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "wrappedTokens";
            readonly internalType: "address[]";
            readonly type: "address[]";
        }, {
            readonly name: "outcomesSupply";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "lowerBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "upperBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "parentCollectionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "collateralToken1";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "collateralToken2";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "conditionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "questionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "templateId";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "questions";
            readonly internalType: "struct IRealityETH_v3_0.Question[]";
            readonly type: "tuple[]";
            readonly components: readonly [{
                readonly name: "content_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "arbitrator";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "opening_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "timeout";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "finalize_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "is_pending_arbitration";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "bounty";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "best_answer";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "history_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "min_bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }];
        }, {
            readonly name: "questionsIds";
            readonly internalType: "bytes32[]";
            readonly type: "bytes32[]";
        }, {
            readonly name: "encodedQuestions";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "payoutReported";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "payoutNumerators";
            readonly internalType: "uint256[]";
            readonly type: "uint256[]";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "count";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "marketFactory";
        readonly internalType: "contract IMarketFactory";
        readonly type: "address";
    }];
    readonly name: "getMarkets";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "struct MarketView.MarketInfo[]";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "id";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "marketName";
            readonly internalType: "string";
            readonly type: "string";
        }, {
            readonly name: "outcomes";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "parentMarket";
            readonly internalType: "struct MarketView.ParentMarketInfo";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "id";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "marketName";
                readonly internalType: "string";
                readonly type: "string";
            }, {
                readonly name: "outcomes";
                readonly internalType: "string[]";
                readonly type: "string[]";
            }, {
                readonly name: "wrappedTokens";
                readonly internalType: "address[]";
                readonly type: "address[]";
            }, {
                readonly name: "conditionId";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "payoutReported";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "payoutNumerators";
                readonly internalType: "uint256[]";
                readonly type: "uint256[]";
            }];
        }, {
            readonly name: "parentOutcome";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "collateralToken";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "wrappedTokens";
            readonly internalType: "address[]";
            readonly type: "address[]";
        }, {
            readonly name: "outcomesSupply";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "lowerBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "upperBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "parentCollectionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "collateralToken1";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "collateralToken2";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "conditionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "questionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "templateId";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "questions";
            readonly internalType: "struct IRealityETH_v3_0.Question[]";
            readonly type: "tuple[]";
            readonly components: readonly [{
                readonly name: "content_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "arbitrator";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "opening_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "timeout";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "finalize_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "is_pending_arbitration";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "bounty";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "best_answer";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "history_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "min_bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }];
        }, {
            readonly name: "questionsIds";
            readonly internalType: "bytes32[]";
            readonly type: "bytes32[]";
        }, {
            readonly name: "encodedQuestions";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "payoutReported";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "payoutNumerators";
            readonly internalType: "uint256[]";
            readonly type: "uint256[]";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "questionId";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }, {
        readonly name: "realitio";
        readonly internalType: "contract IRealityETH_v3_0";
        readonly type: "address";
    }];
    readonly name: "getQuestionId";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }];
    readonly stateMutability: "view";
}], {
    readonly 1: "0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a";
    readonly 10: "0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00";
    readonly 100: "0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C";
    readonly 8453: "0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD";
    readonly 11155111: "0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA";
}, "getMarkets", "address" | "abi" | "chainId" | "functionName">;
/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketViewAbi}__ and `functionName` set to `"getQuestionId"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA)
 */
declare const readMarketViewGetQuestionId: wagmi_codegen.CreateReadContractReturnType<readonly [{
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "marketFactory";
        readonly internalType: "contract IMarketFactory";
        readonly type: "address";
    }, {
        readonly name: "market";
        readonly internalType: "contract Market";
        readonly type: "address";
    }];
    readonly name: "getMarket";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "struct MarketView.MarketInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "id";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "marketName";
            readonly internalType: "string";
            readonly type: "string";
        }, {
            readonly name: "outcomes";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "parentMarket";
            readonly internalType: "struct MarketView.ParentMarketInfo";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "id";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "marketName";
                readonly internalType: "string";
                readonly type: "string";
            }, {
                readonly name: "outcomes";
                readonly internalType: "string[]";
                readonly type: "string[]";
            }, {
                readonly name: "wrappedTokens";
                readonly internalType: "address[]";
                readonly type: "address[]";
            }, {
                readonly name: "conditionId";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "payoutReported";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "payoutNumerators";
                readonly internalType: "uint256[]";
                readonly type: "uint256[]";
            }];
        }, {
            readonly name: "parentOutcome";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "collateralToken";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "wrappedTokens";
            readonly internalType: "address[]";
            readonly type: "address[]";
        }, {
            readonly name: "outcomesSupply";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "lowerBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "upperBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "parentCollectionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "collateralToken1";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "collateralToken2";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "conditionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "questionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "templateId";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "questions";
            readonly internalType: "struct IRealityETH_v3_0.Question[]";
            readonly type: "tuple[]";
            readonly components: readonly [{
                readonly name: "content_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "arbitrator";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "opening_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "timeout";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "finalize_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "is_pending_arbitration";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "bounty";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "best_answer";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "history_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "min_bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }];
        }, {
            readonly name: "questionsIds";
            readonly internalType: "bytes32[]";
            readonly type: "bytes32[]";
        }, {
            readonly name: "encodedQuestions";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "payoutReported";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "payoutNumerators";
            readonly internalType: "uint256[]";
            readonly type: "uint256[]";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "count";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "marketFactory";
        readonly internalType: "contract IMarketFactory";
        readonly type: "address";
    }];
    readonly name: "getMarkets";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "struct MarketView.MarketInfo[]";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "id";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "marketName";
            readonly internalType: "string";
            readonly type: "string";
        }, {
            readonly name: "outcomes";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "parentMarket";
            readonly internalType: "struct MarketView.ParentMarketInfo";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "id";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "marketName";
                readonly internalType: "string";
                readonly type: "string";
            }, {
                readonly name: "outcomes";
                readonly internalType: "string[]";
                readonly type: "string[]";
            }, {
                readonly name: "wrappedTokens";
                readonly internalType: "address[]";
                readonly type: "address[]";
            }, {
                readonly name: "conditionId";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "payoutReported";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "payoutNumerators";
                readonly internalType: "uint256[]";
                readonly type: "uint256[]";
            }];
        }, {
            readonly name: "parentOutcome";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "collateralToken";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "wrappedTokens";
            readonly internalType: "address[]";
            readonly type: "address[]";
        }, {
            readonly name: "outcomesSupply";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "lowerBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "upperBound";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "parentCollectionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "collateralToken1";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "collateralToken2";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "conditionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "questionId";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "templateId";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "questions";
            readonly internalType: "struct IRealityETH_v3_0.Question[]";
            readonly type: "tuple[]";
            readonly components: readonly [{
                readonly name: "content_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "arbitrator";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "opening_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "timeout";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "finalize_ts";
                readonly internalType: "uint32";
                readonly type: "uint32";
            }, {
                readonly name: "is_pending_arbitration";
                readonly internalType: "bool";
                readonly type: "bool";
            }, {
                readonly name: "bounty";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "best_answer";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "history_hash";
                readonly internalType: "bytes32";
                readonly type: "bytes32";
            }, {
                readonly name: "bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "min_bond";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }];
        }, {
            readonly name: "questionsIds";
            readonly internalType: "bytes32[]";
            readonly type: "bytes32[]";
        }, {
            readonly name: "encodedQuestions";
            readonly internalType: "string[]";
            readonly type: "string[]";
        }, {
            readonly name: "payoutReported";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "payoutNumerators";
            readonly internalType: "uint256[]";
            readonly type: "uint256[]";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "questionId";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }, {
        readonly name: "realitio";
        readonly internalType: "contract IRealityETH_v3_0";
        readonly type: "address";
    }];
    readonly name: "getQuestionId";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }];
    readonly stateMutability: "view";
}], {
    readonly 1: "0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a";
    readonly 10: "0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00";
    readonly 100: "0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C";
    readonly 8453: "0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD";
    readonly 11155111: "0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA";
}, "getQuestionId", "address" | "abi" | "chainId" | "functionName">;

export { marketViewAbi, marketViewAddress, marketViewConfig, readMarketView, readMarketViewGetMarket, readMarketViewGetMarkets, readMarketViewGetQuestionId, useReadMarketView, useReadMarketViewGetMarket, useReadMarketViewGetMarkets, useReadMarketViewGetQuestionId };
