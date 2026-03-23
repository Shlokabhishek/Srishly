import { MongoClient, type Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'srishly';

if (!uri) {
  throw new Error('Missing MONGODB_URI. Add it to your Vercel project environment variables.');
}

declare global {
  // eslint-disable-next-line no-var
  var __srishlyMongoClientPromise__: Promise<MongoClient> | undefined;
}

const clientPromise: Promise<MongoClient> =
  global.__srishlyMongoClientPromise__ ??
  (() => {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
    });

    const connectionPromise = client.connect();
    global.__srishlyMongoClientPromise__ = connectionPromise;
    return connectionPromise;
  })();

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}
