/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@prisma/client', '@googleapis/drive', 'google-auth-library'],
  experimental: { serverActions: { bodySizeLimit: '12mb' } },
};
export default nextConfig;
