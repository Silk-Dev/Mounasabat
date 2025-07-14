const sharedConfig = require('../../tailwind.config.js');

module.exports = {
  ...sharedConfig,
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    '@weddni/ui/**/*.{js,ts,jsx,tsx}',
  ],
};
