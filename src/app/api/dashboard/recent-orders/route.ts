import { NextResponse } from 'next/server';
import { getAuthUser, isAdmin } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Book from '@/models/Book';
import mongoose from 'mongoose';

// Define types for the MongoDB document
type MongoDoc = {
  _id: mongoose.Types.ObjectId;
  [key: string]: any;
};

export async function GET() {
  try {
    // Get authenticated user
    const user = await getAuthUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Connect to database
    await dbConnect();
    
    // Build query based on user role
    const query: any = { purchasedAt: { $ne: null } };
    
    // If not admin, only show books for this vendor
    if (!isAdmin(user)) {
      query.vendor = user.id;
    }
    
    // Find books that have been purchased and sort by purchase date
    const purchasedBooks = await Book.find(query)
      .sort({ purchasedAt: -1 })
      .limit(5)
      .lean();
    
    // Format the response
    const formattedBooks = purchasedBooks.map((book: any) => ({
      id: book._id.toString(),
      name: book.title,
      category: book.category,
      price: book.price,
      image: book.coverImage || '/images/product/product-01.jpg',
      purchasedAt: book.purchasedAt,
      status: book.status || determineOrderStatus(book.purchasedAt)
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedBooks
    });

  } catch (error) {
    console.error('Error fetching recent orders:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch recent orders' 
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