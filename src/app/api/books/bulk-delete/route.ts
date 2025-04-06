import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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

const DB_FILE = path.join(process.cwd(), "src/data/books.json");

// Helper function to read the database
const readDB = (): Database => {
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return { books: [] };
  }
};

// Helper function to write to the database
const writeDB = (data: Database) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

export async function DELETE(request: Request) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid request. Expected an array of book IDs." },
        { status: 400 }
      );
    }

    const db = readDB();
    const initialCount = db.books.length;
    
    // Remove the books with matching IDs
    db.books = db.books.filter(book => !ids.includes(book.id));
    
    // Calculate how many books were actually deleted
    const deletedCount = initialCount - db.books.length;

    if (deletedCount === 0) {
      return NextResponse.json(
        { error: "No books found with the provided IDs." },
        { status: 404 }
      );
    }

    // Save the updated database
    writeDB(db);

    return NextResponse.json({
      message: `Successfully deleted ${deletedCount} book(s).`,
      deletedCount
    });
  } catch (error) {
    console.error("Error deleting books:", error);
    return NextResponse.json(
      { error: "Failed to delete books" },
      { status: 500 }
    );
  }
} 