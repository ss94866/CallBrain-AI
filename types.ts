export enum CallSentiment {
  POSITIVE = 'Positive',
  NEUTRAL = 'Neutral',
  NEGATIVE = 'Negative',
}

export interface CallAnalysis {
  summary: string;
  transcript: string;
  sentiment: CallSentiment;
  actionItems: string[];
  keyInsights: string[];
}

export interface CallRecord {
  id: string;
  fileName: string;
  timestamp: number;
  duration?: string; // Formatted duration string
  status: 'processing' | 'completed' | 'failed';
  analysis?: CallAnalysis;
  error?: string;
}

export type ViewState = 'dashboard' | 'upload' | 'details';
