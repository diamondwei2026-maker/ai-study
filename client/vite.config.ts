import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import Components from "@uni-helper/vite-plugin-uni-components";
import { WotResolver } from "@uni-helper/vite-plugin-uni-components/resolvers";
import Uni from "@uni-helper/plugin-uni";
import Unocss from "unocss/vite";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude:
      process.env.UNI_PLATFORM === "h5" &&
      process.env.NODE_ENV === "development"
        ? ["wot-design-uni"]
        : [],
  },
  plugins: [
    Unocss(),
    Components({
      resolvers: [WotResolver()],
    }),
    Uni(),
  ],
});
