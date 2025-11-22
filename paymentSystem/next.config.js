/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Suppress warnings for optional dependencies
    config.ignoreWarnings = [
      { module: /@react-native-async-storage/ },
    ];
    return config;
  },
}

module.exports = nextConfig

