const sharedConfig = require('../../tailwind.config.js');

module.exports = {
  ...sharedConfig,
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    '@mounasabet/ui/**/*.{js,ts,jsx,tsx}',
  ],
};
