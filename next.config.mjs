/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    rules: {
      // Lets Turbopack (Next.js's bundler) process Tailwind CSS in our .css files.
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
