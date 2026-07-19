/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  // Prisma loads its query-engine binary dynamically at runtime, so Next's file
  // tracer can't see it and Netlify's serverless bundle omits it — causing a
  // runtime "Query engine could not be found" error. Force-include the engine
  // + client so the function bundle contains it.
  outputFileTracingIncludes: {
    "**/*": [
      "./node_modules/.prisma/client/**/*",
      "./node_modules/@prisma/client/**/*",
    ],
  },
};

export default nextConfig;
