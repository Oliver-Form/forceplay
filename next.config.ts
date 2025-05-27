import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  webpack(config) {
    if (!config.resolve) config.resolve = {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "react-native-fs": false,
      "node-vibrant": "node-vibrant/browser",
      "jsmediatags/build2/ReactNativeFileReader": false,
      "jsmediatags/build2/ReactNativeFileReader.js": false,
    };
    // prevent module resolution for react-native-fs and disable fs polyfill
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      "react-native-fs": false,
      fs: false,
    };
    return config;
  },
};

export default nextConfig;

// 