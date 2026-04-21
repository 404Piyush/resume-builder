import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { authCookie, signAuthToken, verifyPassword } from '@/lib/security';

type UserDocument = {
  _id?: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const email = String(req.body?.email || '')
    .toLowerCase()
    .trim();
  const password = String(req.body?.password || '');

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const db = await getDb();
  const users = db.collection<UserDocument>('users');
  const user = await users.findOne({ email });

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword || !user._id) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const token = signAuthToken({
    sub: user._id.toHexString(),
    email: user.email,
    name: user.name,
  });

  res.setHeader('Set-Cookie', authCookie(token));
  return res.status(200).json({
    user: { id: user._id.toHexString(), name: user.name, email: user.email },
  });
}
