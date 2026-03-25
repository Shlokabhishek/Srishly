import { MongoClient, type Db } from 'mongodb';

import { ApiError } from './http';
import { validateEnvironment } from './validateEnv';

declare global {
  // eslint-disable-next-line no-var
  var __srishlyMongoClientPromise__: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var __srishlyMongoClientUri__: string | undefined;
}

function getMongoConfig() {
  validateEnvironment();

  const uri = process.env.MONGODB_URI?.trim();
  const dbName = process.env.MONGODB_DB_NAME?.trim() || 'srishly';

  if (!uri) {
    throw new ApiError(500, 'MongoDB is not configured. Add MONGODB_URI to your Vercel environment variables.');
  }

  if (uri.includes('<db_password>')) {
    throw new ApiError(500, 'MongoDB URI still contains <db_password>. Replace it with your real database user password.');
  }

  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    throw new ApiError(500, 'MongoDB URI format is invalid. It must start with mongodb:// or mongodb+srv://');
  }

  return { uri, dbName };
}

async function getMongoClient() {
  const { uri } = getMongoConfig();

  if (!global.__srishlyMongoClientPromise__ || global.__srishlyMongoClientUri__ !== uri) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      connectTimeoutMS: 4000,
      serverSelectionTimeoutMS: 4000,
      socketTimeoutMS: 8000,
    });

    global.__srishlyMongoClientUri__ = uri;
    global.__srishlyMongoClientPromise__ = client.connect().catch((error) => {
      global.__srishlyMongoClientPromise__ = undefined;
      global.__srishlyMongoClientUri__ = undefined;
      console.error('[api] MongoDB connection failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new ApiError(503, 'MongoDB connection failed. Check MONGODB_URI, Atlas IP access rules, and network access.');
    });
  }

  return global.__srishlyMongoClientPromise__;
}

export async function getDb(): Promise<Db> {
  const { dbName } = getMongoConfig();
  const client = await getMongoClient();
  return client.db(dbName);
}

export async function checkMongoHealth() {
  const db = await getDb();
  await db.command({ ping: 1 });

  return {
    dbName: db.databaseName,
  };
}
