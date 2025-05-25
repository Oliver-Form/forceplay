import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  devIndicators: false,
  webpack(config) {
    if (!config.resolve) config.resolve = {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Stub out react-native-fs by pointing it to our empty module
      "react-native-fs": path.resolve(__dirname, "empty-module.js"),
    };
    // Stub out react-native-fs in fallback
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      "react-native-fs": false,
    };
    return config;
  },
};

export default nextConfig;

