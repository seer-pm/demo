/** Frozen, rounded rows observed on app.seer.pm on 2026-10-04. Never use for trade quotes. */
export const BRAZIL_PREVIEW_MARKET = "0x95149fcc1eb9ec665a5984c33927b991dd66a355";
export const brazilOrderBookPreview = {
  outcome: "Flávio Bolsonaro",
  collateral: "sDAI",
  last: 0.5569,
  source: "https://app.seer.pm/markets/100/who-will-win-brazilian-presidential-election-in-2026/",
  asks: [
    [0.5569, 11.69],
    [0.5793, 15.65],
    [0.6114, 15.23],
    [0.6453, 14.83],
    [0.6811, 14.43],
    [0.7189, 10.96],
    [0.7498, 13.66],
    [0.7914, 13.3],
    [0.8353, 12.94],
    [0.8816, 12.6],
  ].map(([price, shares]) => ({ price, shares })),
  bids: [
    [0.5488, 4.39],
    [0.5263, 12.87],
    [0.4986, 16.95],
    [0.4839, 9.47],
    [0.4584, 17.41],
    // biome-ignore lint/suspicious/noApproximativeNumericConstant: Observed market price, not a mathematical constant.
    [0.4343, 17.89],
    [0.4115, 18.37],
    [0.3899, 18.88],
    [0.3694, 19.39],
    [0.35, 19.92],
  ].map(([price, shares]) => ({ price, shares })),
};
