import { FormEvent, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Link as MuiLink,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';

type LoginResponse = {
  message?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const nextPath = typeof router.query.next === 'string' ? router.query.next : '/builder';
  const redirectPath = nextPath.startsWith('/') ? nextPath : '/builder';

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = (await response.json()) as LoginResponse;
        throw new Error(data.message || 'Login failed');
      }

      await router.push(redirectPath);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <Card sx={{ width: '100%', borderRadius: 3, boxShadow: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Typography variant="h4" fontWeight={700}>
              Welcome Back
            </Typography>
            <Typography color="text.secondary">
              Login to continue building and improving your resume.
            </Typography>

            {error ? <Alert severity="error">{error}</Alert> : null}

            <Box component="form" onSubmit={onSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <TextField
                  label="Password"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <Button variant="contained" type="submit" disabled={loading} sx={{ py: 1.2 }}>
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
                </Button>
              </Stack>
            </Box>

            <Typography>
              New here?{' '}
              <MuiLink component={Link} href="/register" underline="hover">
                Create an account
              </MuiLink>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
