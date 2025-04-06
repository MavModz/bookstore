"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { MoreDotIcon } from "@/icons";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useState, useEffect, useRef } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface MonthlySalesData {
  monthlySales: number[];
  totalSales: number;
  currentMonth: number;
}

export default function MonthlySalesChart() {
  const [salesData, setSalesData] = useState<MonthlySalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Check if we're in the browser
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  useEffect(() => {
    const fetchMonthlySales = async () => {
      try {
        const response = await fetch('/api/dashboard/monthly-sales');
        if (!response.ok) throw new Error('Failed to fetch monthly sales');
        const data = await response.json();
        setSalesData(data.data);
      } catch (error) {
        console.error('Error fetching monthly sales:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlySales();
  }, []);

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: Array(12).fill('#64748b').map((color, index) => 
            salesData && index > salesData.currentMonth ? '#ccc' : color
          )
        }
      }
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: {
      title: {
        text: undefined,
      },
      labels: {
        formatter: (value: number) => `₹${value.toLocaleString('en-IN')}`,
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
      colors: Array(12).fill('#465fff').map((color, index) => 
        salesData && index > salesData.currentMonth ? '#f1f5f9' : color
      )
    },
    tooltip: {
      x: {
        show: false,
      },
      y: {
        formatter: (val: number) => `₹${val.toLocaleString('en-IN')}`,
      },
    },
  };

  const series = [
    {
      name: "Sales",
      data: salesData?.monthlySales || Array(12).fill(0),
    },
  ];

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  // Render the chart content
  const renderChart = () => {
    if (!isBrowser) {
      return (
        <div className="h-[180px] flex items-center justify-center">
          <div className="text-gray-400">Chart is loading...</div>
        </div>
      );
    }

    if (!hasSales) {
      return (
        <div className="h-[180px] flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <p>No sales data available</p>
            <p className="text-sm mt-1">Sales will appear here when books are purchased</p>
          </div>
        </div>
      );
    }

    return (
      <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2" ref={chartRef}>
        {chartRef.current && (
          <ReactApexChart
            options={options}
            series={series}
            type="bar"
            height={180}
            width="100%"
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Monthly Sales
          </h3>
          <MoreDotIcon className="text-gray-400" />
        </div>
        <div className="h-[180px] flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  // Check if there are any sales
  const hasSales = salesData?.monthlySales.some(sale => sale > 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Monthly Sales
        </h3>

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

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        {renderChart()}
      </div>
    </div>
  );
}
