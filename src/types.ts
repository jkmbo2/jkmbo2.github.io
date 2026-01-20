export interface ChatMessage {
  id: string;
  sender: 'me' | 'other';
  text: string;
}

export interface TarotCard {
  id: string;
  name: string;
  meaning: string;
  image: string; // 暂时用 placeholder 或者 Emoji
}

export interface NutritionData {
  nonsense: number;
  sugar: number;
  toxicity: number;
  sincerity: number;
}

export interface AnalysisResult {
  title: string;
  score: number;
  dimensions: { subject: string; value: number }[];
  summary: string[];
  prescription: string;
  category: string;
  keywords: string[];
  mbti: string;
  frequencyData: { time: string; count: number }[];
  interactionStyle: string;
  hiddenMessages: { original: string; decoded: string }[];
  tarot: TarotCard;
  nutrition: NutritionData;
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  personName: string;
  result: AnalysisResult;
}

export interface PersonRecord {
  id: string;
  name: string;
  lastAnalysisId: string;
  latestScore: number;
  analysisCount: number;
}
