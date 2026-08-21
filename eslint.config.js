// https://docs.expo.dev/guides/using-eslint/
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  globalIgnores(["dist/**", "src/native/**", "src/store/**", "src/global/**", "src/lib/firebase.js"]),
  expoConfig,
  {
    rules: {
      // These advisory rules currently flag supported React Native animation refs
      // and async loading effects. TypeScript and Expo builds remain release gates.
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  }
]);
