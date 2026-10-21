export const ORDER_OPTIONS = [
  {
    value: "default",
    text: "Active & verified",
    tooltip: "Active markets first, then verification status, liquidity and resolution date.",
  },
  { value: "liquidityUSD", text: "Liquidity" },
  { value: "volumeUSD", text: "Volume" },
  { value: "outcomesSupply", text: "Open Interest" },
  { value: "openingTs", text: "Opening Date" },
  { value: "creationDate", text: "Creation Date" },
];
