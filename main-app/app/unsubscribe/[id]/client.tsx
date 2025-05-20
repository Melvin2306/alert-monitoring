"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Client component that receives the id directly
export default function UnsubscribePageClient({ id }: { id: string }) {
  const emailId = id;

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailAddress, setEmailAddress] = useState<string>("");
  const [fetchingEmail, setFetchingEmail] = useState(true);
  const router = useRouter();

  // Fetch the email address from the API
  useEffect(() => {
    async function fetchEmailAddress() {
      try {
        const response = await fetch(`/api/email?id=${emailId}`);
        const data = await response.json();

        if (response.ok && data.success && data.data) {
          setEmailAddress(data.data.email);
          // Show a notification that we've found the email address
          toast.info(`Found email: ${data.data.email}`, {
            description: "Please confirm if you want to unsubscribe this email address.",
          });
        } else {
          console.error("Failed to fetch email address:", data.message);
          toast.error("Email not found", {
            description:
              "We couldn't find this email in our system. It may have been already unsubscribed.",
          });
        }
      } catch (err) {
        console.error("Error fetching email address:", err);
        toast.error("Error loading email information", {
          description:
            "There was a problem retrieving your email information. Please try again later.",
        });
      } finally {
        setFetchingEmail(false);
      }
    }

    fetchEmailAddress();
  }, [emailId]);

  // Handle unsubscribe confirmation
  const handleUnsubscribe = async () => {
    setIsLoading(true);
    setError(null);

    toast.promise(
      // The promise
      new Promise<void>(async (resolve, reject) => {
        try {
          // Call the DELETE endpoint to remove the email subscription
          const response = await fetch(`/api/email?id=${emailId}`, {
            method: "DELETE",
          });

          const data = await response.json();

          if (response.ok && data.success) {
            setSuccess(true);
            resolve();
          } else {
            setSuccess(false);
            setError(data.message || "Failed to unsubscribe. Please try again later.");
            reject(new Error(data.message || "Failed to unsubscribe"));
          }
        } catch (err) {
          setSuccess(false);
          setError("An unexpected error occurred. Please try again later.");
          console.error("Error during unsubscribe:", err);
          reject(new Error("An unexpected error occurred"));
        } finally {
          setIsLoading(false);
        }
      }),

      // Toast configuration
      {
        loading: `Unsubscribing ${emailAddress || "email"}...`,
        success: `${
          emailAddress || "Your email"
        } has been successfully unsubscribed from all future alerts.`,
        error: (error) =>
          `Error: ${error.message || "Failed to unsubscribe. Please try again later."}`,
      }
    );
  };

  return (
    <div className="container mx-auto max-w-md py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">Unsubscribe from Alerts</CardTitle>
          <CardDescription className="text-center">
            You are about to unsubscribe from all future alert notifications.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {success === null ? (
            <div className="text-center">
              {fetchingEmail ? (
                <div className="mb-4 flex items-center justify-center">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-gray-500" />
                  <p>Loading email information...</p>
                </div>
              ) : emailAddress ? (
                <p className="mb-6">
                  Are you sure you want to unsubscribe <strong>{emailAddress}</strong> from all
                  future alert emails?
                </p>
              ) : (
                <p className="mb-6">
                  Are you sure you want to unsubscribe from all future alert emails?
                </p>
              )}
              <p className="mb-4 text-sm text-gray-500">
                You will no longer receive alerts about keyword matches on monitored darkweb sites.
              </p>
            </div>
          ) : success ? (
            <Alert variant="default" className="border-green-200 bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertTitle>Successfully Unsubscribed</AlertTitle>
              <AlertDescription>
                {emailAddress ? (
                  <>
                    <strong>{emailAddress}</strong> has been successfully unsubscribed from all
                    future alert notifications.
                  </>
                ) : (
                  <>You have been successfully unsubscribed from all future alert notifications.</>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error || "Failed to unsubscribe. Please try again later."}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex justify-center space-x-4">
          {success === null ? (
            <>
              <Button variant="destructive" onClick={handleUnsubscribe} disabled={isLoading}>
                {isLoading ? "Processing..." : "Confirm Unsubscribe"}
              </Button>
              <Button variant="outline" onClick={() => router.push("/")} disabled={isLoading}>
                Cancel
              </Button>
            </>
          ) : success ? (
            <div className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
              <Button variant="default" onClick={() => router.push("/")}>
                Return to Home
              </Button>
              <Button variant="outline" onClick={() => router.push("/add/email")}>
                Subscribe a Different Email
              </Button>
            </div>
          ) : (
            <Button variant="default" onClick={() => setSuccess(null)}>
              Try Again
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
