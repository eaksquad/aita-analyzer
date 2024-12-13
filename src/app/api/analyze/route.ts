import { NextResponse } from 'next/server';
import { checkRateLimit } from './rate-limit';
const Groq = require('groq-sdk');

// Maximum allowed post length (100,000 characters)
const MAX_POST_LENGTH = 100000;

// Function to sanitize input
function sanitizeInput(text: string): string {
  // Remove any potential HTML/script tags
  text = text.replace(/<[^>]*>/g, '');
  // Remove null bytes and other control characters except newlines and tabs
  text = text.replace(/[\x00-\x08\x0B-\x1F\x7F]/g, '');
  return text.trim();
}

// Function to validate request body
function validateRequest(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  if (!body.post || typeof body.post !== 'string') {
    return { valid: false, error: 'Post content is required and must be a string' };
  }

  if (body.post.length > MAX_POST_LENGTH) {
    return { valid: false, error: `Post content must not exceed ${MAX_POST_LENGTH} characters` };
  }

  if (body.post.length < 10) {
    return { valid: false, error: 'Post content is too short' };
  }

  return { valid: true };
}

export async function POST(request: Request) {
  try {
    // Check rate limit
    const rateLimitResult = await checkRateLimit(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Check request size
    const contentLength = parseInt(request.headers.get('content-length') || '0');
    if (contentLength > 1024 * 1024) { // 1MB limit
      return NextResponse.json(
        { error: 'Request too large' },
        { status: 413 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Sanitize input
    const sanitizedPost = sanitizeInput(body.post);
    
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ API key not configured' },
        { status: 500 }
      );
    }

    const groq = new Groq(process.env.GROQ_API_KEY);

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert at analyzing AITA (Am I The Asshole) Reddit posts. When evaluating a post, carefully consider the context, emotions, and actions of all parties involved. Approach the analysis with empathy and objectivity, avoiding personal biases. Assess the situation from multiple perspectives and in light of social and cultural norms. Identify key factors that contribute to whether the poster is being unreasonable or acting like an asshole, and provide a clear, reasoned explanation supported by the details from the post. Format your response using markdown for better readability, using headers, bullet points, and emphasis where appropriate."
        },
        {
          role: "user",
          content: sanitizedPost
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 1,
      stream: false,
      stop: null
    });

    // Validate API response
    if (!chatCompletion?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from GROQ API');
    }

    return NextResponse.json({
      analysis: chatCompletion.choices[0].message.content,
      formatted: true // Indicate that the response may contain markdown formatting
    });
  } catch (error: any) {
    console.error('Error:', error);
    
    // Handle different types of errors
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Authentication failed with the AI service' },
        { status: 401 }
      );
    }

    if (error.status === 429) {
      return NextResponse.json(
        { error: 'AI service rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { 
        error: process.env.NODE_ENV === 'development' 
          ? error?.message || 'Failed to analyze post'
          : 'Failed to analyze post' // Don't expose error details in production
      },
      { status: error?.status || 500 }
    );
  }
}
