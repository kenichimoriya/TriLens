export type ModelId = 'chatgpt' | 'gemini' | 'claude';

export interface ApiKeys {
  chatgpt: string;
  gemini: string;
  claude: string;
}

export type GoalType =
  | 'research'
  | 'decision'
  | 'writing'
  | 'technical'
  | 'brainstorm';

export type CriterionType =
  | 'accuracy'
  | 'comprehensiveness'
  | 'practicality'
  | 'risk'
  | 'creativity';

export interface Goal {
  id: GoalType;
  label: string;
  labelJa: string;
}

export interface Criterion {
  id: CriterionType;
  label: string;
  labelJa: string;
}

export interface ModelResponse {
  modelId: ModelId;
  content: string;
  loading: boolean;
  error: string | null;
}

export interface CrossReview {
  reviewerId: ModelId;
  targetId: ModelId;
  content: string;
  loading: boolean;
  error: string | null;
}

export interface MatrixScore {
  criterion: CriterionType;
  scores: Record<ModelId, number>;
  comment: string;
}

export interface FinalDecision {
  conclusion: string;
  reasoning: string;
  adoptedPoints: string;
  rejectedPoints: string;
  remainingUncertainty: string;
  nextSteps: string;
  loading: boolean;
}

export const MODELS: { id: ModelId; name: string; color: string; bgColor: string; borderColor: string }[] = [
  { id: 'chatgpt', name: 'ChatGPT', color: '#10a37f', bgColor: '#f0fdf9', borderColor: '#10a37f' },
  { id: 'gemini', name: 'Gemini', color: '#4285f4', bgColor: '#eff6ff', borderColor: '#4285f4' },
  { id: 'claude', name: 'Claude', color: '#d97706', bgColor: '#fffbeb', borderColor: '#d97706' },
];

export const GOALS: Goal[] = [
  { id: 'research', label: 'Research', labelJa: '調査' },
  { id: 'decision', label: 'Decision Making', labelJa: '意思決定' },
  { id: 'writing', label: 'Writing', labelJa: '文章作成' },
  { id: 'technical', label: 'Technical Review', labelJa: '技術検証' },
  { id: 'brainstorm', label: 'Brainstorming', labelJa: 'アイデア出し' },
];

export const CRITERIA: Criterion[] = [
  { id: 'accuracy', label: 'Accuracy', labelJa: '正確性' },
  { id: 'comprehensiveness', label: 'Comprehensiveness', labelJa: '網羅性' },
  { id: 'practicality', label: 'Practicality', labelJa: '実用性' },
  { id: 'risk', label: 'Risk Assessment', labelJa: 'リスク' },
  { id: 'creativity', label: 'Creativity', labelJa: '創造性' },
];
