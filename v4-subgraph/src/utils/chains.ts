import { Address, BigDecimal, BigInt, dataSource } from '@graphprotocol/graph-ts'

import { NativeTokenDetails } from './nativeTokenDetails'
import { StaticTokenDefinition } from './staticTokenDefinition'

// assemblyscript does not support string enums, hence these constants
const BASE_NETWORK_NAME = 'base'
const OPTIMISM_NETWORK_NAME = 'optimism'
const MAINNET_NETWORK_NAME = 'mainnet'

// Note: All token and pool addresses should be lowercased!
export class SubgraphConfig {
  // deployment address
  poolManagerAddress: string

  // the address of a pool where one token is a stablecoin and the other is a
  // token that tracks the price of the native token use this to calculate the
  // price of the native token, so prefer a pool with highest liquidity
  stablecoinWrappedNativePoolId: string

  // true is stablecoin is token0, false if stablecoin is token1
  stablecoinIsToken0: boolean

  // the address of a token that tracks the price of the native token, most of
  // the time, this is a wrapped asset but could also be the native token itself
  // for some chains
  wrappedNativeAddress: string

  // the mimimum liquidity in a pool needed for it to be used to help calculate
  // token prices. for new chains, this should be initialized to ~4000 USD
  minimumNativeLocked: BigDecimal

  // list of stablecoin addresses
  stablecoinAddresses: string[]

  // a token must be in a pool with one of these tokens in order to derive a
  // price (in addition to passing the minimumEthLocked check). This is also
  // used to determine whether volume is tracked or not.
  whitelistTokens: string[]

  // token overrides are used to override RPC calls for the symbol, name, and
  // decimals for tokens. for new chains this is typically empty.
  tokenOverrides: StaticTokenDefinition[]

  // skip the creation of these pools in handlePoolCreated. for new chains this is typically empty.
  poolsToSkip: string[]

  // if non-empty, only create pools whose hooks address is in this list (lowercased).
  // Seer deployments list the chain's LimitOrderHook: every pool attached to it is indexed,
  // whatever its fee or tick spacing. Empty means index all pools (default Uniswap behavior).
  allowedHooks: string[]

  // Uniswap V4 PositionManager (lowercased). ModifyLiquidity events sent by it are
  // tracked as Position entities keyed by the salt (= NFT tokenId). Empty disables tracking.
  positionManagerAddress: string

  // initialize this list of pools and token addresses on factory creation. for new chains this is typically empty.
  poolMappings: Array<Address[]>

  // native token details for the chain.
  nativeTokenDetails: NativeTokenDetails
}

export function getSubgraphConfig(): SubgraphConfig {
  // Update this value to the corresponding chain you want to deploy
  const selectedNetwork = dataSource.network()

  if (selectedNetwork == MAINNET_NETWORK_NAME) {
    return {
      poolManagerAddress: '0x000000000004444c5dc75cb358380d2e3de08a90',
      stablecoinWrappedNativePoolId: '0x4f88f7c99022eace4740c6898f59ce6a2e798a1e64ce54589720b7153eb224a7', // https://etherscan.io/tx/0x4e63fcc0dd42a2b317e77d17e236cadf77464a08ccece33a354bd8648b5f7419#eventlog
      stablecoinIsToken0: true,
      wrappedNativeAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
      minimumNativeLocked: BigDecimal.fromString('1'),
      stablecoinAddresses: [
        '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
        '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
        '0x0000000000085d4780b73119b644ae5ecd22b376', // TUSD
        '0x956f47f50a910163d8bf957cf5846d573e7f87ca', // FEI
      ],
      whitelistTokens: [
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
        '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
        '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
        '0x0000000000085d4780b73119b644ae5ecd22b376', // TUSD
        '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
        '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643', // cDAI
        '0x39aa39c021dfbae8fac545936693ac917d5e7563', // cUSDC
        '0x86fadb80d8d2cff3c3680819e4da99c10232ba0f', // EBASE
        '0x57ab1ec28d129707052df4df418d58a2d46d5f51', // sUSD
        '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', // MKR
        '0xc00e94cb662c3520282e6f5717214004a7f26888', // COMP
        '0x514910771af9ca656af840dff83e8264ecf986ca', // LINK
        '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f', // SNX
        '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e', // YFI
        '0x111111111117dc0aa78b770fa6a738034120c302', // 1INCH
        '0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8', // yCurv
        '0x956f47f50a910163d8bf957cf5846d573e7f87ca', // FEI
        '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0', // MATIC
        '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', // AAVE
        '0xfe2e637202056d30016725477c5da089ab0a043a', // sETH2
        '0x0000000000000000000000000000000000000000', // Native ETH
      ],
      tokenOverrides: [
        {
          address: Address.fromString('0xe0b7927c4af23765cb51314a0e0521a9645f0e2a'),
          symbol: 'DGD',
          name: 'DGD',
          decimals: BigInt.fromI32(9),
        },
        {
          address: Address.fromString('0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9'),
          symbol: 'AAVE',
          name: 'Aave Token',
          decimals: BigInt.fromI32(18),
        },
        {
          address: Address.fromString('0xeb9951021698b42e4399f9cbb6267aa35f82d59d'),
          symbol: 'LIF',
          name: 'Lif',
          decimals: BigInt.fromI32(18),
        },
        {
          address: Address.fromString('0xbdeb4b83251fb146687fa19d1c660f99411eefe3'),
          symbol: 'SVD',
          name: 'savedroid',
          decimals: BigInt.fromI32(18),
        },
        {
          address: Address.fromString('0xbb9bc244d798123fde783fcc1c72d3bb8c189413'),
          symbol: 'TheDAO',
          name: 'TheDAO',
          decimals: BigInt.fromI32(16),
        },
        {
          address: Address.fromString('0x38c6a68304cdefb9bec48bbfaaba5c5b47818bb2'),
          symbol: 'HPB',
          name: 'HPBCoin',
          decimals: BigInt.fromI32(18),
        },
      ],
      poolMappings: [],
      poolsToSkip: [],
      allowedHooks: ['0xe10a429d18e90fbd44be3678d2ae1ef3c1691040'], // LimitOrderHook
      positionManagerAddress: '0xbd216513d74c8cf14cf4747e6aaa6420ff64ee9e',
      nativeTokenDetails: {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: BigInt.fromI32(18),
      },
    }
  } else if (selectedNetwork == OPTIMISM_NETWORK_NAME) {
    return {
      poolManagerAddress: '0x9a13f98cb987694c9f086b1f5eb990eea8264ec3',
      stablecoinWrappedNativePoolId: '0xedba0a2a9dc73acf4b130e07605cb4c212bbd98a31c9cd442cfb8cf5b4e093e7', // https://optimistic.etherscan.io/tx/0x5a7ce7eaa8a1ae27a84846b0152d2910ec8db0c4d62b0968e0a49830d882ad28
      stablecoinIsToken0: true,
      wrappedNativeAddress: '0x4200000000000000000000000000000000000006', // WETH
      minimumNativeLocked: BigDecimal.fromString('1'),
      stablecoinAddresses: [
        '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1', // DAI
        '0x7f5c764cbc14f9669b88837ca1490cca17c31607', // USDC.e
        '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58', // USDT
        '0x0b2c639c533813f4aa9d7837caf62653d097ff85', // USDC
      ],
      whitelistTokens: [
        '0x4200000000000000000000000000000000000006', // WETH
        '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1', // DAI
        '0x7f5c764cbc14f9669b88837ca1490cca17c31607', // USDC.e
        '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58', // USDT
        '0x4200000000000000000000000000000000000042', // OP
        '0x9e1028f5f1d5ede59748ffcee5532509976840e0', // PERP
        '0x50c5725949a6f0c72e6c4a641f24049a917db0cb', // LYRA
        '0x68f180fcce6836688e9084f035309e29bf0a2095', // WBTC
        '0x0b2c639c533813f4aa9d7837caf62653d097ff85', // USDC
        '0x0000000000000000000000000000000000000000', // Native ETH
      ],
      tokenOverrides: [
        {
          address: Address.fromString('0x82af49447d8a07e3bd95bd0d56f35241523fbab1'),
          symbol: 'WETH',
          name: 'Wrapped Ethereum',
          decimals: BigInt.fromI32(18),
        },
      ],
      poolMappings: [],
      poolsToSkip: [],
      allowedHooks: ['0x1f78e79c20d1e77526ac21e3651fabfc22035040'], // LimitOrderHook
      positionManagerAddress: '0x3c3ea4b57a46241e54610e5f022e5c45859a1017',
      nativeTokenDetails: {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: BigInt.fromI32(18),
      },
    }
  } else if (selectedNetwork == BASE_NETWORK_NAME) {
    return {
      poolManagerAddress: '0x498581ff718922c3f8e6a244956af099b2652b2b',
      stablecoinWrappedNativePoolId: '0x90333bb05c258fe0dddb2840ef66f1a05165aa7dac6815d24e807cc6ebd943a0', // https://basescan.org/tx/0xf7f4eb1aef74a635a1bf42d598049afbed8ec9e303be81bf168b94a71045decb#eventlog
      stablecoinIsToken0: false,
      wrappedNativeAddress: '0x4200000000000000000000000000000000000006', // WETH
      minimumNativeLocked: BigDecimal.fromString('1'),
      stablecoinAddresses: [
        '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC
      ],
      whitelistTokens: [
        '0x4200000000000000000000000000000000000006', // WETH
        '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC
        '0x0000000000000000000000000000000000000000', // Native ETH
        '0x1111111111166b7fe7bd91427724b487980afc69', // ZORA
      ],
      tokenOverrides: [],
      poolsToSkip: [],
      allowedHooks: ['0x19e8b37e9f4d69927da1e13e989a2f955ee39040'], // LimitOrderHook
      positionManagerAddress: '0x7c5f5a4bbd8fd63184577525326123b519429bdc',
      poolMappings: [],
      nativeTokenDetails: {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: BigInt.fromI32(18),
      },
    }
  } else {
    throw new Error('Unsupported Network')
  }
}
