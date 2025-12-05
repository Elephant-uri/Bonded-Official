const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Configure path alias for @/
config.resolver.alias = {
  ...config.resolver.alias,
  '@': path.resolve(__dirname, './'),
};

module.exports = config;

