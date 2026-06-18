/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ESLint is optional for this project; don't fail the build if it isn't set up.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
