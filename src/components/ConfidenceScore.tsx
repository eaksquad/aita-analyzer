'use client';

interface ConfidenceScoreProps {
  score: number;
}

export default function ConfidenceScore({ score }: ConfidenceScoreProps) {
  // Determine color based on score
  const getColorClass = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="flex items-center space-x-2 text-sm">
      <svg
        className={`w-5 h-5 ${getColorClass(score)}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <div className="flex items-center">
        <span className="font-medium">Confidence:</span>
        <span className={`ml-1 ${getColorClass(score)}`}>{score}%</span>
      </div>
    </div>
  );
}
