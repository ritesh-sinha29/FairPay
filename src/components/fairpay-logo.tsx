import React from "react";
import Image from "next/image";

interface FairPayLogoProps {
  size?: number;
  className?: string;
  priority?: boolean;
}

export function FairPayLogo({
  size = 38,
  className = "",
  priority = true,
}: FairPayLogoProps) {
  return (
    <Image
      src="/fairpay-logo.svg"
      alt="FairPay Logo"
      width={size}
      height={size}
      priority={priority}
      className={`shrink-0 select-none drop-shadow-[0_4px_14px_rgba(37,99,235,0.4)] ${className}`}
    />
  );
}
