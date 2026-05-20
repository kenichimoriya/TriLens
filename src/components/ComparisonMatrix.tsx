import { BarChart3 } from 'lucide-react';
import { MODELS } from '../types';
import type { MatrixScore } from '../types';

interface ComparisonMatrixProps {
  scores: MatrixScore[];
  loading: boolean;
  onGenerate: () => void;
  hasResponses: boolean;
}

export default function ComparisonMatrix({ scores, loading, onGenerate, hasResponses }: ComparisonMatrixProps) {
  const getScoreClass = (score: number) => {
    if (score >= 4) return 'score-high';
    if (score >= 3) return 'score-mid';
    return 'score-low';
  };

  const CRITERIA_JA: Record<string, string> = {
    accuracy: '正確性',
    comprehensiveness: '網羅性',
    practicality: '実用性',
    risk: 'リスク指摘',
    creativity: '創造性',
  };

  return (
    <div className="matrix-section">
      <div className="section-header">
        <h2 className="section-title">
          <BarChart3 size={16} />
          Comparison Matrix / 比較マトリクス
        </h2>
        <button
          className="generate-matrix-btn"
          onClick={onGenerate}
          disabled={loading || !hasResponses}
        >
          {loading ? (
            <>
              <div className="loading-spinner" style={{ width: 14, height: 14 }} />
              生成中...
            </>
          ) : (
            <>
              <BarChart3 size={14} />
              マトリクスを生成
            </>
          )}
        </button>
      </div>

      {scores.length > 0 && (
        <div className="matrix-table-wrapper">
          <table className="matrix-table">
            <thead>
              <tr>
                <th>評価軸</th>
                {MODELS.map((m) => (
                  <th key={m.id} style={{ textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span className="model-dot" style={{ backgroundColor: m.color, display: 'inline-block', width: 8, height: 8, borderRadius: '50%' }} />
                      {m.name}
                    </span>
                  </th>
                ))}
                <th>コメント</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>
                    {CRITERIA_JA[row.criterion] || row.criterion}
                  </td>
                  {MODELS.map((m) => (
                    <td key={m.id} className={`score-cell ${getScoreClass(row.scores[m.id] || 0)}`}>
                      {row.scores[m.id] || '-'}
                    </td>
                  ))}
                  <td className="comment-cell">{row.comment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {scores.length === 0 && !loading && (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius)',
          padding: 40,
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 14,
        }}>
          3つの回答が揃ったら「マトリクスを生成」をクリックしてください
        </div>
      )}
    </div>
  );
}
