import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  price: number;
  description: string;
  category: string;
  coverImageUrl?: string;
  bookFileUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface Database {
  books: Book[];
}

const DB_PATH = path.join(process.cwd(), 'src/data/books.json');

// Read the database file
const readDB = (): Database => {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { books: [] };
  }
};

// Write to the database file
const writeDB = (data: Database) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// Generate a unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// GET /api/books
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const db = readDB();
    let filteredBooks = db.books;

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      filteredBooks = filteredBooks.filter(book => 
        book.title.toLowerCase().includes(searchLower) ||
        book.author.toLowerCase().includes(searchLower) ||
        book.isbn.toLowerCase().includes(searchLower) ||
        book.category.toLowerCase().includes(searchLower)
      );
    }

    // Calculate pagination
    const totalBooks = filteredBooks.length;
    const totalPages = Math.ceil(totalBooks / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // Get books for current page
    const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

    return NextResponse.json({
      books: paginatedBooks,
      pagination: {
        total: totalBooks,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}

// POST /api/books
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Extract book data from formData
    const bookData = {
      title: formData.get('title') as string,
      author: formData.get('author') as string,
      isbn: formData.get('isbn') as string,
      price: parseFloat(formData.get('price') as string),
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      coverImageUrl: formData.get('coverImageUrl') as string || undefined,
      bookFileUrl: formData.get('bookFileUrl') as string || undefined,
    };

    console.log('Received book data:', bookData);

    // Validate required fields
    if (!bookData.title || !bookData.author || !bookData.isbn || !bookData.price || !bookData.category) {
      console.error('Missing required fields:', {
        title: !bookData.title,
        author: !bookData.author,
        isbn: !bookData.isbn,
        price: !bookData.price,
        category: !bookData.category
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = readDB();

    // Check for duplicate ISBN
    const existingBook = db.books.find(book => book.isbn === bookData.isbn);
    if (existingBook) {
      return NextResponse.json(
        { error: `A book with ISBN ${bookData.isbn} already exists in the database` },
        { status: 400 }
      );
    }

    const newBook: Book = {
      ...bookData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    db.books.push(newBook);
    writeDB(db);
    
    console.log('Book added successfully:', newBook);
    return NextResponse.json(newBook);
  } catch (error) {
    console.error('Error adding book:', error);
    return NextResponse.json(
      { error: 'Failed to add book' },
      { status: 500 }
    );
  }
}

// PUT /api/books/:id
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const db = readDB();
    const index = db.books.findIndex(book => book.id === params.id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }
    
    db.books[index] = {
      ...db.books[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    writeDB(db);
    return NextResponse.json(db.books[index]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update book' },
      { status: 500 }
    );
  }
}

// DELETE /api/books/:id
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = readDB();
    const initialLength = db.books.length;
    
    db.books = db.books.filter(book => book.id !== params.id);
    
    if (db.books.length === initialLength) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }
    
    writeDB(db);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete book' },
      { status: 500 }
    );
  }
} 