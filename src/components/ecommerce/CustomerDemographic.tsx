"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";

interface LocationData {
  country: string;
  purchaseCount: number;
  latLng: [number, number];
  totalRevenue: number;
}

interface CountryData {
  country: string;
  customerCount: number;
  percentage: number;
  flagCode: string;
}

interface DemographicData {
  countries: CountryData[];
  totalCustomers: number;
  hasPurchases: boolean;
}

export default function CustomerDemographic() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DemographicData>({
    countries: [],
    totalCustomers: 0,
    hasPurchases: false
  });

  useEffect(() => {
    const fetchDemographics = async () => {
      try {
        const response = await fetch('/api/dashboard/purchase-locations');
        if (!response.ok) throw new Error('Failed to fetch demographics');
        const responseData = await response.json();
        
        if (responseData.success && responseData.data.locations.length > 0) {
          // Calculate total customers
          const totalCustomers = responseData.data.locations.reduce(
            (sum: number, location: LocationData) => sum + location.purchaseCount, 
            0
          );

          // Calculate percentages and create country data
          const countries = responseData.data.locations.map((location: LocationData) => ({
            country: location.country,
            customerCount: location.purchaseCount,
            percentage: Math.round((location.purchaseCount / totalCustomers) * 100),
            flagCode: location.country.toLowerCase().substring(0, 2)
          }));

          // Sort by customer count in descending order
          countries.sort((a: CountryData, b: CountryData) => b.customerCount - a.customerCount);

          setData({
            countries,
            totalCustomers,
            hasPurchases: true
          });
        } else {
          setData({
            countries: [],
            totalCustomers: 0,
            hasPurchases: false
          });
        }
      } catch (error) {
        console.error('Error fetching demographics:', error);
        setData({
          countries: [],
          totalCustomers: 0,
          hasPurchases: false
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDemographics();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Customers Demographic
          </h3>
          <button className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Number of customers based on country
        </p>
        <div className="animate-pulse flex flex-col space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Customers Demographic
        </h3>
        <button className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
          </svg>
        </button>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Number of customers based on country
      </p>

      {!data.hasPurchases ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            Customer demographics will appear here once books are sold.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {data.countries.map((country) => (
            <div key={country.country} className="flex items-center gap-4">
              <div className="flex items-center gap-3 w-[140px]">
                <Image
                  src={`https://flagcdn.com/${country.flagCode}.svg`}
                  alt={country.country}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {country.country}
                </span>
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {country.customerCount} Customers
                </div>
                <div className="relative h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="absolute left-0 top-0 h-2 rounded-full bg-primary"
                    style={{ width: `${country.percentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="w-12 text-right">
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {country.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 