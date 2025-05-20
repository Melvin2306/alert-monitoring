"use client";
import { ArrowRight, CheckCircle, Eye, EyeOff, Mail } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { SetupEmailProps } from "./page";

interface SetupClientEmailProps {
  smtp_setup: SetupEmailProps;
}

const SetupClientEmail = ({ smtp_setup }: SetupClientEmailProps) => {
  const [setupComplete, setSetupComplete] = useState<boolean>(false);
  const [showCredentials, setShowCredentials] = useState<boolean>(false);

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

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <main className="space-y-8">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Email Configuration</h1>
          <p className="text-muted-foreground">
            Review your email settings used for notifications and alerts
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
                <div className="flex items-center gap-4">
                  <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full">
                    <Mail className="h-4 w-4" />
                  </div>
                  <CardTitle>SMTP Configuration</CardTitle>
                </div>
                <CardDescription>
                  These are the email settings configured for your application. These settings are
                  loaded from environment variables and cannot be changed from this interface.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="smtp_host">SMTP Host</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 cursor-pointer px-2"
                          onClick={() => setShowCredentials(!showCredentials)}
                        >
                          {showCredentials ? (
                            <EyeOff className="mr-2 h-4 w-4" />
                          ) : (
                            <Eye className="mr-2 h-4 w-4" />
                          )}
                          {showCredentials ? "Hide" : "Show"} Credentials
                        </Button>
                      </div>
                      <Input
                        id="smtp_host"
                        value={smtp_setup.smtp_host}
                        readOnly
                        className="bg-muted"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="smtp_port">SMTP Port</Label>
                      <Input
                        id="smtp_port"
                        value={smtp_setup.smtp_port.toString()}
                        readOnly
                        className="bg-muted"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="smtp_user">SMTP Username</Label>
                      <Input
                        id="smtp_user"
                        type={showCredentials ? "text" : "password"}
                        value={smtp_setup.smtp_user}
                        readOnly
                        className="bg-muted"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="smtp_pass">SMTP Password</Label>
                      <Input
                        id="smtp_pass"
                        type={showCredentials ? "text" : "password"}
                        value={smtp_setup.smtp_pass}
                        readOnly
                        className="bg-muted"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="smtp_secure">SMTP Secure</Label>
                      <Input
                        id="smtp_secure"
                        value={smtp_setup.smtp_secure ? "Enabled" : "Disabled"}
                        readOnly
                        className="bg-muted"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="smtp_from">From Email Address</Label>
                      <Input
                        id="smtp_from"
                        value={smtp_setup.smtp_from}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                  </div>

                  {(smtp_setup.smtp_host === "example@example.com" ||
                    !smtp_setup.smtp_user ||
                    !smtp_setup.smtp_from) && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertTitle className="text-sm font-medium">
                        Incomplete Email Configuration
                      </AlertTitle>
                      <AlertDescription className="text-sm">
                        Some of your SMTP settings are missing or using default values. Email
                        notifications may not work correctly. Update your environment variables to
                        configure email properly.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end">
                    <Button type="submit">Confirm Settings</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default SetupClientEmail;
