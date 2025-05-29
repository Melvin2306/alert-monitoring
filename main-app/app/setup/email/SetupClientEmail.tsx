"use client";
import { AlertTriangle, ArrowRight, CheckCircle, FileText, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

import type { SMTPStatusResponse } from "@/lib/types";

const SetupClientEmail = () => {
  const [setupComplete, setSetupComplete] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [smtpStatus, setSmtpStatus] = useState<SMTPStatusResponse | null>(null);

  // Fetch SMTP status from API
  const fetchSMTPStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/smtp/status");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SMTPStatusResponse = await response.json();
      setSmtpStatus(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch SMTP status:", err);
      setError("Failed to check SMTP configuration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSMTPStatus();
  }, []);

  /**
   * Handles the form submission for confirming email settings
   * @param e - The form submission event
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    toast.promise(
      // The promise
      new Promise((resolve) => {
        setTimeout(() => {
          // Store confirmation that email is set up
          localStorage.setItem("EMAIL_SETUP_CONFIRMED", "true");
          setSetupComplete(true);
          resolve(true);
        }, 1000);
      }),

      // The loading/success/error messages
      {
        loading: "Confirming email settings...",
        success: () => {
          setTimeout(() => {
            window.location.href = "/";
          }, 1500);
          return "Email settings confirmed! Redirecting to dashboard...";
        },
        error: "Failed to confirm settings. Please try again.",
      }
    );
  };

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <main className="space-y-8">
          <div className="text-center">
            <h1 className="mb-2 text-3xl font-bold tracking-tight">Email Configuration</h1>
            <p className="text-muted-foreground">Checking your SMTP configuration status...</p>
          </div>
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading SMTP configuration...</span>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Show error state
  if (error || !smtpStatus) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <main className="space-y-8">
          <div className="text-center">
            <h1 className="mb-2 text-3xl font-bold tracking-tight">Email Configuration</h1>
            <p className="text-muted-foreground">Unable to check SMTP configuration status</p>
          </div>
          <Card>
            <CardContent>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Configuration Check Failed</AlertTitle>
                <AlertDescription>
                  {error ||
                    "Unable to retrieve SMTP configuration status. Please try refreshing the page."}
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button onClick={fetchSMTPStatus} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Button onClick={() => window.location.reload()}>Refresh Page</Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <main className="space-y-8">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Email Configuration</h1>
          <p className="text-muted-foreground">
            Check your SMTP configuration status for email notifications
          </p>
        </div>

        {setupComplete ? (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="text-primary h-5 w-5" />
                Email Configuration Confirmed!
              </CardTitle>
              <CardDescription>
                Your email settings have been confirmed. You can now start using the application.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href="/" passHref>
                <Button>
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        smtpStatus.isConfigured
                          ? "bg-green-100 text-green-600"
                          : "bg-orange-100 text-orange-600"
                      }`}
                    >
                      {smtpStatus.isConfigured ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                    </div>
                    <CardTitle>SMTP Configuration Status</CardTitle>
                  </div>
                  <Button onClick={fetchSMTPStatus} variant="outline" size="sm" disabled={loading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>
                <CardDescription>
                  {smtpStatus.isConfigured
                    ? "Your SMTP configuration is properly set up."
                    : "Your SMTP configuration needs attention."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {smtpStatus.isConfigured ? (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Configuration Complete</AlertTitle>
                    <AlertDescription className="text-green-700">
                      All required SMTP environment variables are configured:
                      <ul className="mt-2 ml-4 list-disc space-y-1">
                        {smtpStatus.configuredVariables.map((variable, index) => (
                          <li key={index}>{variable}</li>
                        ))}
                      </ul>
                      Your application is ready to send email notifications.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Configuration Required</AlertTitle>
                    <AlertDescription>
                      Your SMTP configuration is incomplete. The following environment variables
                      need to be set:
                      <ul className="mt-2 ml-4 list-disc space-y-1">
                        {smtpStatus.missingVariables.map((variable, index) => (
                          <li key={index}>{variable}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {!smtpStatus.isConfigured && (
                  <Card className="mt-4 border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-800">
                        <FileText className="h-4 w-4" />
                        Setup Instructions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-blue-700">
                      <p className="mb-3">
                        To configure your SMTP settings, please refer to the SMTP setup
                        documentation:
                      </p>
                      <div className="space-y-2">
                        <p className="font-medium">Option 1: Use the automated setup script</p>
                        <code className="block rounded bg-blue-100 p-2 text-sm">
                          chmod +x setup-smtp.sh
                          <br />
                          ./setup-smtp.sh
                        </code>

                        <p className="mt-4 font-medium">Option 2: Manual configuration</p>
                        <p className="text-sm">
                          Create or edit the <code className="rounded bg-blue-100 px-1">.env</code>{" "}
                          file in your project root and add the required SMTP variables.
                        </p>
                      </div>
                      <p className="mt-3 text-sm">
                        For detailed instructions and common provider settings, check the{" "}
                        <strong>SMTP-SETUP.md</strong> file in your project root.
                      </p>
                      <p className="mt-3 text-sm font-medium">
                        After updating your configuration, restart the application:
                      </p>
                      <code className="block rounded bg-blue-100 p-2 text-sm">
                        docker compose restart main-app
                      </code>
                    </CardContent>
                  </Card>
                )}

                {smtpStatus.isConfigured && (
                  <form onSubmit={handleSubmit} className="mt-6">
                    <div className="flex justify-end">
                      <Button type="submit">
                        Confirm Settings
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default SetupClientEmail;
