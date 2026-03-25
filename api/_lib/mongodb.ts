import { MongoClient, type Db } from 'mongodb';

import { ApiError } from './http';

declare global {
  // eslint-disable-next-line no-var
  var __srishlyMongoClientPromise__: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var __srishlyMongoClientUri__: string | undefined;
}

function getMongoConfig() {
  const uri = process.env.MONGODB_URI?.trim();
  const dbName = process.env.MONGODB_DB_NAME?.trim() || 'srishly';

  if (!uri) {
    throw new ApiError(500, 'MongoDB is not configured. Add MONGODB_URI to your Vercel environment variables.');
  }

  return { uri, dbName };
}

async function getMongoClient() {
  const { uri } = getMongoConfig();

  if (!global.__srishlyMongoClientPromise__ || global.__srishlyMongoClientUri__ !== uri) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    global.__srishlyMongoClientUri__ = uri;
    global.__srishlyMongoClientPromise__ = client.connect().catch(() => {
      global.__srishlyMongoClientPromise__ = undefined;
      global.__srishlyMongoClientUri__ = undefined;
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
