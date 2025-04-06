"use client";
import React, { useEffect, useState, useRef } from "react";
// import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import ChartTab from "../common/ChartTab";
import dynamic from "next/dynamic";

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface StatisticsData {
  sales: {
    actual: number[];
    target: number[];
  };
  revenue: {
    actual: number[];
    target: number[];
  };
  currentMonth: number;
  hasSales: boolean;
}

export default function StatisticsChart() {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sales' | 'revenue'>('sales');
  const [isBrowser, setIsBrowser] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Check if we're in the browser
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch('/api/dashboard/statistics');
        if (!response.ok) throw new Error('Failed to fetch statistics');
        const data = await response.json();
        if (data.success) {
          setStatistics(data.data);
        } else {
          // If API returns error, set empty data
          setStatistics({
            sales: { actual: new Array(12).fill(0), target: new Array(12).fill(0) },
            revenue: { actual: new Array(12).fill(0), target: new Array(12).fill(0) },
            currentMonth: new Date().getMonth(),
            hasSales: false
          });
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
        // On error, set empty data
        setStatistics({
          sales: { actual: new Array(12).fill(0), target: new Array(12).fill(0) },
          revenue: { actual: new Array(12).fill(0), target: new Array(12).fill(0) },
          currentMonth: new Date().getMonth(),
          hasSales: false
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      labels: {
        colors: ["#6B7280"],
      },
    },
    colors: ["#465FFF", "#9CB9FF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "area",
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false
      },
      animations: {
        enabled: true,
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    stroke: {
      curve: "smooth",
      width: [2, 2],
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      y: {
        formatter: (value: number) => {
          if (activeTab === 'sales') {
            return `${value} books`;
          }
          return `₹${value.toLocaleString('en-IN')}`;
        }
      }
    },
    xaxis: {
      type: "category",
      categories: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: statistics?.currentMonth ? 
            Array(12).fill('#6B7280').map((color, index) => 
              index > statistics.currentMonth ? '#ccc' : color
            ) : '#6B7280'
        }
      }
    },
    yaxis: {
      min: 0,
      labels: {
        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
        formatter: (value: number) => {
          if (activeTab === 'sales') {
            return Math.floor(value).toString();
          }
          return `₹${value.toLocaleString('en-IN')}`;
        }
      },
      title: {
        text: "",
      },
    },
  };

  const series = statistics ? [
    {
      name: activeTab === 'sales' ? "Actual Sales" : "Actual Revenue",
      data: activeTab === 'sales' ? statistics.sales.actual : statistics.revenue.actual,
    },
    {
      name: activeTab === 'sales' ? "Target Sales" : "Target Revenue",
      data: activeTab === 'sales' ? statistics.sales.target : statistics.revenue.target,
    },
  ] : [];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="h-[310px] flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading statistics...</div>
        </div>
      );
    }

    if (!statistics?.hasSales) {
      return (
        <div className="h-[310px] flex items-center justify-center">
          <div className="text-gray-500 text-center">
            <p className="text-lg font-medium mb-2">No sales data available</p>
            <p className="text-sm">Sales statistics will appear here once books are purchased.</p>
          </div>
        </div>
      );
    }

    if (!isBrowser) {
      return (
        <div className="h-[310px] flex items-center justify-center">
          <div className="text-gray-400">Chart is loading...</div>
        </div>
      );
    }

    return (
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full" ref={chartRef}>
          <div className="chart-container">
            {chartRef.current && (
              <ReactApexChart
                options={options}
                series={series}
                type="area"
                height={310}
                width="100%"
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Statistics
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Monthly sales and revenue overview
          </p>
        </div>
        <div className="flex items-start w-full gap-3 sm:justify-end">
          <ChartTab activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {renderContent()}
    </div>
  );
}
