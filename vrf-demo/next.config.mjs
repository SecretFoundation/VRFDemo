/** @type {import('next').NextConfig} */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const withSvgr = require('@svgr/webpack');

const nextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/, // Apply the rule to .svg files
      issuer: /\.[jt]sx?$/, // Only process SVGs used in .js/.jsx/.ts/.tsx files
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

export default nextConfig;


