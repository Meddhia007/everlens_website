import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

let lastFailureTime = 0;
const FAILURE_COOLDOWN_MS = 5000; // 5s cooldown before re-attempting if connection recently failed

/**
 * Connects to MongoDB with global connection caching to prevent multiple connections
 * across Next.js API routes and Server Components during development.
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable in your environment or .env.local');
  }

  // If already connected, return connection immediately
  if (mongoose.connection.readyState === 1 && cached && cached.conn) {
    return cached.conn;
  }

  // If connection recently failed, fail fast briefly (5s) instead of hanging
  if (Date.now() - lastFailureTime < FAILURE_COOLDOWN_MS) {
    throw new Error('MongoDB connection is in brief cooldown after recent failure. Whitelist your IP in MongoDB Atlas if persistent.');
  }

  if (cached && !cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000, // 8s tolerance for remote cloud Atlas connection & TLS handshake
      connectTimeoutMS: 8000,
      socketTimeoutMS: 15000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      lastFailureTime = 0; // Reset on success
      return mongooseInstance;
    });
  }

  try {
    if (cached && cached.promise) {
      cached.conn = await cached.promise;
    }
  } catch (error) {
    lastFailureTime = Date.now();
    if (cached) {
      cached.promise = null;
      cached.conn = null;
    }
    throw error;
  }

  if (!cached || !cached.conn) {
    lastFailureTime = Date.now();
    throw new Error('Failed to establish MongoDB connection.');
  }

  return cached.conn;
}

export default connectToDatabase;
