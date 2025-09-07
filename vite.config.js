export default {
  build: {
    minify: "terser",
    terserOptions: {
      compress: true,
      mangle: false,
    },
  },
  rollupOptions: {
    input: {
      main: "index.html",
      editor: "editor.html",
    },
    treeshake: false,
  },
};
