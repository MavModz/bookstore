import type { Metadata } from "next";
import { Outfit } from 'next/font/google';
import "./globals.css";
import { Toaster } from "react-hot-toast";

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kitabi Keeda - Admin Dashboard",
  description: "Book store online management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <SidebarProvider>
            {/* Debug link - only in development */}
            {process.env.NODE_ENV === 'development' && (
              <div style={{ position: 'fixed', bottom: '10px', right: '10px', zIndex: 9999 }}>
                <a 
                  href="/signin" 
                  style={{ 
                    background: '#333', 
                    color: 'white', 
                    padding: '8px 15px', 
                    borderRadius: '4px',
                    textDecoration: 'none',
                    fontSize: '14px'
                  }}
                >
                  Go to Sign In
                </a>
              </div>
            )}
            
            {children}
            <Toaster position="top-right" />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
