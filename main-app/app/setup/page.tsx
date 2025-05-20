"use client";

import { ArrowRight, KeyRound, Mail } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SetupPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <main className="space-y-8">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Application Setup</h1>
          <p className="text-muted-foreground">Configure the necessary components to get started</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                API Configuration
              </CardTitle>
              <CardDescription>Connect to the ChangeDetection.io API</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground text-sm">
                Setup your connection to the ChangeDetection.io API to monitor websites for changes.
              </p>
            </CardContent>
            <CardFooter className="mt-auto">
              <Link href="/setup/api" className="w-full">
                <Button className="w-full">
                  Configure API
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </CardTitle>
              <CardDescription>Setup email notifications</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground text-sm">
                Configure your email settings to receive notifications when changes are detected.
              </p>
            </CardContent>
            <CardFooter className="mt-auto">
              <Link href="/setup/email" className="w-full">
                <Button className="w-full">
                  Configure Email
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        {/* Continue to dashboard if already set up */}
        <div className="pt-4 text-center">
          <Link href="/">
            <Button variant="outline">Skip Setup / Go to Dashboard</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
