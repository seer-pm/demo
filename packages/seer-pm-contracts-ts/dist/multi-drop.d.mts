import * as wagmi_codegen from 'wagmi/codegen';

/**
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
declare const governedRecipientAbi: readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_newRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "addRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_user";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "isEligible";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "recipients";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_oldRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "removeRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}];
/**
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
declare const governedRecipientAddress: {
    readonly 100: "0x9E850eB9699AC8417D3401ff1d89115214667b19";
    readonly 11155111: "0xBdF42243D843d34204f50CEC4F4308e432B511F6";
};
/**
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
declare const governedRecipientConfig: {
    readonly address: {
        readonly 100: "0x9E850eB9699AC8417D3401ff1d89115214667b19";
        readonly 11155111: "0xBdF42243D843d34204f50CEC4F4308e432B511F6";
    };
    readonly abi: readonly [{
        readonly type: "constructor";
        readonly inputs: readonly [];
        readonly stateMutability: "nonpayable";
    }, {
        readonly type: "function";
        readonly inputs: readonly [{
            readonly name: "_newRecipients";
            readonly internalType: "address[]";
            readonly type: "address[]";
        }];
        readonly name: "addRecipients";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
    }, {
        readonly type: "function";
        readonly inputs: readonly [{
            readonly name: "_governor";
            readonly internalType: "address";
            readonly type: "address";
        }];
        readonly name: "changeGovernor";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
    }, {
        readonly type: "function";
        readonly inputs: readonly [];
        readonly name: "governor";
        readonly outputs: readonly [{
            readonly name: "";
            readonly internalType: "address";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
    }, {
        readonly type: "function";
        readonly inputs: readonly [{
            readonly name: "_user";
            readonly internalType: "address";
            readonly type: "address";
        }];
        readonly name: "isEligible";
        readonly outputs: readonly [{
            readonly name: "";
            readonly internalType: "bool";
            readonly type: "bool";
        }];
        readonly stateMutability: "view";
    }, {
        readonly type: "function";
        readonly inputs: readonly [{
            readonly name: "";
            readonly internalType: "address";
            readonly type: "address";
        }];
        readonly name: "recipients";
        readonly outputs: readonly [{
            readonly name: "";
            readonly internalType: "bool";
            readonly type: "bool";
        }];
        readonly stateMutability: "view";
    }, {
        readonly type: "function";
        readonly inputs: readonly [{
            readonly name: "_oldRecipients";
            readonly internalType: "address[]";
            readonly type: "address[]";
        }];
        readonly name: "removeRecipients";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
    }];
};
/**
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const multiDropAbi: readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}];
/**
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const multiDropAddress: {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
};
/**
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const multiDropConfig: {
    readonly address: {
        readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
        readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
    };
    readonly abi: readonly [{
        readonly type: "constructor";
        readonly inputs: readonly [{
            readonly name: "_recipient";
            readonly internalType: "contract IRecipient";
            readonly type: "address";
        }];
        readonly stateMutability: "nonpayable";
    }, {
        readonly type: "function";
        readonly inputs: readonly [{
            readonly name: "_tokens";
            readonly internalType: "contract ERC20[]";
            readonly type: "address[]";
        }, {
            readonly name: "_amounts";
            readonly internalType: "uint256[]";
            readonly type: "uint256[]";
        }];
        readonly name: "addTokens";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
    }, {
        readonly type: "function";
        readonly inputs: readonly [];
        readonly name: "allTokens";
        readonly outputs: readonly [{
            readonly name: "";
            readonly internalType: "contract ERC20[]";
            readonly type: "address[]";
        }];
        readonly stateMutability: "view";
    }, {
        readonly type: "function";
        readonly inputs: readonly [{
            readonly name: "";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
        readonly name: "amounts";
        readonly outputs: readonly [{
            readonly name: "";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
    }, {
        readonly type: "function";
        readonly inputs: readonly [{
            readonly name: "_governor";
            readonly internalType: "address";
            readonly type: "address";
        }];
        readonly name: "changeGovernor";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
    }, {
        readonly type: "function";
        readonly inputs: readonly [{
            readonly name: "_recipient";
            readonly internalType: "contract IRecipient";
            readonly type: "address";
        }];
        readonly name: "changeRecipient";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
    }, {
        readonly type: "function";
        readonly inputs: readonly [{
            readonly name: "_i";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "_token";
            readonly internalType: "contract ERC20";
            readonly type: "address";
        }, {
            readonly name: "_amount";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
        readonly name: "changeToken";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
    }, {
        readonly type: "function";
        readonly inputs: readonly [];
        readonly name: "claim";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
    }, {
        readonly type: "function";
        readonly inputs: readonly [{
            readonly name: "";
            readonly internalType: "address";
            readonly type: "address";
        }];
        readonly name: "claimed";
        readonly outputs: readonly [{
            readonly name: "";
            readonly internalType: "bool";
            readonly type: "bool";
        }];
        readonly stateMutability: "view";
    }, {
        readonly type: "function";
        readonly inputs: readonly [];
        readonly name: "governor";
        readonly outputs: readonly [{
            readonly name: "";
            readonly internalType: "address";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
    }, {
        readonly type: "function";
        readonly inputs: readonly [];
        readonly name: "recipient";
        readonly outputs: readonly [{
            readonly name: "";
            readonly internalType: "contract IRecipient";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
    }, {
        readonly type: "function";
        readonly inputs: readonly [{
            readonly name: "";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
        readonly name: "tokens";
        readonly outputs: readonly [{
            readonly name: "";
            readonly internalType: "contract ERC20";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
    }];
};
/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link governedRecipientAbi}__
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
declare const useReadGovernedRecipient: wagmi_codegen.CreateUseReadContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_newRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "addRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_user";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "isEligible";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "recipients";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_oldRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "removeRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}], {
    readonly 100: "0x9E850eB9699AC8417D3401ff1d89115214667b19";
    readonly 11155111: "0xBdF42243D843d34204f50CEC4F4308e432B511F6";
}, undefined, "address" | "abi" | "chainId">;
/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"governor"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
declare const useReadGovernedRecipientGovernor: wagmi_codegen.CreateUseReadContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_newRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "addRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_user";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "isEligible";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "recipients";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_oldRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "removeRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}], {
    readonly 100: "0x9E850eB9699AC8417D3401ff1d89115214667b19";
    readonly 11155111: "0xBdF42243D843d34204f50CEC4F4308e432B511F6";
}, "governor", "address" | "abi" | "chainId" | "functionName">;
/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"isEligible"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
declare const useReadGovernedRecipientIsEligible: wagmi_codegen.CreateUseReadContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_newRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "addRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_user";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "isEligible";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "recipients";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_oldRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "removeRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}], {
    readonly 100: "0x9E850eB9699AC8417D3401ff1d89115214667b19";
    readonly 11155111: "0xBdF42243D843d34204f50CEC4F4308e432B511F6";
}, "isEligible", "address" | "abi" | "chainId" | "functionName">;
/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"recipients"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
declare const useReadGovernedRecipientRecipients: wagmi_codegen.CreateUseReadContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_newRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "addRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_user";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "isEligible";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "recipients";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_oldRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "removeRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}], {
    readonly 100: "0x9E850eB9699AC8417D3401ff1d89115214667b19";
    readonly 11155111: "0xBdF42243D843d34204f50CEC4F4308e432B511F6";
}, "recipients", "address" | "abi" | "chainId" | "functionName">;
/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link governedRecipientAbi}__
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
declare const useWriteGovernedRecipient: wagmi_codegen.CreateUseWriteContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_newRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "addRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_user";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "isEligible";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "recipients";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_oldRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "removeRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}], {
    readonly 100: "0x9E850eB9699AC8417D3401ff1d89115214667b19";
    readonly 11155111: "0xBdF42243D843d34204f50CEC4F4308e432B511F6";
}, undefined>;
/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"addRecipients"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
declare const useWriteGovernedRecipientAddRecipients: wagmi_codegen.CreateUseWriteContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_newRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "addRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_user";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "isEligible";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "recipients";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_oldRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "removeRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}], {
    readonly 100: "0x9E850eB9699AC8417D3401ff1d89115214667b19";
    readonly 11155111: "0xBdF42243D843d34204f50CEC4F4308e432B511F6";
}, "addRecipients">;
/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"changeGovernor"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
declare const useWriteGovernedRecipientChangeGovernor: wagmi_codegen.CreateUseWriteContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_newRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "addRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_user";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "isEligible";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "recipients";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_oldRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "removeRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}], {
    readonly 100: "0x9E850eB9699AC8417D3401ff1d89115214667b19";
    readonly 11155111: "0xBdF42243D843d34204f50CEC4F4308e432B511F6";
}, "changeGovernor">;
/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"removeRecipients"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
declare const useWriteGovernedRecipientRemoveRecipients: wagmi_codegen.CreateUseWriteContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_newRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "addRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_user";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "isEligible";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "recipients";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_oldRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "removeRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}], {
    readonly 100: "0x9E850eB9699AC8417D3401ff1d89115214667b19";
    readonly 11155111: "0xBdF42243D843d34204f50CEC4F4308e432B511F6";
}, "removeRecipients">;
/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link governedRecipientAbi}__
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
declare const useSimulateGovernedRecipient: wagmi_codegen.CreateUseSimulateContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_newRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "addRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_user";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "isEligible";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "recipients";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_oldRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "removeRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}], {
    readonly 100: "0x9E850eB9699AC8417D3401ff1d89115214667b19";
    readonly 11155111: "0xBdF42243D843d34204f50CEC4F4308e432B511F6";
}, undefined>;
/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"addRecipients"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
declare const useSimulateGovernedRecipientAddRecipients: wagmi_codegen.CreateUseSimulateContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_newRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "addRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_user";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "isEligible";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "recipients";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_oldRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "removeRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}], {
    readonly 100: "0x9E850eB9699AC8417D3401ff1d89115214667b19";
    readonly 11155111: "0xBdF42243D843d34204f50CEC4F4308e432B511F6";
}, "addRecipients">;
/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"changeGovernor"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
declare const useSimulateGovernedRecipientChangeGovernor: wagmi_codegen.CreateUseSimulateContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_newRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "addRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_user";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "isEligible";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "recipients";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_oldRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "removeRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}], {
    readonly 100: "0x9E850eB9699AC8417D3401ff1d89115214667b19";
    readonly 11155111: "0xBdF42243D843d34204f50CEC4F4308e432B511F6";
}, "changeGovernor">;
/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"removeRecipients"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
declare const useSimulateGovernedRecipientRemoveRecipients: wagmi_codegen.CreateUseSimulateContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_newRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "addRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_user";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "isEligible";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "recipients";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_oldRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "removeRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}], {
    readonly 100: "0x9E850eB9699AC8417D3401ff1d89115214667b19";
    readonly 11155111: "0xBdF42243D843d34204f50CEC4F4308e432B511F6";
}, "removeRecipients">;
/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link multiDropAbi}__
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const useReadMultiDrop: wagmi_codegen.CreateUseReadContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, undefined, "address" | "abi" | "chainId">;
/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"allTokens"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const useReadMultiDropAllTokens: wagmi_codegen.CreateUseReadContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "allTokens", "address" | "abi" | "chainId" | "functionName">;
/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"amounts"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const useReadMultiDropAmounts: wagmi_codegen.CreateUseReadContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "amounts", "address" | "abi" | "chainId" | "functionName">;
/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"claimed"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const useReadMultiDropClaimed: wagmi_codegen.CreateUseReadContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "claimed", "address" | "abi" | "chainId" | "functionName">;
/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"governor"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const useReadMultiDropGovernor: wagmi_codegen.CreateUseReadContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "governor", "address" | "abi" | "chainId" | "functionName">;
/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"recipient"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const useReadMultiDropRecipient: wagmi_codegen.CreateUseReadContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "recipient", "address" | "abi" | "chainId" | "functionName">;
/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"tokens"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const useReadMultiDropTokens: wagmi_codegen.CreateUseReadContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "tokens", "address" | "abi" | "chainId" | "functionName">;
/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link multiDropAbi}__
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const useWriteMultiDrop: wagmi_codegen.CreateUseWriteContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, undefined>;
/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"addTokens"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const useWriteMultiDropAddTokens: wagmi_codegen.CreateUseWriteContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "addTokens">;
/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"changeGovernor"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const useWriteMultiDropChangeGovernor: wagmi_codegen.CreateUseWriteContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "changeGovernor">;
/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"changeRecipient"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const useWriteMultiDropChangeRecipient: wagmi_codegen.CreateUseWriteContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "changeRecipient">;
/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"changeToken"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const useWriteMultiDropChangeToken: wagmi_codegen.CreateUseWriteContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "changeToken">;
/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"claim"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const useWriteMultiDropClaim: wagmi_codegen.CreateUseWriteContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "claim">;
/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link multiDropAbi}__
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const useSimulateMultiDrop: wagmi_codegen.CreateUseSimulateContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, undefined>;
/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"addTokens"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const useSimulateMultiDropAddTokens: wagmi_codegen.CreateUseSimulateContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "addTokens">;
/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"changeGovernor"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const useSimulateMultiDropChangeGovernor: wagmi_codegen.CreateUseSimulateContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "changeGovernor">;
/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"changeRecipient"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const useSimulateMultiDropChangeRecipient: wagmi_codegen.CreateUseSimulateContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "changeRecipient">;
/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"changeToken"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const useSimulateMultiDropChangeToken: wagmi_codegen.CreateUseSimulateContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "changeToken">;
/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"claim"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const useSimulateMultiDropClaim: wagmi_codegen.CreateUseSimulateContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "claim">;
/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link governedRecipientAbi}__
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
declare const readGovernedRecipient: wagmi_codegen.CreateReadContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_newRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "addRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_user";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "isEligible";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "recipients";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_oldRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "removeRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}], {
    readonly 100: "0x9E850eB9699AC8417D3401ff1d89115214667b19";
    readonly 11155111: "0xBdF42243D843d34204f50CEC4F4308e432B511F6";
}, undefined, "address" | "abi" | "chainId">;
/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"governor"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
declare const readGovernedRecipientGovernor: wagmi_codegen.CreateReadContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_newRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "addRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_user";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "isEligible";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "recipients";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_oldRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "removeRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}], {
    readonly 100: "0x9E850eB9699AC8417D3401ff1d89115214667b19";
    readonly 11155111: "0xBdF42243D843d34204f50CEC4F4308e432B511F6";
}, "governor", "address" | "abi" | "chainId" | "functionName">;
/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"isEligible"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
declare const readGovernedRecipientIsEligible: wagmi_codegen.CreateReadContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_newRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "addRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_user";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "isEligible";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "recipients";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_oldRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "removeRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}], {
    readonly 100: "0x9E850eB9699AC8417D3401ff1d89115214667b19";
    readonly 11155111: "0xBdF42243D843d34204f50CEC4F4308e432B511F6";
}, "isEligible", "address" | "abi" | "chainId" | "functionName">;
/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"recipients"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
declare const readGovernedRecipientRecipients: wagmi_codegen.CreateReadContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_newRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "addRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_user";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "isEligible";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "recipients";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_oldRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "removeRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}], {
    readonly 100: "0x9E850eB9699AC8417D3401ff1d89115214667b19";
    readonly 11155111: "0xBdF42243D843d34204f50CEC4F4308e432B511F6";
}, "recipients", "address" | "abi" | "chainId" | "functionName">;
/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link governedRecipientAbi}__
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
declare const writeGovernedRecipient: wagmi_codegen.CreateWriteContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_newRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "addRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_user";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "isEligible";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "recipients";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_oldRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "removeRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}], {
    readonly 100: "0x9E850eB9699AC8417D3401ff1d89115214667b19";
    readonly 11155111: "0xBdF42243D843d34204f50CEC4F4308e432B511F6";
}, undefined>;
/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"addRecipients"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
declare const writeGovernedRecipientAddRecipients: wagmi_codegen.CreateWriteContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_newRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "addRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_user";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "isEligible";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "recipients";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_oldRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "removeRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}], {
    readonly 100: "0x9E850eB9699AC8417D3401ff1d89115214667b19";
    readonly 11155111: "0xBdF42243D843d34204f50CEC4F4308e432B511F6";
}, "addRecipients">;
/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"changeGovernor"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
declare const writeGovernedRecipientChangeGovernor: wagmi_codegen.CreateWriteContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_newRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "addRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_user";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "isEligible";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "recipients";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_oldRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "removeRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}], {
    readonly 100: "0x9E850eB9699AC8417D3401ff1d89115214667b19";
    readonly 11155111: "0xBdF42243D843d34204f50CEC4F4308e432B511F6";
}, "changeGovernor">;
/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"removeRecipients"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
declare const writeGovernedRecipientRemoveRecipients: wagmi_codegen.CreateWriteContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_newRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "addRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_user";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "isEligible";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "recipients";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_oldRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "removeRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}], {
    readonly 100: "0x9E850eB9699AC8417D3401ff1d89115214667b19";
    readonly 11155111: "0xBdF42243D843d34204f50CEC4F4308e432B511F6";
}, "removeRecipients">;
/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link governedRecipientAbi}__
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
declare const simulateGovernedRecipient: wagmi_codegen.CreateSimulateContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_newRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "addRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_user";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "isEligible";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "recipients";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_oldRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "removeRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}], {
    readonly 100: "0x9E850eB9699AC8417D3401ff1d89115214667b19";
    readonly 11155111: "0xBdF42243D843d34204f50CEC4F4308e432B511F6";
}, undefined>;
/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"addRecipients"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
declare const simulateGovernedRecipientAddRecipients: wagmi_codegen.CreateSimulateContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_newRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "addRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_user";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "isEligible";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "recipients";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_oldRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "removeRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}], {
    readonly 100: "0x9E850eB9699AC8417D3401ff1d89115214667b19";
    readonly 11155111: "0xBdF42243D843d34204f50CEC4F4308e432B511F6";
}, "addRecipients">;
/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"changeGovernor"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
declare const simulateGovernedRecipientChangeGovernor: wagmi_codegen.CreateSimulateContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_newRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "addRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_user";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "isEligible";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "recipients";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_oldRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "removeRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}], {
    readonly 100: "0x9E850eB9699AC8417D3401ff1d89115214667b19";
    readonly 11155111: "0xBdF42243D843d34204f50CEC4F4308e432B511F6";
}, "changeGovernor">;
/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"removeRecipients"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
declare const simulateGovernedRecipientRemoveRecipients: wagmi_codegen.CreateSimulateContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_newRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "addRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_user";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "isEligible";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "recipients";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_oldRecipients";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
    readonly name: "removeRecipients";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}], {
    readonly 100: "0x9E850eB9699AC8417D3401ff1d89115214667b19";
    readonly 11155111: "0xBdF42243D843d34204f50CEC4F4308e432B511F6";
}, "removeRecipients">;
/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link multiDropAbi}__
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const readMultiDrop: wagmi_codegen.CreateReadContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, undefined, "address" | "abi" | "chainId">;
/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"allTokens"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const readMultiDropAllTokens: wagmi_codegen.CreateReadContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "allTokens", "address" | "abi" | "chainId" | "functionName">;
/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"amounts"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const readMultiDropAmounts: wagmi_codegen.CreateReadContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "amounts", "address" | "abi" | "chainId" | "functionName">;
/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"claimed"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const readMultiDropClaimed: wagmi_codegen.CreateReadContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "claimed", "address" | "abi" | "chainId" | "functionName">;
/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"governor"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const readMultiDropGovernor: wagmi_codegen.CreateReadContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "governor", "address" | "abi" | "chainId" | "functionName">;
/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"recipient"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const readMultiDropRecipient: wagmi_codegen.CreateReadContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "recipient", "address" | "abi" | "chainId" | "functionName">;
/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"tokens"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const readMultiDropTokens: wagmi_codegen.CreateReadContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "tokens", "address" | "abi" | "chainId" | "functionName">;
/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link multiDropAbi}__
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const writeMultiDrop: wagmi_codegen.CreateWriteContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, undefined>;
/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"addTokens"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const writeMultiDropAddTokens: wagmi_codegen.CreateWriteContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "addTokens">;
/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"changeGovernor"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const writeMultiDropChangeGovernor: wagmi_codegen.CreateWriteContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "changeGovernor">;
/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"changeRecipient"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const writeMultiDropChangeRecipient: wagmi_codegen.CreateWriteContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "changeRecipient">;
/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"changeToken"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const writeMultiDropChangeToken: wagmi_codegen.CreateWriteContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "changeToken">;
/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"claim"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const writeMultiDropClaim: wagmi_codegen.CreateWriteContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "claim">;
/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link multiDropAbi}__
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const simulateMultiDrop: wagmi_codegen.CreateSimulateContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, undefined>;
/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"addTokens"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const simulateMultiDropAddTokens: wagmi_codegen.CreateSimulateContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "addTokens">;
/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"changeGovernor"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const simulateMultiDropChangeGovernor: wagmi_codegen.CreateSimulateContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "changeGovernor">;
/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"changeRecipient"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const simulateMultiDropChangeRecipient: wagmi_codegen.CreateSimulateContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "changeRecipient">;
/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"changeToken"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const simulateMultiDropChangeToken: wagmi_codegen.CreateSimulateContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "changeToken">;
/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"claim"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
declare const simulateMultiDropClaim: wagmi_codegen.CreateSimulateContractReturnType<readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_tokens";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }, {
        readonly name: "_amounts";
        readonly internalType: "uint256[]";
        readonly type: "uint256[]";
    }];
    readonly name: "addTokens";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "allTokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20[]";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "amounts";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_governor";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "changeGovernor";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_recipient";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly name: "changeRecipient";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_i";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "_token";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "changeToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "claim";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "claimed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "governor";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "recipient";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IRecipient";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "tokens";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract ERC20";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}], {
    readonly 100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5";
    readonly 11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843";
}, "claim">;

export { governedRecipientAbi, governedRecipientAddress, governedRecipientConfig, multiDropAbi, multiDropAddress, multiDropConfig, readGovernedRecipient, readGovernedRecipientGovernor, readGovernedRecipientIsEligible, readGovernedRecipientRecipients, readMultiDrop, readMultiDropAllTokens, readMultiDropAmounts, readMultiDropClaimed, readMultiDropGovernor, readMultiDropRecipient, readMultiDropTokens, simulateGovernedRecipient, simulateGovernedRecipientAddRecipients, simulateGovernedRecipientChangeGovernor, simulateGovernedRecipientRemoveRecipients, simulateMultiDrop, simulateMultiDropAddTokens, simulateMultiDropChangeGovernor, simulateMultiDropChangeRecipient, simulateMultiDropChangeToken, simulateMultiDropClaim, useReadGovernedRecipient, useReadGovernedRecipientGovernor, useReadGovernedRecipientIsEligible, useReadGovernedRecipientRecipients, useReadMultiDrop, useReadMultiDropAllTokens, useReadMultiDropAmounts, useReadMultiDropClaimed, useReadMultiDropGovernor, useReadMultiDropRecipient, useReadMultiDropTokens, useSimulateGovernedRecipient, useSimulateGovernedRecipientAddRecipients, useSimulateGovernedRecipientChangeGovernor, useSimulateGovernedRecipientRemoveRecipients, useSimulateMultiDrop, useSimulateMultiDropAddTokens, useSimulateMultiDropChangeGovernor, useSimulateMultiDropChangeRecipient, useSimulateMultiDropChangeToken, useSimulateMultiDropClaim, useWriteGovernedRecipient, useWriteGovernedRecipientAddRecipients, useWriteGovernedRecipientChangeGovernor, useWriteGovernedRecipientRemoveRecipients, useWriteMultiDrop, useWriteMultiDropAddTokens, useWriteMultiDropChangeGovernor, useWriteMultiDropChangeRecipient, useWriteMultiDropChangeToken, useWriteMultiDropClaim, writeGovernedRecipient, writeGovernedRecipientAddRecipients, writeGovernedRecipientChangeGovernor, writeGovernedRecipientRemoveRecipients, writeMultiDrop, writeMultiDropAddTokens, writeMultiDropChangeGovernor, writeMultiDropChangeRecipient, writeMultiDropChangeToken, writeMultiDropClaim };
