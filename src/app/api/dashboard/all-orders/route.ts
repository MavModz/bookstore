import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, isAdmin } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Book from '@/models/Book';
import mongoose from 'mongoose';

// Define types for the MongoDB document
type MongoDoc = {
  _id: mongoose.Types.ObjectId;
  [key: string]: any;
};

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Connect to database
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const startIndex = (page - 1) * limit;

    // Build query for purchased books
    const query: any = { purchasedAt: { $ne: null } };
    
    // If not admin, only show books for this vendor
    if (!isAdmin(user)) {
      query.vendor = user.id;
    }
    
    // Count total matching orders
    const totalOrders = await Book.countDocuments(query);
    
    // Find books with pagination
    const purchasedBooks = await Book.find(query)
      .sort({ purchasedAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .lean();
    
    // Format the orders for the response
    const orders = purchasedBooks.map((book: any) => ({
      id: book._id.toString(),
      name: book.title,
      category: book.category,
      price: book.price,
      image: book.coverImage,
      purchasedAt: new Date(book.purchasedAt),
      status: determineOrderStatus(new Date(book.purchasedAt))
    }));
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalOrders / limit);

    return NextResponse.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: page,
          totalPages,
          totalOrders,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch orders' 
      },
      { status: 500 }
    );
  }
}

// Helper function to determine order status based on purchase date
function determineOrderStatus(purchaseDate: Date): "Delivered" | "Pending" | "Canceled" {
  const now = new Date();
  const hoursSincePurchase = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60);
  
  if (hoursSincePurchase > 48) {
    return "Delivered";
  } else if (hoursSincePurchase > 24) {
    return Math.random() > 0.1 ? "Delivered" : "Canceled"; // 90% delivered, 10% canceled after 24h
  } else {
    return "Pending";
  }
} 