"use client";

import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

export default function Loading() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(100);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prevProgress + 5;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-background flex h-screen flex-col items-center justify-center">
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-4 flex items-center">
          <div className="relative mr-3">
            <Image
              src="/alert-logo.png"
              alt="Alert Logo"
              width={50}
              height={50}
              className="object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-bold">ALERT</span>
            <span className="text-sm">- Automated Leak Examination and Reporting Tool</span>
          </div>
        </div>

        <div className="w-80">
          <Progress value={progress} className="h-2" />
        </div>
      </div>
    </div>
  );
}
