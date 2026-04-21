import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getRequiredEnv, isProduction } from './env';

type AuthTokenPayload = {
  sub: string;
  email: string;
  name: string;
};

export const hashPassword = async (password: string) => bcrypt.hash(password, 12);

export const verifyPassword = async (password: string, hash: string) =>
  bcrypt.compare(password, hash);

export const signAuthToken = (payload: AuthTokenPayload) =>
  jwt.sign(payload, getRequiredEnv('AUTH_JWT_SECRET'), { expiresIn: '7d' });

export const verifyAuthToken = (token: string): AuthTokenPayload | null => {
  try {
    return jwt.verify(token, getRequiredEnv('AUTH_JWT_SECRET')) as AuthTokenPayload;
  } catch {
    return null;
  }
};

const resolveEncryptionKey = (): Buffer => {
  const ENCRYPTION_KEY = getRequiredEnv('ENCRYPTION_KEY');

  if (!/^[0-9a-fA-F]{64}$/.test(ENCRYPTION_KEY)) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes for AES-256-GCM)');
  }

  return Buffer.from(ENCRYPTION_KEY, 'hex');
};

export const encryptText = (plainText: string): string => {
  const key = resolveEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
};

export const decryptText = (cipherText: string): string => {
  const key = resolveEncryptionKey();
  const [ivHex, tagHex, encryptedHex] = cipherText.split(':');

  if (!ivHex || !tagHex || !encryptedHex) {
    throw new Error('Invalid encrypted payload');
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
};

export const authCookie = (token: string) =>
  [
    `auth_token=${token}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    'Max-Age=604800',
    isProduction ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');

export const clearAuthCookie = () =>
  ['auth_token=', 'HttpOnly', 'Path=/', 'SameSite=Lax', 'Max-Age=0', isProduction ? 'Secure' : '']
    .filter(Boolean)
    .join('; ');
