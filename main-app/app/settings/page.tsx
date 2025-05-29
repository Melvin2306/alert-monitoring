"use client";

import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SMTPStatusResponse } from "@/lib/types";
import { ArrowRight, KeyRound, Mail, RefreshCw, Shield } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  // State to track API key from localStorage
  const [apiKey, setApiKey] = useState<string>("");
  const [apiKeyMasked, setApiKeyMasked] = useState<string>("");
  const [emailConfigured, setEmailConfigured] = useState<boolean>(false);
  const [emailLoading, setEmailLoading] = useState<boolean>(true);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  // Fetch SMTP status from API
  const fetchSMTPStatus = async () => {
    try {
      setEmailLoading(true);
      const response = await fetch("/api/smtp/status");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SMTPStatusResponse = await response.json();
      setEmailConfigured(data.isConfigured);
    } catch (err) {
      console.error("Failed to fetch SMTP status:", err);
      setEmailConfigured(false);
    } finally {
      setEmailLoading(false);
    }
  };

  // Check for API key and email setup when the component mounts
  useEffect(() => {
    // Check API key
    const storedApiKey = localStorage.getItem("CHANGEDETECTION_API_KEY") || "";
    setApiKey(storedApiKey);

    // Fetch email configuration status from API
    fetchSMTPStatus();

    // Create a masked version of API key for display
    if (storedApiKey) {
      try {
        const decodedKey = atob(storedApiKey);
        setApiKeyMasked(
          `${decodedKey.substring(0, 4)}...${decodedKey.substring(decodedKey.length - 4)}`
        );
      } catch {
        setApiKeyMasked("Invalid key format");
      }
    }
  }, []);

  const handleResetApiKey = () => {
    setIsDialogOpen(true);
  };

  const confirmResetApiKey = () => {
    localStorage.removeItem("CHANGEDETECTION_API_KEY");
    setApiKey("");
    setApiKeyMasked("");
    setIsDialogOpen(false);
    window.location.href = "/setup";
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your application settings and connections</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              API Configuration
            </CardTitle>
            <CardDescription>Manage your connection to the ChangeDetection.io API</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="mb-1 font-medium">API Key Status</div>
                {apiKey ? (
                  <div className="text-sm">
                    <span className="rounded-md bg-green-100 px-2 py-1 text-green-800 dark:bg-green-900 dark:text-green-100">
                      Configured
                    </span>
                    <span className="text-muted-foreground ml-2">{apiKeyMasked}</span>
                  </div>
                ) : (
                  <div className="text-sm">
                    <span className="rounded-md bg-red-100 px-2 py-1 text-red-800 dark:bg-red-900 dark:text-red-100">
                      Not Configured
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleResetApiKey}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset API Key
            </Button>
            <Link href="/setup/api" passHref>
              <Button>
                {apiKey ? "Reconfigure" : "Configure"} API Connection
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Configuration
            </CardTitle>
            <CardDescription>
              Manage your email settings for notifications and alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="mb-1 font-medium">Email Status</div>
                {emailLoading ? (
                  <div className="text-sm">
                    <span className="rounded-md bg-gray-100 px-2 py-1 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                      Checking...
                    </span>
                  </div>
                ) : emailConfigured ? (
                  <div className="text-sm">
                    <span className="rounded-md bg-green-100 px-2 py-1 text-green-800 dark:bg-green-900 dark:text-green-100">
                      Configured
                    </span>
                  </div>
                ) : (
                  <div className="text-sm">
                    <span className="rounded-md bg-red-100 px-2 py-1 text-red-800 dark:bg-red-900 dark:text-red-100">
                      Not Configured
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Link href="/setup/email" passHref>
              <Button>
                {emailConfigured ? "Check" : "Check"} Email Settings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & Privacy
            </CardTitle>
            <CardDescription>Manage security settings and data privacy</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <p className="text-muted-foreground text-sm">
                Your API key is stored locally in your browser and is never sent to our servers. All
                API communication is conducted directly between your browser and the
                ChangeDetection.io API server.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onCancel={() => setIsDialogOpen(false)}
        onDelete={confirmResetApiKey}
        title="Reset API Key?"
        description="This will remove your stored API key and redirect you to the setup page. You'll need to reconfigure your connection to the ChangeDetection.io API."
      />
    </div>
  );
}
