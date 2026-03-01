/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'image.pollinations.ai', 'picsum.photos'],
    unoptimized: true,
  },
}

module.exports = nextConfig
