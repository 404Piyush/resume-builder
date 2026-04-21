import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Drawer,
  Fab,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { MdAutoAwesome, MdChat } from 'react-icons/md';
import { useActivity } from '@/stores/activity';
import { useAwards } from '@/stores/awards';
import { useResumeStore } from '@/stores/useResumeStore';
import { useBasicDetails } from '@/stores/basic';
import {
  useDatabases,
  useFrameworks,
  useLanguages,
  useLibraries,
  usePractices,
  useTechnologies,
  useTools,
} from '@/stores/skills';
import { useEducations } from '@/stores/education';
import { useExperiences } from '@/stores/experience';
import { useVoluteeringStore } from '@/stores/volunteering';

type ChatItem = {
  role: 'user' | 'assistant';
  text: string;
  suggestedChange?: string;
  targetField?: 'summary' | 'objective' | 'none';
  cta?: string;
  resumePatch?: Record<string, unknown>;
};

type AssistantResult = {
  answer: string;
  suggestedChange: string;
  targetField: 'summary' | 'objective' | 'none';
  cta: string;
  resumePatch?: Record<string, unknown>;
};

const quickActions = [
  { label: 'What should I improve?', action: 'improve' },
  { label: 'What should I add next?', action: 'add_next' },
  { label: 'Make it ATS friendly', action: 'ats' },
  { label: 'Improve my summary', action: 'summary' },
];

const toSafeParagraph = (text: string) => {
  const escaped = text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .trim();
  return `<p>${escaped}</p>`;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const asString = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);

const asBoolean = (value: unknown, fallback = false) =>
  typeof value === 'boolean' ? value : fallback;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const asStringArray = (value: unknown): string[] =>
  asArray(value)
    .map((item) => asString(item))
    .filter(Boolean);

const normalizedHtml = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /<\/?[a-z][\s\S]*>/i.test(trimmed) ? trimmed : toSafeParagraph(trimmed);
};

export default function BuilderAIChat({ mode = 'drawer' }: { mode?: 'drawer' | 'panel' }) {
  const resumeData = useResumeStore();
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [messages, setMessages] = useState<ChatItem[]>([
    {
      role: 'assistant',
      text: 'Hi! I can review your resume and suggest practical improvements. Choose a quick action or ask your own question.',
    },
  ]);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const compactResumeContext = useMemo(
    () => ({
      basics: {
        name: resumeData.basics.name,
        label: resumeData.basics.label,
        summary: resumeData.basics.summary,
        objective: resumeData.basics.objective,
      },
      work: resumeData.work.slice(0, 3).map((item) => ({
        name: item.name,
        position: item.position,
        summary: item.summary,
        highlights: item.highlights?.slice(0, 4) || [],
      })),
      education: resumeData.education.slice(0, 2),
      skills: resumeData.skills,
    }),
    [resumeData]
  );

  const callAssistant = async (action: string, inputQuestion: string) => {
    setError('');
    setLoading(true);
    setAuthRequired(false);

    const userText =
      inputQuestion || quickActions.find((item) => item.action === action)?.label || action;
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);

    try {
      const response = await fetch('/api/ai/builder-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          question: inputQuestion,
          resumeData: compactResumeContext,
        }),
      });

      if (response.status === 401) {
        setAuthRequired(true);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: 'Please login or register to use AI features in the builder.',
          },
        ]);
        return;
      }

      const data = (await response.json()) as Partial<AssistantResult> & { message?: string };
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get AI response');
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer || 'I reviewed your resume.',
          suggestedChange: data.suggestedChange || '',
          targetField: data.targetField || 'none',
          cta: data.cta || '',
          resumePatch: data.resumePatch,
        },
      ]);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Unable to fetch AI suggestions'
      );
    } finally {
      setLoading(false);
    }
  };

  const applySuggestedChange = (message: ChatItem) => {
    const patch = asRecord(message.resumePatch);
    const hasFullPatch = Object.keys(patch).length > 0;

    if (hasFullPatch) {
      const basicsPatch = asRecord(patch.basics);
      if (Object.keys(basicsPatch).length) {
        const currentBasic = useBasicDetails.getState().values;
        useBasicDetails.getState().reset({
          ...currentBasic,
          ...basicsPatch,
          summary:
            asString(basicsPatch.summary).trim() !== ''
              ? normalizedHtml(asString(basicsPatch.summary))
              : currentBasic.summary,
          objective:
            asString(basicsPatch.objective).trim() !== ''
              ? normalizedHtml(asString(basicsPatch.objective))
              : currentBasic.objective,
        });
      }

      const workPatch = asArray(patch.work);
      if (workPatch.length) {
        useExperiences.getState().reset(
          workPatch.map((item, index) => {
            const work = asRecord(item);
            return {
              id: asString(work.id, String(index + 1)),
              name: asString(work.name),
              position: asString(work.position),
              url: asString(work.url),
              startDate: asString(work.startDate) || null,
              isWorkingHere: asBoolean(work.isWorkingHere),
              endDate: asString(work.endDate) || null,
              years: asString(work.years),
              summary: normalizedHtml(asString(work.summary)),
              highlights: asStringArray(work.highlights),
            };
          })
        );
      }

      const educationPatch = asArray(patch.education);
      if (educationPatch.length) {
        useEducations.getState().reset(
          educationPatch.map((item, index) => {
            const edu = asRecord(item);
            return {
              id: asString(edu.id, String(index + 1)),
              institution: asString(edu.institution),
              url: asString(edu.url),
              studyType: asString(edu.studyType),
              area: asString(edu.area),
              startDate: asString(edu.startDate) || null,
              isStudyingHere: asBoolean(edu.isStudyingHere),
              endDate: asString(edu.endDate) || null,
              score: asString(edu.score),
              courses: asStringArray(edu.courses),
            };
          })
        );
      }

      const skillsPatch = asRecord(patch.skills);
      if (Object.keys(skillsPatch).length) {
        const normalizeSkillList = (value: unknown) =>
          asArray(value).map((item) => {
            const skill = asRecord(item);
            return {
              name: asString(skill.name),
              level: Number(skill.level) || 3,
            };
          });

        if (asArray(skillsPatch.languages).length) {
          useLanguages.getState().reset(normalizeSkillList(skillsPatch.languages));
        }
        if (asArray(skillsPatch.frameworks).length) {
          useFrameworks.getState().reset(normalizeSkillList(skillsPatch.frameworks));
        }
        if (asArray(skillsPatch.technologies).length) {
          useTechnologies.getState().reset(normalizeSkillList(skillsPatch.technologies));
        }
        if (asArray(skillsPatch.libraries).length) {
          useLibraries.getState().reset(normalizeSkillList(skillsPatch.libraries));
        }
        if (asArray(skillsPatch.databases).length) {
          useDatabases.getState().reset(normalizeSkillList(skillsPatch.databases));
        }
        if (asArray(skillsPatch.practices).length) {
          usePractices.getState().reset(normalizeSkillList(skillsPatch.practices));
        }
        if (asArray(skillsPatch.tools).length) {
          useTools.getState().reset(normalizeSkillList(skillsPatch.tools));
        }
      }

      const awardsPatch = asArray(patch.awards);
      if (awardsPatch.length) {
        useAwards.getState().reset(
          awardsPatch.map((item, index) => {
            const award = asRecord(item);
            return {
              id: asString(award.id, String(index + 1)),
              title: asString(award.title),
              awarder: asString(award.awarder),
              date: asString(award.date) || null,
              summary: asString(award.summary),
            };
          })
        );
      }

      const volunteerPatch = asArray(patch.volunteer);
      if (volunteerPatch.length) {
        useVoluteeringStore.getState().reset(
          volunteerPatch.map((item, index) => {
            const volunteer = asRecord(item);
            return {
              id: asString(volunteer.id, String(index + 1)),
              organization: asString(volunteer.organization),
              position: asString(volunteer.position),
              url: asString(volunteer.url),
              startDate: asString(volunteer.startDate) || null,
              endDate: asString(volunteer.endDate) || null,
              summary: asString(volunteer.summary),
              highlights: asStringArray(volunteer.highlights),
              isVolunteeringNow: asBoolean(volunteer.isVolunteeringNow),
            };
          })
        );
      }

      const activitiesPatch = asRecord(patch.activities);
      if (Object.keys(activitiesPatch).length) {
        const currentActivities = useActivity.getState().activities;
        useActivity.getState().reset({
          involvements: asString(activitiesPatch.involvements, currentActivities.involvements),
          achievements: asString(activitiesPatch.achievements, currentActivities.achievements),
        });
      }

      return;
    }

    if (message.suggestedChange && message.targetField && message.targetField !== 'none') {
      const current = useBasicDetails.getState().values;
      const updated = {
        ...current,
        [message.targetField]: toSafeParagraph(message.suggestedChange),
      };
      useBasicDetails.getState().reset(updated);
    }
  };

  useEffect(() => {
    if (!messagesContainerRef.current) return;
    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
  }, [messages, isOpen, mode]);

  const chatContent = (
    <Box
      sx={{
        width: '100%',
        p: 2.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack spacing={1.5} sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>
          Builder AI Assistant
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ask resume questions, get targeted improvements, and apply suggestions in one click.
        </Typography>
      </Stack>

      <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
        {quickActions.map((item) => (
          <Chip
            key={item.action}
            label={item.label}
            icon={<MdAutoAwesome />}
            onClick={() => callAssistant(item.action, '')}
            clickable
            color="primary"
            variant="outlined"
          />
        ))}
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      ) : null}
      {authRequired ? (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          AI is available for registered users. <Link href="/login?next=/builder">Login</Link> or{' '}
          <Link href="/register?next=/builder">register</Link>.
        </Alert>
      ) : null}

      <Stack spacing={1.5} sx={{ flex: 1, overflowY: 'auto', pr: 0.5 }} ref={messagesContainerRef}>
        {messages.map((message, index) => (
          <Box
            key={`${message.role}-${index}`}
            sx={{
              alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '90%',
              px: 1.5,
              py: 1.2,
              borderRadius: 2,
              backgroundColor: message.role === 'user' ? 'resume.100' : 'grey.100',
            }}
          >
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {message.text}
            </Typography>
            {message.suggestedChange || message.resumePatch ? (
              <Box sx={{ mt: 1 }}>
                {message.suggestedChange ? (
                  <>
                    <Typography variant="caption" color="text.secondary">
                      Suggested text:
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                      {message.suggestedChange}
                    </Typography>
                  </>
                ) : null}
                {message.resumePatch ? (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.5, display: 'block' }}
                  >
                    Full resume patch ready. Click Apply for me to update the builder sections.
                  </Typography>
                ) : null}
                <Stack direction="row" gap={1} sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => applySuggestedChange(message)}
                    disabled={!message.resumePatch && message.targetField === 'none'}
                  >
                    Apply for me
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        message.suggestedChange ||
                          JSON.stringify(message.resumePatch || {}, null, 2)
                      )
                    }
                  >
                    Copy
                  </Button>
                </Stack>
                {message.cta ? (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    {message.cta}
                  </Typography>
                ) : null}
              </Box>
            ) : null}
          </Box>
        ))}
      </Stack>

      <Box
        component="form"
        sx={{ mt: 2, display: 'flex', gap: 1 }}
        onSubmit={(event) => {
          event.preventDefault();
          if (!question.trim()) return;
          callAssistant('custom_question', question.trim());
          setQuestion('');
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Ask a custom resume question..."
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Ask'}
        </Button>
      </Box>
    </Box>
  );

  if (mode === 'panel') {
    return (
      <div className="bg-resume-50 h-full text-resume-800 overflow-hidden shadow-level-4dp">
        {chatContent}
      </div>
    );
  }

  return (
    <>
      <Fab
        color="primary"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 print:hidden"
        aria-label="Open AI assistant"
      >
        <MdChat />
      </Fab>

      <Drawer anchor="right" open={isOpen} onClose={() => setIsOpen(false)}>
        <Box sx={{ width: { xs: 340, sm: 420 }, height: '100%' }}>{chatContent}</Box>
      </Drawer>
    </>
  );
}
