/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "lh3.googleusercontent.com",  // Google OAuth avatars
      "avatars.githubusercontent.com" // GitHub OAuth avatars
    ],
  },
};

module.exports = nextConfig;
