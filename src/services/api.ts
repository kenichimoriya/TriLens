import type { ModelId, ApiKeys } from '../types';

function getApiKeys(): ApiKeys {
  return {
    chatgpt: localStorage.getItem('trilens_key_chatgpt') || '',
    gemini: localStorage.getItem('trilens_key_gemini') || '',
    claude: localStorage.getItem('trilens_key_claude') || '',
  };
}

export async function queryModel(
  modelId: ModelId,
  prompt: string,
  systemPrompt: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const keys = getApiKeys();

  switch (modelId) {
    case 'chatgpt':
      return queryChatGPT(keys.chatgpt, prompt, systemPrompt, onChunk, signal);
    case 'gemini':
      return queryGemini(keys.gemini, prompt, systemPrompt, onChunk, signal);
    case 'claude':
      return queryClaude(keys.claude, prompt, systemPrompt, onChunk, signal);
  }
}

async function queryChatGPT(
  apiKey: string,
  prompt: string,
  systemPrompt: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!apiKey) throw new Error('OpenAI API key not set');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      stream: true,
    }),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI API error: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      if (data === '[DONE]') return;

      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onChunk(content);
      } catch {
        // skip parse errors
      }
    }
  }
}

async function queryGemini(
  apiKey: string,
  prompt: string,
  systemPrompt: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!apiKey) throw new Error('Gemini API key not set');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: prompt }] }],
      }),
      signal,
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API error: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);

      try {
        const parsed = JSON.parse(data);
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) onChunk(text);
      } catch {
        // skip parse errors
      }
    }
  }
}

async function queryClaude(
  apiKey: string,
  prompt: string,
  systemPrompt: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!apiKey) throw new Error('Claude API key not set');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    }),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Claude API error: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);

      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          onChunk(parsed.delta.text);
        }
      } catch {
        // skip parse errors
      }
    }
  }
}
