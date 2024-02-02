import { Address } from "viem";

export const paths = {
  market: (id: Address | string) => `/markets/${id.toString()}/`,
};
