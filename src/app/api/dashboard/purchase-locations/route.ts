import { NextResponse } from 'next/server';
import { getAuthUser, isAdmin } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Book from '@/models/Book';

interface PurchaseLocation {
  country: string;
  latLng: [number, number];
  purchaseCount: number;
  totalRevenue: number;
}

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

    // Build query
    const query: any = { 
      purchasedAt: { $ne: null },
      'purchaseLocation.country': { $exists: true } 
    };
    
    // If not admin, only show books for this vendor
    if (!isAdmin(user)) {
      query.vendor = user.id;
    }
    
    // Find purchased books with location data
    const purchasedBooks = await Book.find(query).lean();

    if (purchasedBooks.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          locations: [],
          hasPurchases: false
        }
      });
    }

    // Aggregate purchase data by country
    const locationMap = new Map<string, PurchaseLocation>();

    purchasedBooks.forEach(book => {
      if (book.purchaseLocation) {
        const { country, latLng } = book.purchaseLocation;
        const existing = locationMap.get(country);

        if (existing) {
          existing.purchaseCount++;
          existing.totalRevenue += book.price;
        } else {
          locationMap.set(country, {
            country,
            latLng,
            purchaseCount: 1,
            totalRevenue: book.price
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        locations: Array.from(locationMap.values()),
        hasPurchases: true
      }
    });

  } catch (error) {
    console.error('Error fetching purchase locations:', error);
    return NextResponse.json(
      { 
        success: false, 
        data: {
          locations: [],
          hasPurchases: false
        }
      }
    );
  }
} 