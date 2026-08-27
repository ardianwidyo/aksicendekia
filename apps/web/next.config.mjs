/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@aksicendekia/ui', '@aksicendekia/design-tokens'],
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:3001/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
