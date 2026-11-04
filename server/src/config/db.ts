import mongoose from 'mongoose';
import { ENV } from './env';

export interface DatabaseStatus {
  connected: boolean;
  state: 'disconnected' | 'connected' | 'connecting' | 'disconnecting' | 'uninitialized';
  host?: string;
  databaseName?: string;
  error?: string | null;
  lastChecked: string;
}

let connectionError: string | null = null;

const stateMap: Record<number, DatabaseStatus['state']> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export const connectDatabase = async (): Promise<boolean> => {
  if (!ENV.MONGODB_URI) {
    connectionError = 'MONGODB_URI is not defined in environment variables';
    console.warn('⚠️ [MongoDB] Warning: MONGODB_URI is not set. Database operations will return clear status errors until configured.');
    return false;
  }

  try {
    mongoose.set('strictQuery', true);
    console.log('🔄 [MongoDB] Connecting to database...');
    
    await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4 to prevent Windows OpenSSL IPv6 TLS handshake alert 80 errors
      maxPoolSize: 10,
    });

    connectionError = null;
    console.log(`✅ [MongoDB] Connected successfully to: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return true;
  } catch (err: any) {
    connectionError = err.message || 'Unknown MongoDB connection error';
    console.error(`❌ [MongoDB] Connection error: ${connectionError}`);
    return false;
  }
};

export const getDatabaseStatus = (): DatabaseStatus => {
  const readyState = mongoose.connection.readyState;
  const state = stateMap[readyState] || 'disconnected';
  const isConn = readyState === 1;

  return {
    connected: isConn,
    state,
    host: isConn ? mongoose.connection.host : undefined,
    databaseName: isConn ? mongoose.connection.name : undefined,
    error: isConn ? null : connectionError,
    lastChecked: new Date().toISOString(),
  };
};

mongoose.connection.on('connected', () => {
  connectionError = null;
  console.log(`✅ [MongoDB] Active connection established: ${mongoose.connection.host}`);
});

mongoose.connection.on('reconnected', () => {
  connectionError = null;
  console.log('🔄 [MongoDB] Reconnected successfully to Atlas cluster');
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ [MongoDB] Connection lost, attempting reconnection...');
});

mongoose.connection.on('error', (err) => {
  connectionError = err.message;
  console.error('❌ [MongoDB] Runtime error:', err.message);
});

