"use client";
import React, { useEffect, useState } from "react";
// import { VectorMap } from "@react-jvectormap/core";
import { worldMill } from "@react-jvectormap/world";
import dynamic from "next/dynamic";

const VectorMap = dynamic(
  () => import("@react-jvectormap/core").then((mod) => mod.VectorMap),
  { ssr: false }
);

interface PurchaseLocation {
  country: string;
  latLng: [number, number];
  purchaseCount: number;
  totalRevenue: number;
}

interface LocationData {
  locations: PurchaseLocation[];
  hasPurchases: boolean;
}

// Define the component props
interface CountryMapProps {
  mapColor?: string;
}

type MarkerStyle = {
  initial: {
    fill: string;
    r: number; // Radius for markers
  };
};

type Marker = {
  latLng: [number, number];
  name: string;
  style?: {
    fill: string;
    borderWidth: number;
    borderColor: string;
    stroke?: string;
    strokeOpacity?: number;
  };
};

const CountryMap: React.FC<CountryMapProps> = ({ mapColor }) => {
  const [loading, setLoading] = useState(true);
  const [locationData, setLocationData] = useState<LocationData>({
    locations: [],
    hasPurchases: false
  });

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/dashboard/purchase-locations');
        if (!response.ok) throw new Error('Failed to fetch locations');
        const data = await response.json();
        if (data.success) {
          setLocationData(data.data);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const markers: Marker[] = locationData.locations.map(location => ({
    latLng: location.latLng,
    name: `${location.country} (${location.purchaseCount} purchases, ₹${location.totalRevenue.toLocaleString('en-IN')})`,
    style: {
      fill: "#465FFF",
      borderWidth: 1,
      borderColor: "white",
      stroke: "#383f47",
      strokeOpacity: 0.8
    }
  }));

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading map data...</div>
      </div>
    );
  }

  return (
    <div className="relative">
      <VectorMap
        map={worldMill}
        backgroundColor="transparent"
        markerStyle={
          {
            initial: {
              fill: "#465FFF",
              r: 6,
            },
          } as MarkerStyle
        }
        markersSelectable={true}
        markers={markers}
        zoomOnScroll={false}
        zoomMax={12}
        zoomMin={1}
        zoomAnimate={true}
        zoomStep={1.5}
        regionStyle={{
          initial: {
            fill: mapColor || "#D0D5DD",
            fillOpacity: 1,
            fontFamily: "Outfit",
            stroke: "none",
            strokeWidth: 0,
            strokeOpacity: 0,
          },
          hover: {
            fillOpacity: 0.7,
            cursor: "pointer",
            fill: "#465fff",
            stroke: "none",
          },
          selected: {
            fill: "#465FFF",
          },
          selectedHover: {},
        }}
        regionLabelStyle={{
          initial: {
            fill: "#35373e",
            fontWeight: 500,
            fontSize: "13px",
            stroke: "none",
          },
          hover: {},
          selected: {},
          selectedHover: {},
        }}
      />
      {!locationData.hasPurchases && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
          <div className="text-gray-500 text-center">
            <p className="text-lg font-medium mb-2">No purchase data available</p>
            <p className="text-sm">Purchase locations will appear here once books are sold.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryMap;
