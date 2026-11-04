/** @type {import('next').NextConfig} */
const nextConfig = {
  // create-next-app-ийн анхдагч тохиргоо
  cacheComponents: true,
  partialPrefetching: true,

  // /api/... хүсэлтийг Express (:3000) руу дамжуулна — frontend/vite.config.js-ийн proxy-той ижил.
  // Browser-т бүх зүйл ижил origin (:3001) тул CORS хэрэггүй
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL ?? 'http://localhost:3000'}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
