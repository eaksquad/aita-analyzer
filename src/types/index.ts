export type Judgment = 'YTA' | 'NTA' | 'ESH' | 'INCONCLUSIVE';

export interface AnalysisResponse {
  judgment: Judgment;
  analysis: string;
  confidenceScore: number;
  formatted: boolean;
}

export interface AIPromptOptions {
  isHumanized: boolean;
}

export type Theme = 'light' | 'dark';
