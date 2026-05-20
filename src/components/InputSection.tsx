import { Send } from 'lucide-react';
import { GOALS, CRITERIA } from '../types';
import type { GoalType, CriterionType } from '../types';

interface InputSectionProps {
  prompt: string;
  setPrompt: (v: string) => void;
  goal: GoalType;
  setGoal: (v: GoalType) => void;
  criteria: CriterionType[];
  setCriteria: (v: CriterionType[]) => void;
  onSubmit: () => void;
  loading: boolean;
}

export default function InputSection({
  prompt,
  setPrompt,
  goal,
  setGoal,
  criteria,
  setCriteria,
  onSubmit,
  loading,
}: InputSectionProps) {
  const toggleCriterion = (c: CriterionType) => {
    if (criteria.includes(c)) {
      setCriteria(criteria.filter((x) => x !== c));
    } else {
      setCriteria([...criteria, c]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      onSubmit();
    }
  };

  const hasKeys =
    !!localStorage.getItem('trilens_key_chatgpt') ||
    !!localStorage.getItem('trilens_key_gemini') ||
    !!localStorage.getItem('trilens_key_claude');

  return (
    <div className="input-section">
      <h2>Prompt</h2>
      <textarea
        className="prompt-area"
        placeholder="質問・課題を入力してください... (Ctrl+Enter で送信)"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <div className="input-options">
        <div className="option-group">
          <label>Goal / 目的</label>
          <div className="tag-list">
            {GOALS.map((g) => (
              <button
                key={g.id}
                className={`tag ${goal === g.id ? 'active' : ''}`}
                onClick={() => setGoal(g.id)}
              >
                {g.labelJa}
              </button>
            ))}
          </div>
        </div>

        <div className="option-group">
          <label>Criteria / 評価軸</label>
          <div className="tag-list">
            {CRITERIA.map((c) => (
              <button
                key={c.id}
                className={`tag ${criteria.includes(c.id) ? 'active-green' : ''}`}
                onClick={() => toggleCriterion(c.id)}
              >
                {c.labelJa}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="submit-row">
        {!hasKeys && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            APIキーを設定してください (右上 Settings)
          </span>
        )}
        <button
          className="submit-btn"
          onClick={onSubmit}
          disabled={loading || !prompt.trim()}
        >
          <Send size={16} />
          {loading ? '送信中...' : '3モデルに同時送信'}
        </button>
      </div>
    </div>
  );
}
