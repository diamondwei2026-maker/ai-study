import { defineConfig } from "@uni-helper/unh";

export default defineConfig({
  platform: {
    default: "h5",
    alias: {
      h5: ["w", "h"],
      "mp-weixin": "wx",
    },
  },
});
