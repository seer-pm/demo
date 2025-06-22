import { CategoricalIcon, MultiCategoricalIcon, MultiScalarIcon, ScalarIcon } from "@/lib/icons";
import { MarketTypes } from "@/lib/market";

export const MARKET_TYPES_ICONS: Record<MarketTypes, React.ReactNode> = {
  [MarketTypes.CATEGORICAL]: <CategoricalIcon />,
  [MarketTypes.SCALAR]: <ScalarIcon />,
  [MarketTypes.MULTI_CATEGORICAL]: <MultiCategoricalIcon />,
  [MarketTypes.MULTI_SCALAR]: <MultiScalarIcon />,
};

export const MARKET_TYPES_ICONS_LG: Record<MarketTypes, React.ReactNode> = {
  [MarketTypes.CATEGORICAL]: <CategoricalIcon width={"100%"} />,
  [MarketTypes.SCALAR]: <ScalarIcon width={"100%"} />,
  [MarketTypes.MULTI_CATEGORICAL]: <MultiCategoricalIcon width={"100%"} />,
  [MarketTypes.MULTI_SCALAR]: <MultiScalarIcon width={"100%"} />,
};
