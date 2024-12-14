import { NextResponse } from 'next/server';
import { checkRateLimit } from './rate-limit';
import Groq from 'groq-sdk';
import type { Judgment, AIPromptOptions } from '@/types';

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

// Function to calculate confidence score based on AI response
function calculateConfidenceScore(response: string): number {
  const indicators = {
    clear_judgment: /^(YTA|NTA|ESH)\s/i.test(response),
    structured_analysis: /Context|Summary|Analysis|Assessment|Reasoning/i.test(response),
    specific_examples: response.split('\n').length > 5,
    detailed_explanation: response.length > 500,
    balanced_view: /on.*one.*hand.*other.*hand|however|although|despite/i.test(response),
  };

  const weights = {
    clear_judgment: 0.3,
    structured_analysis: 0.2,
    specific_examples: 0.2,
    detailed_explanation: 0.15,
    balanced_view: 0.15,
  };

  let score = 0;
  for (const [key, present] of Object.entries(indicators)) {
    if (present) {
      score += weights[key as keyof typeof weights] * 100;
    }
  }

  return Math.round(Math.min(100, Math.max(0, score)));
}

// Function to get AI prompt based on options
function getAIPrompt(options?: AIPromptOptions): string {
  const basePrompt = `You are an expert at analyzing AITA (Am I The Asshole) Reddit posts with a strong focus on ethical reasoning and proportionality. Your analysis must follow these strict guidelines:

1. SEVERITY ASSESSMENT:
- Always weigh the severity of actions on both sides
- Consider if any actions are criminal or abusive
- Evaluate if responses are proportional to the initial issue

2. JUDGMENT CRITERIA:
- YTA (You're The Asshole): The poster's actions are clearly wrong AND proportional to any negative response
- NTA (Not The Asshole): The poster's actions are either justified OR they received a disproportionate response
- ESH (Everyone Sucks Here): Both parties acted poorly with similar levels of severity

3. CRITICAL FACTORS:
- Criminal actions automatically make that party the primary asshole
- Violence or abuse is never justified by minor infractions
- Mental health issues should be identified as requiring professional help
- Threats to safety take precedence over minor disputes

Your response MUST start with one of these judgments (YTA/NTA/ESH) on its own line, followed by a structured analysis including:
- Context summary
- Severity assessment
- Proportionality analysis
- Safety concerns (if any)
- Final reasoning and recommendations

Use markdown formatting for clarity. Focus on ethical reasoning and always consider the real-world implications of actions.`;

  const humanizedAddition = `

Rewrite this text so it sounds more natural and like it’s coming directly from me. Use an empathetic, conversational tone that balances professionalism with relatability. Simplify the language to make it more accessible and easy to follow, and provide clear, structured reasoning for my points. Acknowledge emotional context and add relatable examples or phrases to make it feel more human and engaging. Ensure the sections flow like a natural thought process, and use inclusive language to draw the reader in while maintaining clarity and fairness.

Keep the tone supportive and constructive, avoiding overly formal or detached phrasing, and focus on making the response feel personal, thoughtful, and approachable.`;

  return options?.isHumanized ? basePrompt + humanizedAddition : basePrompt;
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
    const options: AIPromptOptions = {
      isHumanized: body.isHumanized as boolean ?? false,
    };
    
    // Check for API key
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
          content: getAIPrompt(options)
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
    console.log('API Response:', {
      timestamp: new Date().toISOString(),
      content: response,
      choices: chatCompletion.choices
    });
    const firstLine = response.split('\n')[0].trim().toUpperCase();
    let judgment: Judgment;
    if (firstLine.includes('YTA')) {
      judgment = 'YTA';
    } else if (firstLine.includes('NTA')) {
      judgment = 'NTA';
    } else if (firstLine.includes('ESH')) {
      judgment = 'ESH';
    } else {
      judgment = 'INCONCLUSIVE';
    }
    const analysis = response.substring(firstLine.length).trim();
    const confidenceScore = calculateConfidenceScore(response);

    return NextResponse.json({
      judgment,
      analysis,
      confidenceScore,
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
          : 'Failed to analyze post. Please try again later.'
      },
      { status: 500 }
    );
  }
}
