import { createApiError } from './http';
import { validateEnvironment } from './validateEnv';

interface MongoCollectionLike<T extends { id: string }> {
  countDocuments: () => Promise<number>;
  insertMany: (docs: T[]) => Promise<unknown>;
  insertOne: (doc: T) => Promise<unknown>;
  find: (
    filter?: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => {
    sort: (spec: Record<string, 1 | -1>) => {
      toArray: () => Promise<T[]>;
    };
  };
  findOne: (filter: Record<string, unknown>, options?: Record<string, unknown>) => Promise<T | null>;
  findOneAndUpdate: (
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => Promise<T | null>;
}

interface MongoDbLike {
  command: (cmd: Record<string, unknown>) => Promise<unknown>;
  databaseName: string;
  collection: <T extends { id: string }>(name: string) => MongoCollectionLike<T>;
}

interface MongoClientLike {
  db: (name: string) => MongoDbLike;
}

declare global {
  // eslint-disable-next-line no-var
  var __srishlyMongoClientPromise__: Promise<MongoClientLike> | undefined;
  // eslint-disable-next-line no-var
  var __srishlyMongoClientUri__: string | undefined;
}

function getMongoConfig() {
  validateEnvironment();

  const uri = process.env.MONGODB_URI?.trim();
  const dbName = process.env.MONGODB_DB_NAME?.trim() || 'srishly';

  if (!uri) {
    throw createApiError(500, 'MongoDB is not configured. Add MONGODB_URI to your Vercel environment variables.');
  }

  if (uri.includes('<db_password>')) {
    throw createApiError(500, 'MongoDB URI still contains <db_password>. Replace it with your real database user password.');
  }

  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    throw createApiError(500, 'MongoDB URI format is invalid. It must start with mongodb:// or mongodb+srv://');
  }

  return { uri, dbName };
}

async function getMongoClient() {
  const { uri } = getMongoConfig();

  let MongoClientConstructor: {
    new (connectionUri: string, options?: Record<string, unknown>): { connect: () => Promise<MongoClientLike> };
  };

  try {
    const mongodbModule = await import('mongodb');
    if (typeof mongodbModule.MongoClient !== 'function') {
      throw new Error('MongoClient export is unavailable.');
    }

    MongoClientConstructor = mongodbModule.MongoClient as typeof MongoClientConstructor;
  } catch (error) {
    console.error('[api] MongoDB driver import failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw createApiError(500, 'MongoDB driver failed to load in the serverless runtime.');
  }

  if (!global.__srishlyMongoClientPromise__ || global.__srishlyMongoClientUri__ !== uri) {
    const client = new MongoClientConstructor(uri, {
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
      throw createApiError(503, 'MongoDB connection failed. Check MONGODB_URI, Atlas IP access rules, and network access.');
    });
  }

  return global.__srishlyMongoClientPromise__;
}

export async function getDb(): Promise<MongoDbLike> {
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
