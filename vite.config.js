import { defineConfig } from "vite";

// Relative base so the built asset URLs resolve under the GitHub Pages project
// subpath (https://raemr.github.io/raems-world/) without hardcoding the repo name.
export default defineConfig({
  base: "./",
});
