import { JSBI } from "@swapr/sdk";
import { Price, Token } from "@uniswap/sdk-core";

export interface GraphQueriedTick {
  liquidityNet: string;
  tickIdx: string;
}

// Tick with fields parsed to JSBIs, and active liquidity computed.
export interface TickProcessed {
  tick: number;
  liquidityActive: JSBI;
  liquidityNet: JSBI;
  price0: string;
  sdkPrice: Price<Token, Token>;
}

export interface LiquidityBarData {
  time: number;
  tick: number;
  price0: string;
  price1: string;
  liquidity: number;
  amount0Locked: number;
  amount1Locked: number;
}
