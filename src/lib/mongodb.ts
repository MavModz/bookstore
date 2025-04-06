import mongoose from 'mongoose';

// Load environment variables
const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

// Connection state tracking
let isConnected = false;

/**
 * Connect to MongoDB
 */
export const connectToDatabase = async () => {
  // If already connected, return
  if (isConnected) {
    console.log('=> Using existing database connection');
    return;
  }

  try {
    // Set mongoose options
    const opts = {
      bufferCommands: true,
    };

    console.log('=> Connecting to MongoDB...');
    
    // Connect to database
    const db = await mongoose.connect(MONGODB_URI, opts);
    isConnected = !!db.connections[0].readyState;
    
    console.log('=> Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Alias for compatibility with imports that use dbConnect
const dbConnect = connectToDatabase;
export default dbConnect;

/**
 * Disconnect from MongoDB (useful for testing)
 */
export const disconnectFromDatabase = async () => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('=> Disconnected from MongoDB');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
}; 