"use client";
import React, { useEffect, useState } from "react";
import Badge from "../ui/badge/Badge";
import { ArrowDownIcon, ArrowUpIcon, BoxIconLine, GroupIcon } from "@/icons";

interface DashboardMetrics {
  books: {
    total: number;
    growth: string;
  };
  users: {
    total: number;
    growth: string;
  };
}

export const EcommerceMetrics = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/dashboard/metrics');
        if (!response.ok) throw new Error('Failed to fetch metrics');
        const data = await response.json();
        setMetrics(data.metrics);
      } catch (err) {
        console.error('Error fetching metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  // Helper function to format numbers with fallback
  const formatNumber = (value: number | undefined) => {
    return (value || 0).toLocaleString('en-IN');
  };

  // Helper function to format growth percentage
  const formatGrowth = (value: string | undefined) => {
    const num = Number(value) || 0;
    return Math.abs(num).toFixed(2);
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* Users Metric */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Users
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {formatNumber(metrics?.users.total)}
            </h4>
          </div>
          <Badge color={Number(metrics?.users.growth || 0) >= 0 ? "success" : "error"}>
            {Number(metrics?.users.growth || 0) >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {formatGrowth(metrics?.users.growth)}%
          </Badge>
        </div>
      </div>

      {/* Books Metric */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Books
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {formatNumber(metrics?.books.total)}
            </h4>
          </div>
          <Badge color={Number(metrics?.books.growth || 0) >= 0 ? "success" : "error"}>
            {Number(metrics?.books.growth || 0) >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {formatGrowth(metrics?.books.growth)}%
          </Badge>
        </div>
      </div>
    </div>
  );
};
