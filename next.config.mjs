/** @type {import('next').NextConfig} */
const nextConfig = {
  // The blank AcroForm template is read from disk by the API route, so it has
  // to be traced into the serverless bundle (Vercel) explicitly.
  outputFileTracingIncludes: {
    "/api/submit-intake": ["./templates/**"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
