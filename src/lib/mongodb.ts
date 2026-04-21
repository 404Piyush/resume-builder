import { MongoClient, ServerApiVersion } from 'mongodb';
import { getOptionalEnv, getRequiredEnv } from './env';

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

const clientOptions = {
  appName: 'ResumeBuilder',
  maxPoolSize: 10,
  minPoolSize: 1,
  retryWrites: true,
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

const client = new MongoClient(getRequiredEnv('MONGO_URI'), clientOptions);

const clientPromise = global.__mongoClientPromise || client.connect();
global.__mongoClientPromise = clientPromise;

export const getDb = async () => {
  const connectedClient = await clientPromise;
  return connectedClient.db(getOptionalEnv('MONGO_DB_NAME', 'resume_builder'));
};
