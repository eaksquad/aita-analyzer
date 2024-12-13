/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    GROQ_API_KEY: process.env.GROQ_API_KEY || process.env.groq_api_key,
  },
}

module.exports = nextConfig
