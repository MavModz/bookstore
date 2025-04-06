import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Create response with success message
    const response = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );
    
    // Clear the token cookie by setting multiple deletion headers to ensure removal
    // across different environments
    const cookieExpiryDate = new Date(0).toUTCString();
    
    // Standard cookie clearing
    response.headers.set(
      "Set-Cookie",
      `token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Expires=${cookieExpiryDate}`
    );
    
    // Additional secure flag for production
    response.headers.append(
      "Set-Cookie", 
      `token=; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=0; Expires=${cookieExpiryDate}`
    );
    
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, message: "Error during logout" },
      { status: 500 }
    );
  }
} 