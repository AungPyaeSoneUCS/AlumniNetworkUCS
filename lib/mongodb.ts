// file: lib/mongodb.ts

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please add MONGODB_URI to your environment variables");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Ensure TypeScript knows about the global cache variable
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache;
}

// Initialize the cache globally
let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectDB() {
  // Return the cached connection if it exists and is fully connected (readyState 1)
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, 
      connectTimeoutMS: 10000,        
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("Failed to connect to MongoDB:", e);
    throw e;
  }

  return cached.conn;
}