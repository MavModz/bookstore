import { NextResponse } from "next/server";
import { getAuthUser, isAdmin } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Book from '@/models/Book';

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
    
    // Get current date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Initialize monthly sales array with zeros
    const monthlySales = new Array(12).fill(0);
    
    // Build query based on user role
    const query: any = { purchasedAt: { $ne: null } };
    
    // If not admin, only show books for this vendor
    if (!isAdmin(user)) {
      query.vendor = user.id;
    }
    
    // Add year filter for current year only
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);
    
    query.purchasedAt = {
      $gte: startOfYear,
      $lte: endOfYear
    };
    
    // Find all books purchased this year
    const purchasedBooks = await Book.find(query).lean();
    
    // Calculate sales for each month
    purchasedBooks.forEach((book) => {
      if (book.purchasedAt) {
        const purchaseDate = new Date(book.purchasedAt);
        const purchaseMonth = purchaseDate.getMonth();
        
        if (purchaseMonth <= currentMonth) {
          monthlySales[purchaseMonth] += book.price;
        }
      }
    });
    
    // Calculate total sales only for months that have occurred
    const totalSales = monthlySales.slice(0, currentMonth + 1).reduce((a, b) => a + b, 0);
    
    return NextResponse.json({
      success: true,
      data: {
        monthlySales,
        totalSales,
        currentMonth,
      },
    });
  } catch (error) {
    console.error("Error fetching monthly sales:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch monthly sales" },
      { status: 500 }
    );
  }
} 