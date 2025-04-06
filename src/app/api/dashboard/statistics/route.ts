import { NextResponse } from 'next/server';
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
    
    // Get current year and month
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    // Initialize monthly data arrays
    const monthlySales = new Array(12).fill(0);
    const monthlyRevenue = new Array(12).fill(0);

    // Build query based on user role
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);
    
    // Create query for purchased books in the current year
    const query: any = {};
    
    // Add date range condition
    query.purchasedAt = {
      $ne: null,
      $gte: startOfYear,
      $lte: endOfYear
    };
    
    // If not admin, only show books for this vendor
    if (!isAdmin(user)) {
      query.vendor = user.id;
    }

    // Find purchased books
    const purchasedBooks = await Book.find(query).lean();

    // If no purchases, return zeros
    if (purchasedBooks.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          sales: {
            actual: monthlySales,
            target: monthlySales
          },
          revenue: {
            actual: monthlyRevenue,
            target: monthlyRevenue
          },
          currentMonth,
          hasSales: false
        }
      });
    }

    // Calculate monthly sales and revenue
    purchasedBooks.forEach((book) => {
      if (book.purchasedAt) {
        const purchaseDate = new Date(book.purchasedAt);
        const month = purchaseDate.getMonth();
        if (month <= currentMonth) {
          monthlySales[month]++;
          monthlyRevenue[month] += book.price;
        }
      }
    });

    // Calculate targets (20% higher than actual)
    const salesTarget = monthlySales.map(sales => Math.ceil(sales * 1.2));
    const revenueTarget = monthlyRevenue.map(revenue => Math.ceil(revenue * 1.2));

    return NextResponse.json({
      success: true,
      data: {
        sales: {
          actual: monthlySales,
          target: salesTarget
        },
        revenue: {
          actual: monthlyRevenue,
          target: revenueTarget
        },
        currentMonth,
        hasSales: true
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
} 