/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  transpilePackages: ['@aksicendekia/ui', '@aksicendekia/design-tokens', '@aksicendekia/content-kit'],
  reactStrictMode: true,
  webpack: (config) => {
    // @aksicendekia/content-kit is consumed straight from TS source (no build step) and
    // uses NodeNext-style `.js`-suffixed relative imports pointing at `.ts` siblings.
    // Webpack's default resolver doesn't know that convention — teach it the alias.
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js'],
    };
    return config;
  },
};

export default nextConfig;
