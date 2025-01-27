type EnvKeys =
  | "VITE_OG_IMAGE_URL"
  | "VITE_WEBSITE_URL"
  | "VITE_TX_CONFIRMATIONS"
  | "VITE_QUOTE_REFETCH_INTERVAL"
  | "VITE_ORBIS_CONTEXT"
  | "VITE_WC_PROJECT_ID"
  | "VITE_ADD_HARDHAT_NETWORK";
let SEER_ENV: Partial<Record<EnvKeys, string | undefined>> = {};

if (import.meta.env) {
  SEER_ENV = Object.assign(
    {},
    {
      VITE_OG_IMAGE_URL: import.meta.env.VITE_OG_IMAGE_URL,
      VITE_WEBSITE_URL: import.meta.env.VITE_WEBSITE_URL,
      VITE_TX_CONFIRMATIONS: import.meta.env.VITE_TX_CONFIRMATIONS,
      VITE_QUOTE_REFETCH_INTERVAL: import.meta.env.VITE_QUOTE_REFETCH_INTERVAL,
      VITE_ORBIS_CONTEXT: import.meta.env.VITE_ORBIS_CONTEXT,
      VITE_WC_PROJECT_ID: import.meta.env.VITE_WC_PROJECT_ID,
      VITE_ADD_HARDHAT_NETWORK: import.meta.env.VITE_ADD_HARDHAT_NETWORK,
    },
  );
} else {
  SEER_ENV = Object.assign(
    {},
    {
      VITE_OG_IMAGE_URL: process.env.VITE_OG_IMAGE_URL,
      VITE_WEBSITE_URL: process.env.VITE_WEBSITE_URL,
      VITE_TX_CONFIRMATIONS: process.env.VITE_TX_CONFIRMATIONS,
      VITE_QUOTE_REFETCH_INTERVAL: process.env.VITE_QUOTE_REFETCH_INTERVAL,
      VITE_ORBIS_CONTEXT: process.env.VITE_ORBIS_CONTEXT,
      VITE_WC_PROJECT_ID: process.env.VITE_WC_PROJECT_ID,
      VITE_ADD_HARDHAT_NETWORK: process.env.VITE_ADD_HARDHAT_NETWORK,
    },
  );
}

export default SEER_ENV;
