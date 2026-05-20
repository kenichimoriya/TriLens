import { useState, useCallback, useRef } from 'react';
import { Settings } from 'lucide-react';
import './App.css';
import { MODELS } from './types';
import type { ModelId, GoalType, CriterionType, ModelResponse, CrossReview, MatrixScore } from './types';
import { queryModel } from './services/api';
import { buildSystemPrompt, buildCrossReviewPrompt, buildComparisonMatrixPrompt, buildFinalDecisionPrompt } from './utils/prompts';
import SettingsModal from './components/SettingsModal';
import InputSection from './components/InputSection';
import ResponseCard from './components/ResponseCard';
import CrossReviewPanel from './components/CrossReviewPanel';
import ComparisonMatrix from './components/ComparisonMatrix';
import FinalDecision from './components/FinalDecision';

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [goal, setGoal] = useState<GoalType>('decision');
  const [criteria, setCriteria] = useState<CriterionType[]>(['accuracy', 'practicality', 'risk']);
  const [responses, setResponses] = useState<ModelResponse[]>([]);
  const [crossReviews, setCrossReviews] = useState<CrossReview[]>([]);
  const [matrixScores, setMatrixScores] = useState<MatrixScore[]>([]);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [decisionContent, setDecisionContent] = useState('');
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const currentPromptRef = useRef('');
  const abortControllersRef = useRef<AbortController[]>([]);

  const handleSubmit = useCallback(() => {
    if (!prompt.trim() || submitting) return;

    // Abort previous requests
    abortControllersRef.current.forEach((ac) => ac.abort());
    abortControllersRef.current = [];

    currentPromptRef.current = prompt;
    setSubmitting(true);
    setCrossReviews([]);
    setMatrixScores([]);
    setDecisionContent('');

    const systemPrompt = buildSystemPrompt(goal, criteria);

    const initialResponses: ModelResponse[] = MODELS.map((m) => ({
      modelId: m.id,
      content: '',
      loading: true,
      error: null,
    }));
    setResponses(initialResponses);

    let completed = 0;

    for (const model of MODELS) {
      const ac = new AbortController();
      abortControllersRef.current.push(ac);

      const key = localStorage.getItem(`trilens_key_${model.id}`);
      if (!key) {
        setResponses((prev) =>
          prev.map((r) =>
            r.modelId === model.id
              ? { ...r, loading: false, error: `${model.name} APIキーが未設定です。右上のSettingsから設定してください。` }
              : r,
          ),
        );
        completed++;
        if (completed === MODELS.length) setSubmitting(false);
        continue;
      }

      queryModel(
        model.id,
        prompt,
        systemPrompt,
        (chunk) => {
          setResponses((prev) =>
            prev.map((r) =>
              r.modelId === model.id ? { ...r, content: r.content + chunk } : r,
            ),
          );
        },
        ac.signal,
      )
        .then(() => {
          setResponses((prev) =>
            prev.map((r) =>
              r.modelId === model.id ? { ...r, loading: false } : r,
            ),
          );
        })
        .catch((err) => {
          if (err.name === 'AbortError') return;
          setResponses((prev) =>
            prev.map((r) =>
              r.modelId === model.id
                ? { ...r, loading: false, error: err.message || 'Unknown error' }
                : r,
            ),
          );
        })
        .finally(() => {
          completed++;
          if (completed === MODELS.length) setSubmitting(false);
        });
    }
  }, [prompt, goal, criteria, submitting]);

  const handleRequestReview = useCallback(
    (targetId: ModelId, reviewerId: ModelId) => {
      const targetResponse = responses.find((r) => r.modelId === targetId);
      if (!targetResponse?.content) return;

      const newReview: CrossReview = {
        reviewerId,
        targetId,
        content: '',
        loading: true,
        error: null,
      };

      setCrossReviews((prev) => [...prev, newReview]);
      const reviewIndex = crossReviews.length;

      const reviewPrompt = buildCrossReviewPrompt(
        targetId,
        targetResponse.content,
        currentPromptRef.current,
      );

      queryModel(
        reviewerId,
        reviewPrompt,
        'あなたは他のAIの回答を客観的に評価する専門家です。',
        (chunk) => {
          setCrossReviews((prev) =>
            prev.map((r, i) =>
              i === reviewIndex ? { ...r, content: r.content + chunk } : r,
            ),
          );
        },
      )
        .then(() => {
          setCrossReviews((prev) =>
            prev.map((r, i) =>
              i === reviewIndex ? { ...r, loading: false } : r,
            ),
          );
        })
        .catch((err) => {
          setCrossReviews((prev) =>
            prev.map((r, i) =>
              i === reviewIndex ? { ...r, loading: false, error: err.message } : r,
            ),
          );
        });
    },
    [responses, crossReviews.length],
  );

  const handleGenerateMatrix = useCallback(() => {
    const validResponses = responses.filter((r) => r.content && !r.error);
    if (validResponses.length < 2) return;

    setMatrixLoading(true);
    const matrixPrompt = buildComparisonMatrixPrompt(
      validResponses.map((r) => ({ modelId: r.modelId, content: r.content })),
      criteria,
      currentPromptRef.current,
    );

    // Use the first available model for evaluation
    const evaluatorId = validResponses[0].modelId;
    let fullContent = '';

    queryModel(
      evaluatorId,
      matrixPrompt,
      'あなたはAIの回答を客観的に比較評価する専門家です。JSON形式で回答してください。',
      (chunk) => {
        fullContent += chunk;
      },
    )
      .then(() => {
        try {
          // Extract JSON from response
          const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const scores: MatrixScore[] = (parsed.scores || []).map(
              (s: Record<string, unknown>) => ({
                criterion: s.criterion as string,
                scores: {
                  chatgpt: (s.chatgpt as number) || 0,
                  gemini: (s.gemini as number) || 0,
                  claude: (s.claude as number) || 0,
                },
                comment: (s.comment as string) || '',
              }),
            );
            setMatrixScores(scores);
          }
        } catch {
          console.error('Failed to parse matrix JSON');
        }
      })
      .catch((err) => {
        console.error('Matrix generation failed:', err);
      })
      .finally(() => {
        setMatrixLoading(false);
      });
  }, [responses, criteria]);

  const handleGenerateDecision = useCallback(
    (evaluatorId: ModelId) => {
      const validResponses = responses.filter((r) => r.content && !r.error);
      if (validResponses.length < 2) return;

      setDecisionLoading(true);
      setDecisionContent('');

      const decisionPrompt = buildFinalDecisionPrompt(
        validResponses.map((r) => ({ modelId: r.modelId, content: r.content })),
        currentPromptRef.current,
      );

      queryModel(
        evaluatorId,
        decisionPrompt,
        'あなたは複数のAIの回答を統合し、最終的な判断を下す専門家です。',
        (chunk) => {
          setDecisionContent((prev) => prev + chunk);
        },
      )
        .then(() => {
          setDecisionLoading(false);
        })
        .catch((err) => {
          setDecisionLoading(false);
          setDecisionContent(`Error: ${err.message}`);
        });
    },
    [responses],
  );

  const handleUseAsBase = useCallback(
    (modelId: ModelId) => {
      const response = responses.find((r) => r.modelId === modelId);
      if (!response?.content) return;

      // Trigger final decision generation using this model's response as the base
      const modelName = MODELS.find((m) => m.id === modelId)?.name || modelId;
      const validResponses = responses.filter((r) => r.content && !r.error);

      setDecisionLoading(true);
      setDecisionContent('');

      const basePrompt = `以下の質問に対して、${modelName}の回答をベースに、他のAIの回答の良い点を統合して最終回答を作成してください。

質問: ${currentPromptRef.current}

---
ベース回答 (${modelName}):
${response.content}

---
${validResponses
  .filter((r) => r.modelId !== modelId)
  .map((r) => {
    const name = MODELS.find((m) => m.id === r.modelId)?.name || r.modelId;
    return `${name}の回答:\n${r.content}`;
  })
  .join('\n\n---\n')}

---

${modelName}の回答をベースにしつつ、他の回答から有用な情報を補完してください。
最終回答は以下の形式でまとめてください:

## 結論
## 理由
## 採用した観点
## 棄却した観点
## 残る不確実性
## 次に確認すべきこと`;

      // Use the base model as the evaluator
      queryModel(
        modelId,
        basePrompt,
        'あなたは複数のAIの回答を統合する専門家です。',
        (chunk) => {
          setDecisionContent((prev) => prev + chunk);
        },
      )
        .then(() => {
          setDecisionLoading(false);
        })
        .catch((err) => {
          setDecisionLoading(false);
          setDecisionContent(`Error: ${err.message}`);
        });
    },
    [responses],
  );

  const hasResponses = responses.some((r) => r.content && !r.error);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">
          <svg viewBox="0 0 32 32" fill="none">
            <circle cx="10" cy="16" r="4" fill="#10a37f" opacity="0.8" />
            <circle cx="22" cy="10" r="4" fill="#4285f4" opacity="0.8" />
            <circle cx="22" cy="22" r="4" fill="#d97706" opacity="0.8" />
            <path d="M10 16L22 10M10 16L22 22M22 10L22 22" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          </svg>
          <div>
            <h1>TriLens</h1>
            <span>AI Council</span>
          </div>
        </div>
        <button className="settings-btn" onClick={() => setSettingsOpen(true)}>
          <Settings size={16} />
          Settings
        </button>
      </header>

      <main className="app-main">
        <InputSection
          prompt={prompt}
          setPrompt={setPrompt}
          goal={goal}
          setGoal={setGoal}
          criteria={criteria}
          setCriteria={setCriteria}
          onSubmit={handleSubmit}
          loading={submitting}
        />

        {responses.length > 0 && (
          <div className="responses-section">
            <div className="section-header">
              <h2 className="section-title">Responses / 回答</h2>
            </div>
            <div className="responses-grid">
              {responses.map((r) => (
                <ResponseCard
                  key={r.modelId}
                  response={r}
                  onRequestReview={handleRequestReview}
                  onUseAsBase={handleUseAsBase}
                />
              ))}
            </div>
          </div>
        )}

        <CrossReviewPanel reviews={crossReviews} />

        {responses.length > 0 && (
          <>
            <ComparisonMatrix
              scores={matrixScores}
              loading={matrixLoading}
              onGenerate={handleGenerateMatrix}
              hasResponses={hasResponses}
            />

            <FinalDecision
              content={decisionContent}
              loading={decisionLoading}
              onGenerate={handleGenerateDecision}
              hasResponses={hasResponses}
            />
          </>
        )}
      </main>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export default App;
