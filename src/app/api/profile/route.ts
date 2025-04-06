import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const DEFAULT_AVATAR = '/images/user/user-01.jpg'; // Updated default avatar path

// GET: Get user profile
export async function GET() {
  console.log("GET /api/profile - Processing request");
  try {
    // Get token from cookies - Next.js 15+ requires await before accessing cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    
    console.log("Token found:", token ? "Yes" : "No");
    
    if (!token) {
      console.log("No token found, returning error");
      return NextResponse.json({ 
        success: false, 
        message: "Authentication required"
      }, { status: 401 });
    }
    
    try {
      // Verify the token
      const decoded = verify(token, JWT_SECRET) as { id: string, email: string };
      console.log("Token verified, user email:", decoded.email);
      
      // Connect to database
      await dbConnect();
      console.log("Connected to database");
      
      // Find the user in the database by email
      const user = await User.findOne({ email: decoded.email });
      console.log("User found:", user ? "Yes" : "No");
      
      if (!user) {
        console.log("User not found in database");
        return NextResponse.json({ 
          success: false, 
          message: "User not found" 
        }, { status: 404 });
      }
      
      // Check if the avatar is the old default path and update it if needed
      if (!user.avatar || user.avatar === '/images/user/default-avatar.jpg') {
        console.log("Detected outdated avatar path, updating to new default");
        user.avatar = DEFAULT_AVATAR;
        // Save the updated avatar path to the database
        await user.save();
      }
      
      // Format user data according to profile component expectations
      const userData = {
        id: user._id.toString(),
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email,
        phone: user.phone || "",
        bio: user.bio || "No bio available",
        role: user.role || "user",
        company: user.company || "",
        location: user.location || "",
        address: {
          country: user.address?.country || "United States",
          cityState: `${user.address?.city || ""}, ${user.address?.state || ""}`,
          postalCode: user.address?.zipCode || "",
          taxId: "" // Our model doesn't have taxId, so leaving it empty
        },
        socialLinks: {
          facebook: user.social?.facebook || "",
          twitter: user.social?.twitter || "",
          linkedin: "", // Our model doesn't have linkedin, so leaving it empty
          instagram: user.social?.instagram || ""
        },
        avatar: user.avatar || DEFAULT_AVATAR
      };
      
      console.log("Returning user data from database");
      return NextResponse.json({ 
        success: true, 
        data: userData
      });
      
    } catch (verifyError) {
      console.error("Token verification error:", verifyError);
      return NextResponse.json({ 
        success: false, 
        message: "Invalid authentication token" 
      }, { status: 401 });
    }
    
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch profile data" },
      { status: 500 }
    );
  }
}

// PUT: Update user profile
export async function PUT(request: Request) {
  console.log("PUT /api/profile - Processing update request");
  try {
    const profile = await request.json();
    console.log("Profile update data received:", profile);
    
    // Get token from cookies - Next.js 15+ requires await before accessing cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    
    if (!token) {
      console.log("No token found, returning error");
      return NextResponse.json({ 
        success: false, 
        message: "Authentication required" 
      }, { status: 401 });
    }
    
    try {
      // Verify the token
      const decoded = verify(token, JWT_SECRET) as { id: string, email: string };
      console.log("Token verified for update, user email:", decoded.email);
      
      // Connect to database
      await dbConnect();
      
      // Find the user in the database by email
      const user = await User.findOne({ email: decoded.email });
      
      if (!user) {
        console.log("User not found in database for update");
        return NextResponse.json({ 
          success: false, 
          message: "User not found" 
        }, { status: 404 });
      }
      
      // Update user in database - only updating fields that are present in the request
      if (profile.firstName) user.firstName = profile.firstName;
      if (profile.lastName) user.lastName = profile.lastName;
      if (profile.phone) user.phone = profile.phone;
      if (profile.bio) user.bio = profile.bio;
      if (profile.company) user.company = profile.company;
      if (profile.location) user.location = profile.location;
      
      // Update address if provided
      if (profile.address) {
        user.address = {
          street: user.address?.street || "",
          city: profile.address.cityState?.split(',')[0]?.trim() || user.address?.city || "",
          state: profile.address.cityState?.split(',')[1]?.trim() || user.address?.state || "",
          zipCode: profile.address.postalCode || user.address?.zipCode || "",
          country: profile.address.country || user.address?.country || ""
        };
      }
      
      // Update social links if provided
      if (profile.socialLinks) {
        user.social = {
          facebook: profile.socialLinks.facebook || user.social?.facebook || "",
          twitter: profile.socialLinks.twitter || user.social?.twitter || "",
          instagram: profile.socialLinks.instagram || user.social?.instagram || ""
        };
      }
      
      await user.save();
      console.log("User updated in database");
      
      return NextResponse.json({ 
        success: true, 
        message: "Profile updated successfully",
        data: profile 
      });
      
    } catch (verifyError) {
      console.error("Token verification error during update:", verifyError);
      return NextResponse.json({ 
        success: false, 
        message: "Invalid authentication token" 
      }, { status: 401 });
    }
    
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update profile" },
      { status: 500 }
    );
  }
} 