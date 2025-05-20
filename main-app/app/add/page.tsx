"use client";

import { ArrowRight, Globe, Mail, Search } from "lucide-react";
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

export default function AddPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <main className="space-y-8">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Add Monitoring</h1>
          <p className="text-muted-foreground">Choose what type of monitoring you want to add</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                URL Monitor
              </CardTitle>
              <CardDescription>Monitor a website for changes</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground text-sm">
                Watch a URL for any changes to its content and get notified when something changes.
              </p>
            </CardContent>
            <CardFooter className="mt-auto">
              <Link href="/add/url" className="w-full">
                <Button className="w-full">
                  Add URL
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Keyword Monitor
              </CardTitle>
              <CardDescription>Set up keyword notifications</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground text-sm">
                Create alerts for specific keywords that appear on monitored websites.
              </p>
            </CardContent>
            <CardFooter className="mt-auto">
              <Link href="/add/keyword" className="w-full">
                <Button className="w-full">
                  Add Keyword
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Notification
              </CardTitle>
              <CardDescription>Add email recipients</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground text-sm">
                Add email addresses to receive notifications when changes are detected.
              </p>
            </CardContent>
            <CardFooter className="mt-auto">
              <Link href="/add/email" className="w-full">
                <Button className="w-full">
                  Add Email
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        {/* Back to dashboard */}
        <div className="pt-4 text-center">
          <Link href="/">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
