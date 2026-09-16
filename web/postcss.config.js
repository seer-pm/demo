import { fileURLToPath } from "node:url";

export default {
    plugins: {
      // Tailwind looks for its config in process.cwd(), and `netlify dev` starts the server from the repo root.
      tailwindcss: { config: fileURLToPath(new URL("./tailwind.config.js", import.meta.url)) },
      autoprefixer: {},
    },
  }
