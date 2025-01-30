import { CategoricalIcon, MultiCategoricalIcon, MultiScalarIcon, ScalarIcon } from "@/lib/icons";
import { MarketTypes } from "@/lib/market";

export const MARKET_TYPES_ICONS: Record<MarketTypes, React.ReactNode> = {
  [MarketTypes.CATEGORICAL]: <CategoricalIcon />,
  [MarketTypes.SCALAR]: <ScalarIcon />,
  [MarketTypes.MULTI_CATEGORICAL]: <MultiCategoricalIcon />,
  [MarketTypes.MULTI_SCALAR]: <MultiScalarIcon />,
};
