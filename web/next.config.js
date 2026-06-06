const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'api.mega-supervision.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `http://localhost:3000/api/v1/:path*`,
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
