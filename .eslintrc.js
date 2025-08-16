module.exports = {
  root: true,
  extends: ["@mounasabet/eslint-config"],
  settings: {
    next: {
      rootDir: ["apps/*/", "packages/*/"],
    },
  },
};
