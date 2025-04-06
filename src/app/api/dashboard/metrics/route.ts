import { NextResponse } from 'next/server';
import { getAuthUser, isAdmin } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Book from '@/models/Book';
import User from '@/models/User';

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

    // Build base query for books
    const baseQuery: any = {};
    
    // If not admin, only show books for this vendor
    if (!isAdmin(user)) {
      baseQuery.vendor = user.id;
    }
    
    // Get total books (available and sold)
    const totalBooks = await Book.countDocuments(baseQuery);
    
    // Get previous period books count for comparison
    const pastMonthDate = new Date();
    pastMonthDate.setMonth(pastMonthDate.getMonth() - 1);
    
    const pastMonthQuery = { 
      ...baseQuery, 
      createdAt: { $lt: pastMonthDate } 
    };
    
    const pastMonthBooks = await Book.countDocuments(pastMonthQuery);
    
    // Calculate books growth rate
    const booksGrowth = pastMonthBooks > 0 
      ? ((totalBooks - pastMonthBooks) / pastMonthBooks) * 100 
      : (totalBooks > 0 ? 100 : 0);
    
    // Get total users (if admin) or just use 1 for vendor
    let totalUsers = 0;
    let usersGrowth = 0;
    
    if (isAdmin(user)) {
      totalUsers = await User.countDocuments({ role: 'user' });
      
      // Get previous period users for comparison
      const pastMonthUsers = await User.countDocuments({ 
        role: 'user',
        createdAt: { $lt: pastMonthDate }
      });
      
      usersGrowth = pastMonthUsers > 0 
        ? ((totalUsers - pastMonthUsers) / pastMonthUsers) * 100 
        : (totalUsers > 0 ? 100 : 0);
    } else {
      // For vendors, just show count of customers who bought their books
      const uniqueCustomers = await Book.distinct('purchasedBy', { 
        ...baseQuery, 
        purchasedAt: { $ne: null },
        purchasedBy: { $exists: true }
      });
      
      totalUsers = uniqueCustomers.length;
      usersGrowth = 0; // Mock growth for now
    }
    
    // Calculate total revenue from purchased books
    const purchasedBooksQuery = { ...baseQuery, purchasedAt: { $ne: null } };
    const purchasedBooks = await Book.find(purchasedBooksQuery).lean();
    
    const totalRevenue = purchasedBooks.reduce((sum, book) => sum + (book.price || 0), 0);
    
    // Get previous month's revenue for comparison
    const prevMonthStart = new Date();
    prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
    prevMonthStart.setDate(1);
    prevMonthStart.setHours(0, 0, 0, 0);
    
    const prevMonthEnd = new Date();
    prevMonthEnd.setDate(0); // Last day of previous month
    prevMonthEnd.setHours(23, 59, 59, 999);
    
    const prevMonthQuery = {
      ...baseQuery,
      purchasedAt: {
        $gte: prevMonthStart,
        $lte: prevMonthEnd
      }
    };
    
    const prevMonthBooks = await Book.find(prevMonthQuery).lean();
    const prevMonthRevenue = prevMonthBooks.reduce((sum, book) => sum + (book.price || 0), 0);
    
    const revenueGrowth = prevMonthRevenue > 0 
      ? ((totalRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 
      : (totalRevenue > 0 ? 100 : 0);
    
    // Calculate average order value
    const avgOrderValue = purchasedBooks.length > 0 ? totalRevenue / purchasedBooks.length : 0;
    
    // For avg order growth, compare with previous month's average
    const prevMonthAvg = prevMonthBooks.length > 0 ? prevMonthRevenue / prevMonthBooks.length : 0;
    const avgOrderGrowth = prevMonthAvg > 0 
      ? ((avgOrderValue - prevMonthAvg) / prevMonthAvg) * 100 
      : (avgOrderValue > 0 ? 100 : 0);

    return NextResponse.json({
      metrics: {
        books: {
          total: totalBooks,
          growth: booksGrowth.toFixed(2)
        },
        users: {
          total: totalUsers,
          growth: usersGrowth.toFixed(2)
        },
        revenue: {
          total: totalRevenue.toFixed(2),
          growth: revenueGrowth.toFixed(2)
        },
        avgOrder: {
          value: avgOrderValue.toFixed(2),
          growth: avgOrderGrowth.toFixed(2)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    // Return zero values instead of error
    return NextResponse.json({
      metrics: {
        books: {
          total: 0,
          growth: "0.00"
        },
        users: {
          total: 0,
          growth: "0.00"
        },
        revenue: {
          total: "0.00",
          growth: "0.00"
        },
        avgOrder: {
          value: "0.00",
          growth: "0.00"
        }
      }
    });
  }
} 