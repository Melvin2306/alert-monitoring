"use client";
import { ArrowRight, CheckCircle, ExternalLink, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";

interface SetupClientApiProps {
  apiUrl: string;
}

const SetupClientApi = ({ apiUrl }: SetupClientApiProps) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [setupComplete, setSetupComplete] = useState<boolean>(false);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [showWarning, setShowWarning] = useState<boolean>(false);

  /**
   * Handles changes to the API key input field
   * @param e - The input change event
   */
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setApiKey(value);
    // Show warning if key is not empty and not 32 characters
    setShowWarning(value.trim() !== "" && value.trim().length !== 32);
  };

  /**
   * Handles the form submission for API key setup
   * @param e - The form submission event
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Store the API key in localStorage (Base64 encoded for basic obfuscation)
    if (apiKey.trim().length > 0) {
      toast.promise(
        // The promise
        new Promise((resolve) => {
          setTimeout(() => {
            const encodedApiKey = btoa(apiKey.trim()); // Base64 encode the API key
            localStorage.setItem("CHANGEDETECTION_API_KEY", encodedApiKey);
            setSetupComplete(true);
            resolve(true);
          }, 1000); // Simulate a brief delay for the API key processing
        }),

        // The loading/success/error messages
        {
          loading: "Saving API key...",
          success: () => {
            setTimeout(() => {
              window.location.href = "/";
            }, 1500); // Redirect after showing the success toast
            return "API key saved successfully! Redirecting to dashboard...";
          },
          error: "Failed to save API key. Please try again.",
        }
      );
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <main className="space-y-8">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Welcome to the Setup Guide</h1>
          <p className="text-muted-foreground">
            Follow these steps to connect your application to the API
          </p>
        </div>

        {setupComplete ? (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="text-primary h-5 w-5" />
                Setup Complete!
              </CardTitle>
              <CardDescription>
                Your API key has been saved. You can now start using the application.
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
            {/* Step 1 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full">
                    1
                  </div>
                  <CardTitle>Access the API Server</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  First, you need to access the local API server by clicking the link below:
                </p>
                <Link
                  href={apiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex cursor-pointer items-center"
                >
                  <Button variant="outline" className="cursor-pointer gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Open API Server ({apiUrl})
                  </Button>
                </Link>
                <Alert variant="default">
                  <AlertTitle className="flex items-center gap-2 text-sm font-medium">
                    Note
                  </AlertTitle>
                  <AlertDescription className="text-sm">
                    If the server is not running, try restarting the application and check the logs
                    for potential errors.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full">
                    2
                  </div>
                  <CardTitle>Navigate to Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Image
                  src={"/changedetection-tutorial-step1.png"}
                  alt="Changedetection Screenshot Navigating to Settings"
                  width={1000}
                  height={600}
                  className="h-auto w-full rounded-md"
                />
                <p className="text-muted-foreground text-sm">
                  Once the API server page is open, look for the <strong>Settings</strong> option in
                  the main navigation menu, usually located in the top right corner or in a sidebar
                  menu.
                </p>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full">
                    3
                  </div>
                  <CardTitle>Find Your API Key</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Image
                  src={"/changedetection-tutorial-step2.png"}
                  alt="Changedetection Screenshot Find API Settings"
                  width={1000}
                  height={600}
                  className="h-auto w-full rounded-md"
                />
                <p className="text-muted-foreground text-sm">
                  In the Settings page, look for a section labeled <strong>API</strong>. Your API
                  key should be displayed there.
                </p>
                <p className="text-muted-foreground text-sm">
                  If you do not see an existing API key, click on <strong>Generate API Key</strong>{" "}
                  to generate a new one.
                </p>
                <Image
                  src={"/changedetection-tutorial-step3.png"}
                  alt="Changedetection Screenshot Find API Settings"
                  width={1000}
                  height={600}
                  className="h-auto w-full rounded-md"
                />
                <p className="text-muted-foreground text-sm">
                  Click on the API key to copy it to your clipboard. You can also select the text
                  and use Command or CTRL + C to copy it.
                </p>
              </CardContent>
            </Card>

            {/* Step 4 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full">
                    4
                  </div>
                  <CardTitle>Enter Your API Key</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 text-sm">
                  Copy your API key from the settings page and paste it in the field below:
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={handleApiKeyChange}
                      placeholder="Paste your API key here"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2 cursor-pointer"
                      onClick={() => setShowApiKey(!showApiKey)}
                      aria-label={showApiKey ? "Hide API key" : "Show API key"}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>

                  {showWarning && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertTitle className="text-sm font-medium">
                        Invalid API Key Format
                      </AlertTitle>
                      <AlertDescription className="text-sm">
                        The API key should be exactly 32 characters long. Please check that you have
                        copied it correctly.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" disabled={apiKey.trim().length === 0 || showWarning}>
                    Save API Key
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default SetupClientApi;
