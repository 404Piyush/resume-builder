import type { NextApiRequest, NextApiResponse } from 'next';
import { getRequiredEnv } from '@/lib/env';
import { resolveOpenRouterModel, stripModelNotice } from '@/lib/openrouter';
import { verifyAuthToken } from '@/lib/security';

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const token = req.cookies.auth_token;
  const payload = token ? verifyAuthToken(token) : null;
  if (!payload) {
    return res.status(401).json({ message: 'Login required to use AI assistant.' });
  }

  const text = String(req.body?.text || '').trim();
  const tone = String(req.body?.tone || 'professional').trim();

  if (!text || text.length < 20) {
    return res.status(400).json({ message: 'Provide at least 20 characters to improve.' });
  }

  const prompt = [
    'Improve the following resume content.',
    `Tone: ${tone}.`,
    'Return only improved text in concise bullet-friendly format.',
    '',
    text,
  ].join('\n');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getRequiredEnv('OPENROUTER_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: resolveOpenRouterModel(),
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
    }),
  });

  const data = (await response.json()) as OpenRouterResponse;
  if (!response.ok) {
    return res.status(response.status).json({
      message: data.error?.message || 'AI request failed',
    });
  }

  const improvedText = stripModelNotice(data.choices?.[0]?.message?.content?.trim() || '');
  if (!improvedText) {
    return res.status(502).json({ message: 'No AI response content received.' });
  }

  return res.status(200).json({ improvedText });
}
