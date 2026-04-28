/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['vkbidbwafrrlspjibyus.supabase.co']
  }
}
module.exports = nextConfig
