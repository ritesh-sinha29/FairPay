import React from "react";

interface FairPayLogoProps {
  size?: number;
  className?: string;
}

export function FairPayLogo({ size = 38, className = "" }: FairPayLogoProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_4px_14px_rgba(37,99,235,0.4)]"
      >
        <defs>
          <linearGradient
            id="fairpay-bg"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="45%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient
            id="fairpay-sheen"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Rounded squircle background */}
        <rect
          x="2"
          y="2"
          width="96"
          height="96"
          rx="24"
          fill="url(#fairpay-bg)"
        />
        <rect
          x="2"
          y="2"
          width="96"
          height="96"
          rx="24"
          fill="url(#fairpay-sheen)"
        />
        <rect
          x="2.5"
          y="2.5"
          width="95"
          height="95"
          rx="23.5"
          stroke="#FFFFFF"
          strokeOpacity="0.25"
          strokeWidth="1"
        />

        {/* FairPay Escrow "F" & Shield-Check Mark */}
        {/* Left vertical pillar */}
        <path
          d="M26 26 H40 V74 H26 Z"
          fill="#FFFFFF"
          fillOpacity="0.95"
        />
        {/* Top horizontal wing */}
        <path
          d="M40 26 H74 L63 40 H40 Z"
          fill="#FFFFFF"
          fillOpacity="0.95"
        />
        {/* Top fold facet */}
        <path
          d="M40 40 L52 40 L40 54 Z"
          fill="#93C5FD"
          fillOpacity="0.85"
        />
        {/* Middle horizontal bar */}
        <path
          d="M40 46 H65 L55 58 H40 Z"
          fill="#BFDBFE"
          fillOpacity="0.92"
        />
        {/* Escrow verification checkmark accent */}
        <path
          d="M50 66 L59 75 L76 56 L71 52 L59 67 L54 62 Z"
          fill="#FFFFFF"
          fillOpacity="0.95"
        />
      </svg>
    </div>
  );
}
