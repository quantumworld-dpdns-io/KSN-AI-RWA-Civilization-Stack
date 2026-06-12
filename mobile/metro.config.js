const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.watchFolders = [require("path").resolve(__dirname, "..")];

module.exports = config;
