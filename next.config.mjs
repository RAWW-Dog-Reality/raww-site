/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'xn--bp8hf7f.ws' }],
        destination: 'https://raww.dog/:path*',
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xn--bp8hf7f.ws',
      },
    ],
  },
};

export default nextConfig;
