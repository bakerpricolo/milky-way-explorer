/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow cross-origin requests to astronomical data APIs
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, DELETE, OPTIONS" },
        ],
      },
    ];
  },
};

export default nextConfig;
