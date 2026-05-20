import ReactMarkdown from 'react-markdown';
import { ArrowRight } from 'lucide-react';
import { MODELS } from '../types';
import type { CrossReview } from '../types';

interface CrossReviewPanelProps {
  reviews: CrossReview[];
}

export default function CrossReviewPanel({ reviews }: CrossReviewPanelProps) {
  if (reviews.length === 0) return null;

  return (
    <div className="cross-review-section">
      <h2>
        <MessageSquareIcon />
        Cross Review
      </h2>
      {reviews.map((review, idx) => {
        const reviewer = MODELS.find((m) => m.id === review.reviewerId)!;
        const target = MODELS.find((m) => m.id === review.targetId)!;

        return (
          <div key={idx} className="cross-review-card">
            <div className="cross-review-header">
              <span className="model-dot" style={{ backgroundColor: target.color }} />
              <span>{target.name}</span>
              <ArrowRight size={14} className="cross-review-arrow" />
              <span style={{ fontWeight: 600 }}>Reviewed by</span>
              <span className="model-dot" style={{ backgroundColor: reviewer.color }} />
              <span style={{ fontWeight: 600 }}>{reviewer.name}</span>
              {review.loading && <div className="loading-spinner" style={{ width: 14, height: 14, marginLeft: 'auto' }} />}
            </div>
            <div className="cross-review-body">
              {review.error ? (
                <div className="error-message">{review.error}</div>
              ) : review.content ? (
                <div className="markdown-content">
                  <ReactMarkdown>{review.content}</ReactMarkdown>
                </div>
              ) : review.loading ? (
                <div className="loading-indicator">
                  <div className="loading-spinner" />
                  <span>評価を生成中...</span>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MessageSquareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
