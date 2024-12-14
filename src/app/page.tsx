'use client';

import { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import type { Theme, Judgment } from '@/types';
import SettingsPanel from '@/components/SettingsPanel';
import ConfidenceScore from '@/components/ConfidenceScore';
import RedditButton from '@/components/RedditButton';

export default function Home() {
  // Existing states
  const [post, setPost] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [judgment, setJudgment] = useState<Judgment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // New states
  const [theme, setTheme] = useState<Theme>('dark');
  const [isHumanized, setIsHumanized] = useState(false);
  const [isRedditStyle, setIsRedditStyle] = useState(false);
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Handle theme change
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const analyzePost = async () => {
    setLoading(true);
    setError(null);
    setJudgment(null);
    setConfidenceScore(null);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          post,
          isHumanized,
          isRedditStyle
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze post');
      }

      setAnalysis(data.analysis);
      setJudgment(data.judgment);
      setConfidenceScore(data.confidenceScore);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze post';
      setError(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRedditStyle = async () => {
    setIsRedditStyle(!isRedditStyle);
    if (post) {
      await analyzePost();
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(analysis);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === 'dark'
        ? 'bg-gradient-to-b from-gray-900 to-gray-800 text-white'
        : 'bg-gradient-to-b from-gray-100 to-white text-gray-900'
    }`}>
      <SettingsPanel
        theme={theme}
        isHumanized={isHumanized}
        onThemeChange={handleThemeChange}
        onHumanizedChange={setIsHumanized}
      />

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-4 sm:mb-8">
          AITA Analyzer
          <span className="text-blue-400 ml-2" aria-hidden="true">🤔</span>
        </h1>
        <p className={`text-sm sm:text-base text-center mb-6 sm:mb-8 px-4 max-w-2xl mx-auto ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Paste your AITA post below and let AI determine if you&apos;re the asshole or not.
        </p>
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
          <div className={`backdrop-blur-sm p-4 sm:p-6 rounded-lg shadow-xl ${
            theme === 'dark' ? 'bg-gray-800/80' : 'bg-white/80'
          }`}>
            <textarea
              className={`w-full h-36 sm:h-48 p-3 sm:p-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base resize-y ${
                theme === 'dark' 
                  ? 'bg-gray-700 text-white' 
                  : 'bg-gray-50 text-gray-900'
              }`}
              placeholder="Paste your AITA post here..."
              value={post}
              onChange={(e) => setPost(e.target.value)}
              style={{ minHeight: '150px' }}
            />
            <div className="mt-4">
              <button
                onClick={analyzePost}
                disabled={loading || !post || post.length < 10}
                className={`w-full px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-200 ease-in-out
                  ${loading || !post || post.length < 10
                    ? theme === 'dark'
                      ? "bg-gray-600 cursor-not-allowed opacity-70"
                      : "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 active:transform active:scale-[0.98] text-white"
                  }
                  text-sm sm:text-base`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : "Analyze Post"}
              </button>
              {post && post.length < 10 && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Post must be at least 10 characters long
                </p>
              )}
            </div>
          </div>

          {judgment && !error && (
            <div className={`p-6 rounded-lg shadow-xl animate-fade-in text-center ${
              judgment === 'YTA' 
                ? 'bg-red-900/80 border-2 border-red-500' 
                : judgment === 'NTA'
                  ? 'bg-green-900/80 border-2 border-green-500'
                  : 'bg-blue-900/80 border-2 border-blue-500'
            }`}>
              <h2 className={`text-2xl sm:text-3xl font-bold mb-2 ${
                judgment === 'YTA' ? 'text-red-200' : 
                judgment === 'NTA' ? 'text-green-200' : 
                'text-blue-200'
              }`}>
                {judgment === 'YTA' ? 'You\'re The Asshole' : 
                 judgment === 'NTA' ? 'Not The Asshole' : 
                 judgment === 'ESH' ? 'Everyone Sucks Here' :
                 'Judgment Inconclusive'}
              </h2>
              <p className={`text-sm sm:text-base ${
                judgment === 'YTA' ? 'text-red-200/80' : 
                judgment === 'NTA' ? 'text-green-200/80' : 
                'text-blue-200/80'
              }`}>
                {judgment === 'YTA' 
                  ? 'The AI has determined that you were in the wrong in this situation.' 
                  : judgment === 'NTA'
                  ? 'The AI has determined that you were not in the wrong in this situation.'
                  : judgment === 'ESH'
                  ? 'The AI has determined that all parties involved share some blame.'
                  : 'The AI could not reach a definitive judgment on this situation.'}
              </p>
              {confidenceScore !== null && (
                <div className="mt-2">
                  <ConfidenceScore score={confidenceScore} />
                </div>
              )}
            </div>
          )}

          {error && (
            <div className={`border p-4 rounded-lg text-sm sm:text-base animate-fade-in ${
              theme === 'dark'
                ? 'bg-red-900/50 border-red-500 text-red-200'
                : 'bg-red-100 border-red-300 text-red-800'
            }`}>
              {error}
            </div>
          )}

          {analysis && !error && (
            <div className={`backdrop-blur-sm p-4 sm:p-6 rounded-lg shadow-xl animate-fade-in ${
              theme === 'dark' ? 'bg-gray-800/80' : 'bg-white/80'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-semibold">Analysis Result:</h2>
                <button
                  onClick={copyToClipboard}
                  className={`p-2 rounded-full transition-colors duration-200 ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title="Copy analysis"
                >
                  {copied ? (
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  )}
                </button>
              </div>
              <div className={`prose max-w-none prose-sm sm:prose-base prose-headings:font-bold ${
                theme === 'dark'
                  ? 'prose-invert prose-p:text-gray-300'
                  : 'prose-p:text-gray-600'
              }`}>
                <ReactMarkdown>{analysis}</ReactMarkdown>
              </div>
            </div>
          )}
          {analysis && !error && (
            <RedditButton
              onClick={toggleRedditStyle}
              isRedditStyle={isRedditStyle}
              judgment={judgment}
              analysis={analysis}
              onAnalysisUpdate={setAnalysis}
            />
          )}
        </div>
      </div>
    </div>
  );
}
