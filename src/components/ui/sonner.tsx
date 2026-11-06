"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      richColors
      icons={{
        success: <CircleCheckIcon className="size-4 mt-0.5 shrink-0 text-emerald-400" />,
        info: <InfoIcon className="size-4 mt-0.5 shrink-0 text-blue-400" />,
        warning: <TriangleAlertIcon className="size-4 mt-0.5 shrink-0 text-amber-400" />,
        error: <OctagonXIcon className="size-4 mt-0.5 shrink-0 text-red-400" />,
        loading: <Loader2Icon className="size-4 mt-0.5 shrink-0 animate-spin text-neutral-400" />,
      }}
      toastOptions={{
        classNames: {
          toast: "!bg-neutral-900 !border-neutral-800 !text-white !shadow-2xl !rounded-xl",
          title: "!text-white !font-medium !text-xs",
          description: "!text-neutral-400 !text-xs",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

