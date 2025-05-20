"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="container flex h-[80vh] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px]">
        <div className="flex flex-col space-y-2 text-center">
          <div className="mx-auto rounded-full bg-red-100 p-3 dark:bg-red-900">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-200" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Oops! Something went wrong</h1>
          <p className="text-muted-foreground text-sm">
            An unexpected error occurred. Please try again or return to the home page.
          </p>
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 rounded-md bg-red-50 p-4 text-left dark:bg-red-950">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Error: {error.message}
              </p>
            </div>
          )}
        </div>
        <div className="flex justify-center gap-4">
          <Button onClick={reset} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button asChild variant="default">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
