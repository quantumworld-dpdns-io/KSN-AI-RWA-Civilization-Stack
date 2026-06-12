const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Metro only needs the core package source tree that the mobile app imports
// directly. Watching the whole repository root makes Expo boot much noisier and
// slower in this monorepo.
config.watchFolders = [path.resolve(__dirname, "../packages/core/src")];

module.exports = config;
