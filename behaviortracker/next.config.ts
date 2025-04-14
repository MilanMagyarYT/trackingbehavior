import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable static HTML export
  output: 'export',

  // (Optional) If your assets should have a relative path,
  // add assetPrefix or basePath as needed.
  // For example, if your site is not at the root ("/"), you could configure basePath.

  // Other config options can go here.
};

export default nextConfig;
