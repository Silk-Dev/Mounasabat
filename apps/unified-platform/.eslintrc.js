module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Add any unified platform specific rules here
    'react-hooks/exhaustive-deps': 'warn',
    // Disable some rules for development
    '@next/next/no-html-link-for-pages': 'off',
    // Fix common issues
    'react/no-unescaped-entities': 'off',
    '@next/next/no-img-element': 'warn',
    'react/display-name': 'off',
    'import/no-anonymous-default-export': 'warn',
  },
};