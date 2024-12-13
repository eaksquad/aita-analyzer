'use client';

import { useState } from "react";
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const [post, setPost] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzePost = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ post }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze post');
      }

      setAnalysis(data.analysis);
    } catch (error: any) {
      setError(error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-4 sm:mb-8">
          AITA Analyzer
          <span className="text-blue-400 ml-2" aria-hidden="true">🤔</span>
        </h1>
        <p className="text-sm sm:text-base text-center text-gray-300 mb-6 sm:mb-8 px-4 max-w-2xl mx-auto">
          Paste your AITA post below and let AI determine if you're the asshole or not.
        </p>
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
          <div className="bg-gray-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-lg shadow-xl">
            <textarea
              className="w-full h-36 sm:h-48 p-3 sm:p-4 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base resize-y"
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
                    ? "bg-gray-600 cursor-not-allowed opacity-70"
                    : "bg-blue-600 hover:bg-blue-700 active:transform active:scale-[0.98]"
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

          {error && (
            <div className="bg-red-900/50 border border-red-500 p-4 rounded-lg text-red-200 text-sm sm:text-base animate-fade-in">
              {error}
            </div>
          )}

          {analysis && !error && (
            <div className="bg-gray-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-lg shadow-xl animate-fade-in">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Analysis Result:</h2>
              <div className="prose prose-invert max-w-none prose-sm sm:prose-base prose-headings:font-bold prose-p:text-gray-300 prose-strong:text-white">
                <ReactMarkdown>{analysis}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
