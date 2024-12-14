import { NextResponse } from 'next/server';
import { checkRateLimit } from './rate-limit';
import Groq from 'groq-sdk';

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
function validateRequest(body: Record<string, unknown>): { valid: boolean; error?: string } {
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
    const rateLimitResult = await checkRateLimit();
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
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
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
    const sanitizedPost = sanitizeInput(body.post as string);
    
    // Check for API key in both cases
    const apiKey = process.env.GROQ_API_KEY || process.env.groq_api_key;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ API key not configured' },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey });

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert at analyzing AITA (Am I The Asshole) Reddit posts. Your response should start with a clear judgment: either 'YTA' (You're The Asshole), 'NTA' (Not The Asshole), or 'ESH' (Everyone Sucks Here) on its own line, followed by your detailed analysis. When evaluating, consider the context, emotions, and actions of all parties involved, approaching your analysis with empathy and objectivity while avoiding personal biases. Carefully assess the situation from multiple perspectives, taking into account social and cultural norms, proportionality of reactions, personal accountability, and potential underlying issues. Provide a clear and reasoned explanation for your judgment, acknowledging minor faults while focusing on the primary responsibility in the conflict. Structure your response by briefly summarizing the context of the situation, breaking down key factors such as proportionality, accountability, and any underlying concerns, and concluding with a final assessment and any recommendations for addressing the situation. Use markdown formatting for readability, incorporating headers, bullet points, and emphasis where appropriate to clearly communicate your analysis."
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

    // Extract judgment from the response
    const response = chatCompletion.choices[0].message.content;
    const firstLine = response.split('\n')[0].trim();
    const judgment = firstLine === 'YTA' || firstLine === 'NTA' ? firstLine : 'NTA';
    const analysis = firstLine === 'YTA' || firstLine === 'NTA' 
      ? response.substring(firstLine.length).trim()
      : response;

    return NextResponse.json({
      judgment,
      analysis,
      formatted: true
    });
  } catch (error: unknown) {
    console.error('Error:', error);
    
    // Handle different types of errors
    if (error && typeof error === 'object' && 'status' in error) {
      const statusError = error as { status: number };
      if (statusError.status === 401) {
        return NextResponse.json(
          { error: 'Authentication failed with the AI service' },
          { status: 401 }
        );
      }

      if (statusError.status === 429) {
        return NextResponse.json(
          { error: 'AI service rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: process.env.NODE_ENV === 'development' 
          ? error instanceof Error ? error.message : 'Failed to analyze post'
          : 'Failed to analyze post' // Don't expose error details in production
      },
      { status: 500 }
    );
  }
}
