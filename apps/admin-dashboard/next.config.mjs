/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @khade/shared is consumed as TypeScript source, so let Next transpile it.
  transpilePackages: ['@khade/shared'],
};

export default nextConfig;
