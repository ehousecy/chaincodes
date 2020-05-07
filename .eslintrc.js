module.exports = {
  plugins: ['jest'],
  env: {
    browser: true,
    es6: true,
    node: true,
    'jest/globals': true,
  },
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  // files: ["./src/**", "./src/**"],
  // excludedFiles: "*.test.js",
  rules: {
    indent: ["error", 2],
    quotes: ["error", "single"],
    semi: ["error", "always"]
  }
};
