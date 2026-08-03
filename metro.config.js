const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Bundle the compiled reference database (assets/data/dnd5e.db) as an asset
// so it can be loaded via expo-sqlite's SQLiteProvider assetSource.
config.resolver.assetExts.push('db');

// expo-sqlite's web build loads its wa-sqlite engine as a .wasm asset.
config.resolver.assetExts.push('wasm');

module.exports = config;
