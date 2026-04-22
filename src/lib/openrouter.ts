import { getOptionalEnv } from './env';

const DEPRECATED_MODEL_ALIASES: Record<string, string> = {
  'openrouter/elephant-alpha': 'inclusionai/ling-2.6-flash:free',
};

export const resolveOpenRouterModel = () => {
  const configured = getOptionalEnv('OPENROUTER_MODEL', '').trim();
  const normalized = configured || 'openai/gpt-4o-mini';
  return DEPRECATED_MODEL_ALIASES[normalized] || normalized;
};

export const stripModelNotice = (text: string) =>
  text
    .replace(
      /Elephant Alpha was a stealth model revealed on April 21st as Ling-2\.6-flash\.[\s\S]*?(?:\n|$)/gi,
      ''
    )
    .trim();
