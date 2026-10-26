/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@prisma/client', '@googleapis/drive', 'google-auth-library'],
};
export default nextConfig;
