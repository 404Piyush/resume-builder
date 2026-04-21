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

type RegisterResponse = {
  message?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const data = (await response.json()) as RegisterResponse;
        throw new Error(data.message || 'Registration failed');
      }

      await router.push(redirectPath);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to register');
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
              Create Account
            </Typography>
            <Typography color="text.secondary">
              Register to save progress and access AI resume enhancements.
            </Typography>

            {error ? <Alert severity="error">{error}</Alert> : null}

            <Box component="form" onSubmit={onSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Full name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
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
                  helperText="Minimum 8 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <Button variant="contained" type="submit" disabled={loading} sx={{ py: 1.2 }}>
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
                </Button>
              </Stack>
            </Box>

            <Typography>
              Already have an account?{' '}
              <MuiLink component={Link} href="/login" underline="hover">
                Login
              </MuiLink>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
