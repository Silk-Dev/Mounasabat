/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ["<rootDir>/pages/api/**/*.test.ts"],
  moduleNameMapper: {
    "packages/events/src": "<rootDir>/../../packages/events/src",
    "@mounasabet/database/src/auth": "<rootDir>/../../@mounasabet/database/src/auth",
  },
};