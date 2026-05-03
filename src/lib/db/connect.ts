/**
 * MongoDB connection with connection pooling and singleton pattern.
 * Prevents "Too Many Connections" in serverless/edge environments.
 */
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not defined");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Use global to persist across hot-reloads in development
declare global {
  // eslint-disable-next-line no-var
  var __mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.__mongoose ?? { conn: null, promise: null };

if (!global.__mongoose) {
  global.__mongoose = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,           // maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,                 // use IPv4, skip IPv6
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      console.log("✅ MongoDB connected");
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export function disconnectDB(): Promise<void> {
  cached.conn = null;
  cached.promise = null;
  return mongoose.disconnect();
}

export default connectDB;
