/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  transpilePackages: ['@aksicendekia/ui', '@aksicendekia/design-tokens'],
  reactStrictMode: true,
};

export default nextConfig;
