"use client";
import React, { useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import FileInput from "@/components/form/input/FileInput";
import Select from "@/components/form/Select";
import { ChevronDownIcon, DownloadIcon } from "@/icons";
import Form from "@/components/form/Form";

export default function UploadBook() {
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    price: "",
    description: "",
    category: "",
    coverImage: null as File | null,
    bookFile: null as File | null,
  });

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>('single');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const categories = [
    { value: "fiction", label: "Fiction" },
    { value: "non-fiction", label: "Non-Fiction" },
    { value: "children", label: "Children's Books" },
    { value: "textbook", label: "Textbooks" },
    { value: "other", label: "Other" },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'coverImage' | 'bookFile') => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, [field]: file }));
    }
  };

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
    } else {
      setMessage({ type: 'error', text: 'Please upload a valid CSV file' });
    }
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      if (uploadMode === 'single') {
        // Create FormData for file upload
        const formDataToSend = new FormData();
        
        // Add text fields
        Object.entries(formData).forEach(([key, value]) => {
          if (value !== null && key !== 'coverImage' && key !== 'bookFile') {
            formDataToSend.append(key, value);
          }
        });

        // Add files if they exist
        if (formData.coverImage) {
          formDataToSend.append('coverImage', formData.coverImage);
        }
        if (formData.bookFile) {
          formDataToSend.append('bookFile', formData.bookFile);
        }

        console.log('Submitting form data:', Object.fromEntries(formDataToSend));

        const response = await fetch('/api/books', {
          method: 'POST',
          body: formDataToSend,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to upload book');
        }

        const result = await response.json();
        console.log('Upload successful:', result);

        setMessage({ type: 'success', text: 'Book uploaded successfully!' });
        resetForm(); // Reset form after successful upload
      } else {
        // Bulk upload mode
        if (!csvFile) {
          throw new Error('Please upload a CSV file');
        }

        const formDataToSend = new FormData();
        formDataToSend.append('file', csvFile);

        const response = await fetch('/api/books/bulk', {
          method: 'POST',
          body: formDataToSend,
        });

        const result = await response.json();

        if (!response.ok) {
          // Handle different error formats
          let errorMessage = result.error || 'Failed to upload books';
          
          // If there are details, append them to the error message
          if (result.details) {
            // Check if details is an array or string
            if (Array.isArray(result.details)) {
              errorMessage += '\n' + result.details.map((error: { row: number; error: string }) => 
                `Row ${error.row}: ${error.error}`
              ).join('\n');
            } else {
              errorMessage += '\n' + result.details;
            }
          }
          
          throw new Error(errorMessage);
        }

        setMessage({ 
          type: 'success', 
          text: result.message || 'Books uploaded successfully!' 
        });
        
        // Reset CSV file input and form
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        setCsvFile(null);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to upload book(s)' 
      });
      
      // Reset CSV file input on error
      if (uploadMode === 'bulk') {
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        setCsvFile(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadSampleCsv = () => {
    const headers = ['title', 'author', 'isbn', 'price', 'category', 'description'];
    const sampleData = [
      ['The Great Gatsby', 'F. Scott Fitzgerald', '978-0743273565', '499', 'fiction', 'A story of decadence and excess.'],
      ['1984', 'George Orwell', '978-0451524935', '699', 'fiction', 'A dystopian social science fiction novel.']
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_books.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    console.log('Resetting form...');
    setFormData({
      title: "",
      author: "",
      isbn: "",
      price: "",
      description: "",
      category: "",
      coverImage: null,
      bookFile: null,
    });
    setCsvFile(null);
    console.log('Form reset complete');
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Upload Book" />
      <div className="grid grid-cols-1 gap-6">
        <ComponentCard title="Book Details">
          {message && (
            <div className={`mb-4 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-success-50 text-success-800 dark:bg-success-900/30 dark:text-success-400' 
                : 'bg-error-50 text-error-800 dark:bg-error-900/30 dark:text-error-400'
            }`}>
              {message.text}
            </div>
          )}
          
          <div className="mb-6 flex items-center justify-between">
            <div className="flex gap-4">
              <button
                onClick={() => setUploadMode('single')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  uploadMode === 'single'
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                Single Upload
              </button>
              <button
                onClick={() => setUploadMode('bulk')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  uploadMode === 'bulk'
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                Bulk Upload
              </button>
            </div>
            {uploadMode === 'bulk' && (
              <button
                onClick={downloadSampleCsv}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
              >
                <DownloadIcon className="w-4 h-4" />
                Download Sample CSV
              </button>
            )}
          </div>

          <Form onSubmit={handleSubmit} className="space-y-6">
            {uploadMode === 'single' ? (
              <>
                <div>
                  <Label>Book Title</Label>
                  <Input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter book title"
                  />
                </div>

                <div>
                  <Label>Author</Label>
                  <Input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    placeholder="Enter author name"
                  />
                </div>

                <div>
                  <Label>ISBN</Label>
                  <Input
                    type="text"
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleInputChange}
                    placeholder="Enter ISBN number"
                  />
                </div>

                <div>
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="Enter book price in Indian Rupees"
                    min="0"
                    step={1}
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Enter price in Indian Rupees (₹). Example: 499
                  </p>
                </div>

                <div>
                  <Label>Category</Label>
                  <div className="relative">
                    <Select
                      options={categories}
                      placeholder="Select category"
                      onChange={handleCategoryChange}
                      className="dark:bg-dark-900"
                    />
                    <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                      <ChevronDownIcon />
                    </span>
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <TextArea
                    value={formData.description}
                    onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                    rows={6}
                    placeholder="Enter book description"
                  />
                </div>

                <div>
                  <Label>Cover Image</Label>
                  <FileInput
                    onChange={(e) => handleFileChange(e, 'coverImage')}
                  />
                </div>

                <div>
                  <Label>Book File (PDF)</Label>
                  <FileInput
                    onChange={(e) => handleFileChange(e, 'bookFile')}
                  />
                </div>
              </>
            ) : (
              <div>
                <Label>Upload CSV File</Label>
                <div className="mt-2">
                  <FileInput
                    onChange={handleCsvChange}
                  />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Upload a CSV file containing book details. The CSV should include columns for title, author, ISBN, price (in Indian Rupees), category, and description.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`bg-brand-500 hover:bg-brand-600 text-white font-medium py-2 px-4 rounded-lg transition-colors ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Uploading...' : uploadMode === 'single' ? 'Upload Book' : 'Upload Books'}
              </button>
            </div>
          </Form>
        </ComponentCard>
      </div>
    </div>
  );
} 