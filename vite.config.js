export default {
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        editor: "editor.html",
      },
      external: ['./src/runCodeWithFunctions.js']
    },
  },
};