# AITA Analyzer

A modern web application that analyzes Reddit "Am I The Asshole" (AITA) posts using AI to determine if the poster is indeed the asshole or not.

## Features

- Modern, responsive UI built with Next.js and Tailwind CSS
- AI-powered analysis using the GROQ API and Llama 2 model
- Simple copy-paste interface for Reddit posts
- Instant analysis with detailed explanation
- Rate limiting and security features
- Markdown formatting support

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root directory with the following variables:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment on Vercel

1. Fork or push this repository to GitHub
2. Create a new project on Vercel
3. Connect your GitHub repository
4. Add the following environment variable in Vercel's project settings:
   - Name: `GROQ_API_KEY`
   - Value: Your GROQ API key
5. Deploy!

## Environment Variables

- `GROQ_API_KEY`: Your GROQ API key for accessing the Llama 2 model (Required)

## Security Features

- Input validation and sanitization
- Rate limiting (5 requests per minute per IP)
- Request size limiting (1MB max)
- XSS protection
- API abuse prevention
- Error handling with production/development modes

## Technologies Used

- Next.js 13+
- TypeScript
- Tailwind CSS
- GROQ API with Llama 2 model
- React Markdown for formatting

## Development

The project uses Next.js 13+ with the App Router and TypeScript. The UI is built using Tailwind CSS for styling.
