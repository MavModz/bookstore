"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { MoreDotIcon } from "@/icons";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import CountryMap from "./CountryMap";

interface LocationData {
  country: string;
  purchaseCount: number;
  latLng: [number, number];
  totalRevenue: number;
}

interface DemographicData {
  locations: LocationData[];
  hasPurchases: boolean;
}

export default function DemographicCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DemographicData>({
    locations: [],
    hasPurchases: false
  });

  useEffect(() => {
    const fetchDemographics = async () => {
      try {
        const response = await fetch('/api/dashboard/purchase-locations');
        if (!response.ok) throw new Error('Failed to fetch demographics');
        const responseData = await response.json();
        if (responseData.success) {
          setData(responseData.data);
        }
      } catch (error) {
        console.error('Error fetching demographics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDemographics();
  }, []);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  // Calculate total customers
  const totalCustomers = data.locations.reduce((sum, location) => sum + location.purchaseCount, 0);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Customers Demographic
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Number of customers based on country
          </p>
        </div>

        <div className="relative inline-block">
          <button onClick={toggleDropdown} className="dropdown-toggle">
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              View More
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Delete
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
      <div className="px-4 py-6 my-6 overflow-hidden border border-gary-200 rounded-2xl bg-gray-50 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
        <div
          id="mapOne"
          className="mapOne map-btn -mx-4 -my-6 h-[212px] w-[252px] 2xsm:w-[307px] xsm:w-[358px] sm:-mx-6 md:w-[668px] lg:w-[634px] xl:w-[393px] 2xl:w-[554px]"
        >
          <CountryMap />
        </div>
      </div>

      {loading ? (
        <div className="space-y-5">
          <div className="animate-pulse flex flex-col space-y-4">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      ) : !data.hasPurchases ? (
        <div className="text-center py-4">
          <p className="text-gray-500 dark:text-gray-400">
            Customer demographics will appear here once books are sold.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {data.locations.slice(0, 2).map((location) => {
            const percentage = Math.round((location.purchaseCount / totalCustomers) * 100);
            const flagCode = location.country.toLowerCase().substring(0, 2);
            
            return (
              <div key={location.country} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="items-center w-full rounded-full max-w-8">
                    <Image
                      width={48}
                      height={48}
                      src={`https://flagcdn.com/${flagCode}.svg`}
                      alt={location.country.toLowerCase()}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                      {location.country}
                    </p>
                    <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                      {location.purchaseCount.toLocaleString()} Customers
                    </span>
                  </div>
                </div>

                <div className="flex w-full max-w-[140px] items-center gap-3">
                  <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
                    <div
                      className="absolute left-0 top-0 flex h-full items-center justify-center rounded-sm bg-brand-500 text-xs font-medium text-white"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {percentage}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
