/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/JimmyBautista_Resume.pdf",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=10800, s-maxage=10800, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig
