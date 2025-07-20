module.exports = {
  root: true,
  // This tells ESLint to load the config from the package `eslint-config-next-turbo`
  extends: ["@mounasabet/eslint-config"],
  settings: {
    next: {
      rootDir: ["apps/*/", "packages/*/"],
    },
  },
};
