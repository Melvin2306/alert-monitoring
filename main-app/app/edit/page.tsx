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

export default function EditPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <main className="space-y-8">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Edit Monitoring</h1>
          <p className="text-muted-foreground">Choose what type of monitoring you want to modify</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                URL Monitors
              </CardTitle>
              <CardDescription>Manage website monitoring</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground text-sm">
                Edit your existing URL monitors, modify settings, or delete monitors you no longer
                need.
              </p>
            </CardContent>
            <CardFooter className="mt-auto">
              <Link href="/edit/url" className="w-full">
                <Button className="w-full">
                  Edit URLs
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Keyword Monitors
              </CardTitle>
              <CardDescription>Manage keyword notifications</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground text-sm">
                Edit your keyword alert settings or remove keywords you are no longer tracking.
              </p>
            </CardContent>
            <CardFooter className="mt-auto">
              <Link href="/edit/keyword" className="w-full">
                <Button className="w-full">
                  Edit Keywords
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>Manage notification recipients</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground text-sm">
                Update email addresses or notification preferences for alerts.
              </p>
            </CardContent>
            <CardFooter className="mt-auto">
              <Link href="/edit/email" className="w-full">
                <Button className="w-full">
                  Edit Emails
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
