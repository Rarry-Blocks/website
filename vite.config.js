import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        credits: resolve(__dirname, "credits.html"),
        editor: resolve(__dirname, "editor.html"),
        login: resolve(__dirname, "login.html"),
        signup: resolve(__dirname, "signup.html"),
        user: resolve(__dirname, "user.html"),
      },
      output: {
        manualChunks: {
          "vendor-pixi": ["pixi.js-legacy"]
        },
      },
      treeshake: true,
    },
  },
  resolve: {
    alias: {
      "blockly/python": resolve(__dirname, "stub.js"),
      "blockly/php": resolve(__dirname, "stub.js"),
      "blockly/lua": resolve(__dirname, "stub.js"),
      "blockly/dart": resolve(__dirname, "stub.js"),
      "@pixi/accessibility": resolve(__dirname, "stub.js"),
      "@pixi/filter-noise": resolve(__dirname, "stub.js"),
      "@pixi/filter-blur": resolve(__dirname, "stub.js"),
      "@pixi/filter-color-matrix": resolve(__dirname, "stub.js"),
      "@pixi/filter-displacement": resolve(__dirname, "stub.js"),
      "@pixi/text-bitmap": resolve(__dirname, "stub.js"), 
      "@pixi/mesh-extras": resolve(__dirname, "stub.js"), 
      "@pixi/particle-container": resolve(__dirname, "stub.js"), 
    },
  },
});
