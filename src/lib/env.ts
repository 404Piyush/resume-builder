export const getRequiredEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const getOptionalEnv = (name: string, fallback = ''): string =>
  process.env[name] || fallback;

export const isProduction = process.env.NODE_ENV === 'production';
