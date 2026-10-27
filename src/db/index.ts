import "dotenv/config";

import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

const globalForDb = globalThis as unknown as {
  client: postgres.Sql | undefined;
  db: PostgresJsDatabase<typeof schema> | undefined;
};

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = globalForDb.client ?? postgres(connectionString, { prepare: false });
if (process.env.NODE_ENV !== 'production') {
  globalForDb.client = client;
}

export const db = globalForDb.db ?? drizzle(client, { schema });
if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db;
}
