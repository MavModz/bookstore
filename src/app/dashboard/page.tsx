'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminDashboard from '../(admin)/page';

export default function Dashboard() {
  const router = useRouter();
  
  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/profile');
        if (!response.ok) {
          // If not authenticated, redirect to sign in
          router.push('/signin');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/signin');
      }
    };
    
    checkAuth();
  }, [router]);

  // Render the same content as the admin dashboard
  return <AdminDashboard />;
} 