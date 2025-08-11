module.exports = {
  extends: ['next/core-web-vitals'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    // Add any unified platform specific rules here
    'react-hooks/exhaustive-deps': 'warn',
    // Disable some rules for development
    '@next/next/no-html-link-for-pages': 'off',
  },
};