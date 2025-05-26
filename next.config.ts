import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  webpack(config) {
    if (!config.resolve) config.resolve = {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "react-native-fs": false,
    };
    return config;
  },
};

export default nextConfig;
