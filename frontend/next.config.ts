/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! DO NOT use this in production forever — fix types later !!
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;