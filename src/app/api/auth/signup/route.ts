import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";

// Log environment variables
console.log('API Route Environment Variables:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`MONGODB_URI defined: ${!!process.env.MONGODB_URI}`);
console.log(`MONGODB_URI from env: ${process.env.MONGODB_URI?.substring(0, 15)}...`);
console.log(`JWT_SECRET defined: ${!!process.env.JWT_SECRET}`);

export async function POST(request: Request) {
  try {
    console.log("Signup process started");
    
    // Log MongoDB connection state
    console.log("Initial Mongoose connection state:", mongoose.connection.readyState);
    console.log("MongoDB URI:", process.env.MONGODB_URI ? "Defined" : "Not defined");
    
    const body = await request.json();
    console.log("Request body received:", JSON.stringify(body));
    
    const { firstName, lastName, email, password, role = "user" } = body;

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      console.log("Missing required fields:", { firstName, lastName, email, password: password ? "provided" : "missing" });
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Connect to database
    console.log("Connecting to database...");
    await connectToDatabase();
    console.log("Connected to database");
    console.log("Mongoose connection state after connect:", mongoose.connection.readyState);

    // Check if user already exists
    console.log("Checking if email already exists:", email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Email already in use:", email);
      return NextResponse.json(
        { success: false, message: "Email already in use" },
        { status: 409 }
      );
    }
    console.log("Email is available for registration");

    // Hash password
    console.log("Hashing password...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("Password hashed successfully");

    // Create user data
    const userData = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: ["user", "vendor", "admin"].includes(role) ? role : "user",
    };
    console.log("User data prepared:", { ...userData, password: "[hidden]" });
    
    // Log collection information
    const collections = Object.keys(mongoose.connection.collections);
    console.log("Database collections before create:", collections);
    
    // Create new user
    console.log("Creating new user...");
    try {
      const newUser = new User(userData);
      console.log("User model instance created");
      
      const savedUser = await newUser.save();
      console.log("User saved with ID:", savedUser._id.toString());
      
      // Verify user was created
      const verifyUser = await User.findById(savedUser._id);
      console.log("User verification:", verifyUser ? "Success" : "Failed");
      
      // Return success response
      return NextResponse.json(
        {
          success: true,
          message: "User registered successfully",
          data: {
            id: savedUser._id,
            firstName: savedUser.firstName,
            lastName: savedUser.lastName,
            email: savedUser.email,
            role: savedUser.role,
          },
        },
        { status: 201 }
      );
    } catch (createError) {
      console.error("User creation error:", createError);
      if (createError instanceof Error) {
        console.error("Creation error name:", createError.name);
        console.error("Creation error message:", createError.message);
      }
      throw createError;
    }
  } catch (error) {
    console.error("Signup error details:", error);
    
    // Log additional details about the error
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { 
          success: false, 
          message: "Validation error", 
          errors: validationErrors 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to register user",
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
} 