import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { FileText, Copy, Check } from 'lucide-react';
import { MODELS } from '../types';
import type { ModelId } from '../types';

interface FinalDecisionProps {
  content: string;
  loading: boolean;
  onGenerate: (evaluatorId: ModelId) => void;
  hasResponses: boolean;
}

export default function FinalDecision({ content, loading, onGenerate, hasResponses }: FinalDecisionProps) {
  const [copied, setCopied] = useState(false);
  const [selectedEvaluator, setSelectedEvaluator] = useState<ModelId>('claude');

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="decision-section">
      <div className="section-header">
        <h2 className="section-title">
          <FileText size={16} />
          Final Decision / 統合回答
        </h2>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
          EVALUATOR / 統合に使うモデル
        </label>
        <div className="evaluator-selector">
          {MODELS.map((m) => (
            <button
              key={m.id}
              className={`evaluator-btn ${selectedEvaluator === m.id ? 'selected' : ''}`}
              onClick={() => setSelectedEvaluator(m.id)}
            >
              <span className="model-dot" style={{
                backgroundColor: m.color,
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                marginRight: 6,
              }} />
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <button
        className="generate-decision-btn"
        onClick={() => onGenerate(selectedEvaluator)}
        disabled={loading || !hasResponses}
      >
        {loading ? (
          <>
            <div className="loading-spinner" style={{ width: 14, height: 14, borderTopColor: '#fff' }} />
            統合中...
          </>
        ) : (
          <>
            <FileText size={14} />
            最終判断を生成
          </>
        )}
      </button>

      {content && (
        <div className="decision-card">
          <div className="decision-card-header">
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Final Decision Draft</span>
            <button className="copy-btn" onClick={handleCopy}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'コピーする'}
            </button>
          </div>
          <div className="decision-card-body">
            <div className="markdown-content">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {!content && !loading && (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius)',
          padding: 40,
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 14,
        }}>
          3つの回答を統合して最終判断を生成します
        </div>
      )}
    </div>
  );
}
