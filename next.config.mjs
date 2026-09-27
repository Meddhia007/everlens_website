/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['archiver'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/work', destination: '/#work', permanent: false },
      { source: '/packs', destination: '/#packs', permanent: false },
      { source: '/equipment', destination: '/#equipment', permanent: false },
      { source: '/about', destination: '/#about', permanent: false },
      { source: '/contact', destination: '/#contact', permanent: false },
    ];
  },
};

export default nextConfig;
