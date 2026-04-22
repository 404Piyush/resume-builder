import type { NextApiRequest, NextApiResponse } from 'next';
import { getRequiredEnv } from '@/lib/env';
import { resolveOpenRouterModel, stripModelNotice } from '@/lib/openrouter';
import { verifyAuthToken } from '@/lib/security';

type BuilderChatResponse = {
  answer: string;
  suggestedChange: string;
  targetField: 'summary' | 'objective' | 'none';
  cta: string;
  resumePatch?: Record<string, unknown>;
};

const fallbackResponse: BuilderChatResponse = {
  answer:
    'I reviewed your resume and found opportunities to improve clarity and measurable impact.',
  suggestedChange: '',
  targetField: 'none',
  cta: 'Would you like me to draft an improved section?',
  resumePatch: undefined,
};

const extractJson = (content: string): BuilderChatResponse => {
  const clean = content.trim();
  const fenced = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  const maybeJson = fenced || clean.match(/\{[\s\S]*\}/)?.[0];
  if (!maybeJson) return fallbackResponse;

  try {
    const parsed = JSON.parse(maybeJson.trim()) as Partial<BuilderChatResponse>;
    return {
      answer: stripModelNotice(parsed.answer || fallbackResponse.answer),
      suggestedChange: parsed.suggestedChange || '',
      targetField:
        parsed.targetField === 'summary' || parsed.targetField === 'objective'
          ? parsed.targetField
          : 'none',
      cta: parsed.cta || fallbackResponse.cta,
      resumePatch:
        parsed.resumePatch && typeof parsed.resumePatch === 'object'
          ? (parsed.resumePatch as Record<string, unknown>)
          : undefined,
    };
  } catch {
    return fallbackResponse;
  }
};

const buildDirectPatchFromPrompt = (
  question: string,
  resumeData: Record<string, unknown>
): BuilderChatResponse | null => {
  const q = question.trim();
  if (!q) return null;

  const basics = (resumeData.basics || {}) as Record<string, unknown>;
  const basicProfiles = Array.isArray(basics.profiles) ? (basics.profiles as unknown[]) : [];
  const location = (basics.location || {}) as Record<string, unknown>;

  const makeResponse = (
    field: string,
    value: string,
    answer: string,
    targetField: 'summary' | 'objective' | 'none' = 'none'
  ): BuilderChatResponse => ({
    answer,
    suggestedChange: targetField === 'none' ? '' : value,
    targetField,
    cta: 'Applied change is ready. Click Apply for me.',
    resumePatch: {
      basics: {
        ...basics,
        [field]: value,
      },
    },
  });

  const makeLocationResponse = (
    locationField: string,
    value: string,
    answer: string
  ): BuilderChatResponse => ({
    answer,
    suggestedChange: '',
    targetField: 'none',
    cta: 'Applied change is ready. Click Apply for me.',
    resumePatch: {
      basics: {
        ...basics,
        location: {
          ...location,
          [locationField]: value,
        },
      },
    },
  });

  const makeProfileResponse = (
    network: string,
    value: string,
    answer: string
  ): BuilderChatResponse => {
    const normalizedProfiles = basicProfiles
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({ ...(item as Record<string, unknown>) }));
    const matched = normalizedProfiles.find(
      (item) => String(item.network || '').toLowerCase() === network.toLowerCase()
    );
    if (matched) {
      matched.url = value;
    } else {
      normalizedProfiles.push({ network, username: 'janedoe', url: value });
    }

    return {
      answer,
      suggestedChange: '',
      targetField: 'none',
      cta: 'Applied change is ready. Click Apply for me.',
      resumePatch: {
        basics: {
          ...basics,
          profiles: normalizedProfiles,
        },
      },
    };
  };

  const nameMatch = q.match(/(?:change|set|update)\s+name\s+(?:to|as)\s+(.+)/i);
  if (nameMatch?.[1]) {
    const value = nameMatch[1].trim();
    return makeResponse('name', value, `Done. I prepared a patch to change name to ${value}.`);
  }

  const labelMatch = q.match(/(?:change|set|update)\s+(?:role|title|label)\s+(?:to|as)\s+(.+)/i);
  if (labelMatch?.[1]) {
    const value = labelMatch[1].trim();
    return makeResponse('label', value, `Done. I prepared a patch to change title to ${value}.`);
  }

  const emailMatch = q.match(/(?:change|set|update)\s+email\s+(?:to|as)\s+(.+)/i);
  if (emailMatch?.[1]) {
    const value = emailMatch[1].trim();
    return makeResponse('email', value, `Done. I prepared a patch to change email to ${value}.`);
  }

  const phoneMatch = q.match(/(?:change|set|update)\s+phone\s+(?:to|as)\s+(.+)/i);
  if (phoneMatch?.[1]) {
    const value = phoneMatch[1].trim();
    return makeResponse('phone', value, `Done. I prepared a patch to change phone to ${value}.`);
  }

  const urlMatch = q.match(
    /(?:change|set|update)\s+(?:website|site|portfolio|url)\s+(?:to|as)\s+(.+)/i
  );
  if (urlMatch?.[1]) {
    const value = urlMatch[1].trim();
    return makeResponse('url', value, `Done. I prepared a patch to change website to ${value}.`);
  }

  const summaryMatch = q.match(/(?:change|set|update|rewrite)\s+summary\s+(?:to|as)\s+([\s\S]+)/i);
  if (summaryMatch?.[1]) {
    const value = summaryMatch[1].trim();
    return makeResponse('summary', value, 'Done. I prepared a summary update.', 'summary');
  }

  const objectiveMatch = q.match(
    /(?:change|set|update|rewrite)\s+(?:objective|career objective)\s+(?:to|as)\s+([\s\S]+)/i
  );
  if (objectiveMatch?.[1]) {
    const value = objectiveMatch[1].trim();
    return makeResponse('objective', value, 'Done. I prepared an objective update.', 'objective');
  }

  const cityMatch = q.match(/(?:change|set|update)\s+(?:city|location)\s+(?:to|as)\s+(.+)/i);
  if (cityMatch?.[1]) {
    const value = cityMatch[1].trim();
    return makeLocationResponse(
      'city',
      value,
      `Done. I prepared a patch to update city to ${value}.`
    );
  }

  const totalExpMatch = q.match(/(?:change|set|update)\s+total\s+experience\s+(?:to|as)\s+(.+)/i);
  if (totalExpMatch?.[1]) {
    const value = totalExpMatch[1].trim();
    return makeResponse(
      'totalExp',
      value,
      `Done. I prepared a patch to update total experience to ${value}.`
    );
  }

  const relExpMatch = q.match(
    /(?:change|set|update)\s+(?:relevant\s+experience|rel\s*exp)\s+(?:to|as)\s+(.+)/i
  );
  if (relExpMatch?.[1]) {
    const value = relExpMatch[1].trim();
    return makeResponse(
      'relExp',
      value,
      `Done. I prepared a patch to update relevant experience to ${value}.`
    );
  }

  const networkMatch = q.match(
    /(?:change|set|update)\s+(linkedin|twitter|github|hackerrank|hackerearth|codechef|leetcode|cssbattle)\s+(?:to|as)\s+(.+)/i
  );
  if (networkMatch?.[1] && networkMatch?.[2]) {
    const network = networkMatch[1].trim().toLowerCase();
    const value = networkMatch[2].trim();
    return makeProfileResponse(
      network,
      value,
      `Done. I prepared a patch to update ${network} link to ${value}.`
    );
  }

  const genericMatch = q.match(/(?:change|set|update)\s+([a-zA-Z\s]+?)\s+(?:to|as)\s+([\s\S]+)/i);
  if (genericMatch?.[1] && genericMatch?.[2]) {
    const rawField = genericMatch[1].trim().toLowerCase().replace(/\s+/g, ' ');
    const value = genericMatch[2].trim();
    const fieldMap: Record<string, string> = {
      name: 'name',
      title: 'label',
      role: 'label',
      label: 'label',
      email: 'email',
      phone: 'phone',
      website: 'url',
      site: 'url',
      portfolio: 'url',
      url: 'url',
      summary: 'summary',
      objective: 'objective',
      'career objective': 'objective',
      'total experience': 'totalExp',
      'relevant experience': 'relExp',
    };
    const field = fieldMap[rawField];
    if (field && field !== 'image') {
      const targetField =
        field === 'summary' || field === 'objective' ? (field as 'summary' | 'objective') : 'none';
      return makeResponse(
        field,
        value,
        `Done. I prepared a patch to update ${rawField}.`,
        targetField
      );
    }
  }

  return null;
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

  const action = String(req.body?.action || 'review');
  const question = String(req.body?.question || '');
  const resumeData = req.body?.resumeData || {};

  const directPatch = buildDirectPatchFromPrompt(question, resumeData);
  if (directPatch) {
    return res.status(200).json(directPatch);
  }

  const instruction = [
    'You are an expert AI resume builder assistant.',
    'When the user asks for sample resume or major improvements, generate a full structured patch for the resume builder.',
    'Return JSON only in this format:',
    '{"answer":"...","suggestedChange":"...","targetField":"summary|objective|none","cta":"...","resumePatch":{"basics":{"summary":"...","objective":"..."},"work":[{"id":"...","name":"...","position":"...","url":"","startDate":"...","isWorkingHere":false,"endDate":"...","years":"","summary":"...","highlights":["..."]}],"education":[{"id":"...","institution":"...","url":"","studyType":"...","area":"...","startDate":"...","isStudyingHere":false,"endDate":"...","score":"...","courses":["..."]}],"skills":{"languages":[{"name":"...","level":80}],"frameworks":[{"name":"...","level":70}],"technologies":[{"name":"...","level":3}],"libraries":[{"name":"...","level":3}],"databases":[{"name":"...","level":3}],"practices":[{"name":"...","level":3}],"tools":[{"name":"...","level":3}]},"awards":[{"id":"...","title":"...","awarder":"...","date":"...","summary":"..."}],"volunteer":[{"id":"...","organization":"...","position":"...","url":"","startDate":"...","endDate":"...","summary":"...","highlights":["..."],"isVolunteeringNow":false}],"activities":{"involvements":"...","achievements":"..."}}}',
    'Always include resumePatch when user asks for full/sample resume, rewrite all, generate resume, or apply everything.',
    'Use plain strings for dates as used in existing data. Keep JSON valid.',
  ].join('\n');

  const userPrompt = JSON.stringify(
    {
      action,
      question,
      user: payload.email,
      resumeData,
    },
    null,
    2
  );

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getRequiredEnv('OPENROUTER_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: resolveOpenRouterModel(),
      temperature: 0.5,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: instruction },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    return res.status(response.status).json({
      message: data.error?.message || 'AI request failed',
    });
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    return res.status(502).json({ message: 'No AI response content received.' });
  }

  return res.status(200).json(extractJson(content));
}
