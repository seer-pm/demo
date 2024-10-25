import vikeReact from "vike-react/config";
import type { Config } from "vike/types";
import Head from "../components/Layout/Head";
import Layout from "../components/Layout/Layout";

// Default config (can be overridden by pages)
export default {
  Layout,
  Head,
  extends: vikeReact,
  passToClient: ["dehydratedState"],
  meta: {
    onBeforeRender: {
      env: { server: true, client: true },
    },
  },
} satisfies Config;
