/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.ufs.sh", // allow all subdomains of ufs.sh
      },
      {
        protocol: "https",
        hostname: "utfs.io", // keep utfs.io too
      },
    ],
  },
};

export default nextConfig;
