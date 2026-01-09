import vikeReact from "vike-react/config";
import type { Config } from "vike/types";
import Layout from "../components/Layout/Layout";

// Default config (can be overridden by pages)
export default {
  Layout,
  extends: vikeReact,
  passToClient: ["dehydratedState"],
  title: "Seer | A Next Generation Prediction Marketplace",
  description: "Efficient on-chain prediction markets.",
  image: "https://cdn.kleros.link/ipfs/Qmbxw66xbRG9hLt7jh5hERqULkQmeiEYT3sJx7wriapGwA/seer-twitter-card-v2.jpg",
  bodyAttributes: {
    class: "min-h-screen bg-blend-multiply",
    "data-theme": "light",
  },
  meta: {
    onBeforeRender: {
      env: { server: true, client: true },
    },
  },
  prerender: false,
} satisfies Config;
