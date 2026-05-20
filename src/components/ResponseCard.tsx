import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { MODELS } from '../types';
import type { ModelId, ModelResponse } from '../types';

interface ResponseCardProps {
  response: ModelResponse;
  onRequestReview: (targetId: ModelId, reviewerId: ModelId) => void;
  onUseAsBase: (modelId: ModelId) => void;
}

export default function ResponseCard({ response, onRequestReview, onUseAsBase }: ResponseCardProps) {
  const [showReviewMenu, setShowReviewMenu] = useState(false);
  const model = MODELS.find((m) => m.id === response.modelId)!;
  const otherModels = MODELS.filter((m) => m.id !== response.modelId);

  return (
    <div className="response-card" style={{ borderTopColor: model.color, borderTopWidth: 2 }}>
      <div className="response-card-header">
        <div className="model-badge">
          <span className="model-dot" style={{ backgroundColor: model.color }} />
          {model.name}
        </div>
        {response.loading && <div className="loading-spinner" style={{ width: 16, height: 16 }} />}
      </div>

      <div className="response-card-body">
        {response.error ? (
          <div className="error-message">{response.error}</div>
        ) : response.content ? (
          <div className="markdown-content">
            <ReactMarkdown>{response.content}</ReactMarkdown>
          </div>
        ) : response.loading ? (
          <div className="loading-indicator">
            <div className="loading-spinner" />
            <span>回答を生成中...</span>
          </div>
        ) : (
          <div className="empty-state">
            <span>回答待ち</span>
          </div>
        )}
      </div>

      {response.content && !response.loading && (
        <div className="response-card-actions">
          <div className="review-dropdown">
            <button
              className={`action-btn ${showReviewMenu ? 'active' : ''}`}
              onClick={() => setShowReviewMenu(!showReviewMenu)}
            >
              <MessageSquare size={14} />
              Review by...
            </button>
            {showReviewMenu && (
              <div className="review-dropdown-menu">
                {otherModels.map((m) => (
                  <button
                    key={m.id}
                    className="review-dropdown-item"
                    onClick={() => {
                      onRequestReview(response.modelId, m.id);
                      setShowReviewMenu(false);
                    }}
                  >
                    <span className="model-dot" style={{ backgroundColor: m.color }} />
                    {m.name} に評価させる
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className="action-btn"
            onClick={() => onUseAsBase(response.modelId)}
          >
            <ArrowRight size={14} />
            ベースに統合
          </button>
          <button
            className="action-btn"
            onClick={() => {
              navigator.clipboard.writeText(response.content);
            }}
          >
            コピー
          </button>
        </div>
      )}
    </div>
  );
}
