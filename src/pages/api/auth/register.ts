import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { authCookie, encryptText, hashPassword, signAuthToken } from '@/lib/security';

type UserDocument = {
  _id?: ObjectId;
  name: string;
  email: string;
  emailEncrypted: string;
  passwordHash: string;
  createdAt: Date;
};

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '')
    .toLowerCase()
    .trim();
  const password = String(req.body?.password || '');

  if (!name || !isValidEmail(email) || password.length < 8) {
    return res.status(400).json({
      message: 'Provide a valid name, email and password (minimum 8 chars).',
    });
  }

  const db = await getDb();
  const users = db.collection<UserDocument>('users');
  await users.createIndex({ email: 1 }, { unique: true });

  const existingUser = await users.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: 'Email already registered.' });
  }

  const passwordHash = await hashPassword(password);
  const result = await users.insertOne({
    name,
    email,
    emailEncrypted: encryptText(email),
    passwordHash,
    createdAt: new Date(),
  });

  const userId = result.insertedId.toHexString();
  const token = signAuthToken({ sub: userId, email, name });

  res.setHeader('Set-Cookie', authCookie(token));
  return res.status(201).json({
    user: { id: userId, name, email },
  });
}
