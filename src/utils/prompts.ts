import type { GoalType, CriterionType, ModelId } from '../types';
import { MODELS } from '../types';

const GOAL_DESCRIPTIONS: Record<GoalType, string> = {
  research: '調査・リサーチ目的で、正確で網羅的な情報を提供してください。',
  decision: '意思決定を支援する観点で、メリット・デメリット・リスクを明確にしてください。',
  writing: '文章作成のため、読みやすく構成された文を生成してください。',
  technical: '技術的な観点から検証し、具体的な根拠や実装の注意点を含めてください。',
  brainstorm: '創造的なアイデアを幅広く出してください。実現可能性も考慮しつつ、自由に発想してください。',
};

const CRITERIA_DESCRIPTIONS: Record<CriterionType, string> = {
  accuracy: '正確性',
  comprehensiveness: '網羅性',
  practicality: '実用性',
  risk: 'リスク指摘',
  creativity: '創造性',
};

export function buildSystemPrompt(goal: GoalType, criteria: CriterionType[]): string {
  const goalDesc = GOAL_DESCRIPTIONS[goal];
  const criteriaDesc = criteria.map((c) => CRITERIA_DESCRIPTIONS[c]).join('、');

  return `あなたは優秀なAIアシスタントです。以下の条件に従って回答してください。

目的: ${goalDesc}

評価される軸: ${criteriaDesc}

回答フォーマット:
1. まず要点を簡潔にまとめてください
2. 詳細な説明を提供してください
3. あなたの回答の強みを述べてください
4. 懸念点やリスクがあれば明示してください

マークダウン形式で読みやすく回答してください。`;
}

export function buildCrossReviewPrompt(
  targetModelId: ModelId,
  targetResponse: string,
  originalPrompt: string,
): string {
  const targetName = MODELS.find((m) => m.id === targetModelId)?.name || targetModelId;

  return `以下は「${originalPrompt}」という質問に対する${targetName}の回答です。この回答を客観的に評価してください。

---
${targetName}の回答:
${targetResponse}
---

以下の観点で評価してください:
1. **正確性**: 事実に基づいているか、誤りはないか
2. **論理性**: 論理的に一貫しているか
3. **実用性**: 実際に使える内容か
4. **網羅性**: 重要な観点を見落としていないか
5. **リスク**: 見落とされているリスクや問題点はないか

最後に、5段階で総合スコアを付けてください（1=不十分、5=優秀）。

マークダウン形式で回答してください。`;
}

export function buildComparisonMatrixPrompt(
  responses: { modelId: ModelId; content: string }[],
  criteria: CriterionType[],
  originalPrompt: string,
): string {
  const responseTexts = responses
    .map((r) => {
      const name = MODELS.find((m) => m.id === r.modelId)?.name || r.modelId;
      return `## ${name}の回答:\n${r.content}`;
    })
    .join('\n\n---\n\n');

  const criteriaNames = criteria.map((c) => CRITERIA_DESCRIPTIONS[c]).join('、');

  return `以下の質問に対する3つのAIの回答を比較評価してください。

質問: ${originalPrompt}

${responseTexts}

---

以下の評価軸で1〜5のスコアを付け、コメントを添えてください: ${criteriaNames}

JSON形式で回答してください（他のテキストは不要）:
{
  "scores": [
    {
      "criterion": "評価軸名",
      "chatgpt": スコア,
      "gemini": スコア,
      "claude": スコア,
      "comment": "コメント"
    }
  ]
}`;
}

export function buildFinalDecisionPrompt(
  responses: { modelId: ModelId; content: string }[],
  originalPrompt: string,
): string {
  const responseTexts = responses
    .map((r) => {
      const name = MODELS.find((m) => m.id === r.modelId)?.name || r.modelId;
      return `## ${name}の回答:\n${r.content}`;
    })
    .join('\n\n---\n\n');

  return `以下の質問に対する3つのAIの回答を統合し、最終的な判断をまとめてください。

質問: ${originalPrompt}

${responseTexts}

---

以下の形式でまとめてください:

## 結論
（3つの回答を踏まえた最終的な結論）

## 理由
（この結論に至った理由）

## 採用した観点
（各AIの回答から採用した要素とその理由）

## 棄却した観点
（採用しなかった要素とその理由）

## 残る不確実性
（まだ解決されていない点や追加調査が必要な点）

## 次に確認すべきこと
（次のアクションステップ）`;
}
