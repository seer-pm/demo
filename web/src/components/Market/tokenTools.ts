export type TokenTool = "mint" | "merge" | "redeem";

/** One plain-language line per token tool, shown above its form on desktop and in the mobile drawer. */
export function tokenToolDescription(tool: TokenTool, collateralSymbol: string): string {
  switch (tool) {
    case "mint":
      return `Turn ${collateralSymbol} into one of every outcome token. You can sell the ones you don't want.`;
    case "merge":
      return `Turn one of every outcome token back into ${collateralSymbol}.`;
    case "redeem":
      return `After resolution, exchange winning tokens for ${collateralSymbol}.`;
  }
}
