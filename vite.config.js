export default {
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        editor: "editor.html",
      },
      treeshake: false,
    },
    minify: "terser",
    terserOptions: {
      mangle: false, 
      compress: {
        drop_console: true, 
        drop_debugger: true,
      },
      format: {
        comments: false, 
      },
    },
  },
};
