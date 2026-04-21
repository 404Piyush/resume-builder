import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuthToken } from '@/lib/security';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const token = req.cookies.auth_token;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  return res.status(200).json({
    user: {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    },
  });
}
