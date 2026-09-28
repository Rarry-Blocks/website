const keywords = new Set([
  "break", "case", "catch", "class", "const", "continue", "debugger",
  "default", "delete", "do", "else", "export", "extends", "finally",
  "for", "function", "if", "import", "in", "instanceof", "let", "new",
  "return", "super", "switch", "this", "throw", "try", "typeof", "var",
  "void", "while", "with", "yield", "await"
]);
const globals = new Set(Object.getOwnPropertyNames(globalThis));
const engine = new Set([
  "runtime",
  "arguments", "eval",
  "implements", "interface", "package", "private", "protected", "public",
  "static",
]);

const localhost = window.location.hostname === "localhost";

export default {
  apiUrl: localhost ? "http://localhost:3000" : "https://rarry-api-production.up.railway.app",
  reservedWords: { all: [...new Set([...keywords, ...globals, ...engine])], keywords, globals, engine }
};
