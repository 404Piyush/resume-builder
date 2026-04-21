import { FormEvent, useState } from 'react';
import type { GetServerSideProps } from 'next';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { verifyAuthToken } from '@/lib/security';

type AIResponse = {
  improvedText?: string;
  message?: string;
};

const toneOptions = ['professional', 'impactful', 'concise'];

export default function AIAssistantPage() {
  const [tone, setTone] = useState('professional');
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, tone }),
      });
      const data = (await response.json()) as AIResponse;

      if (!response.ok) {
        throw new Error(data.message || 'Unable to process AI request');
      }

      setResult(data.improvedText || '');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'AI enhancement failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Stack spacing={3}>
        <Typography variant="h4" fontWeight={700}>
          AI Resume Assistant
        </Typography>
        <Typography color="text.secondary">
          Paste any resume line, summary, or experience block and get a stronger version instantly.
        </Typography>

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
          <CardContent>
            <Box component="form" onSubmit={onSubmit}>
              <Stack spacing={2}>
                <TextField
                  select
                  label="Tone"
                  value={tone}
                  onChange={(event) => setTone(event.target.value)}
                >
                  {toneOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  multiline
                  minRows={8}
                  label="Resume content"
                  placeholder="Example: Built and deployed scalable cloud-native apps for 10k+ users..."
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                />
                <Button variant="contained" type="submit" disabled={loading} sx={{ py: 1.2 }}>
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Enhance with AI'}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {result ? (
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Improved Output
              </Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>{result}</Typography>
            </CardContent>
          </Card>
        ) : null}
      </Stack>
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const token = context.req.cookies.auth_token;
  const payload = token ? verifyAuthToken(token) : null;

  if (!payload) {
    return {
      redirect: {
        destination: '/login?next=/ai-assistant',
        permanent: false,
      },
    };
  }

  return { props: {} };
};
