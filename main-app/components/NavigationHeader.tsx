// This file is a Client Component
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Github, LucideAlertTriangle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ModeToggle } from "./ModeToggle";
import { Button } from "./ui/button";

export default function Header() {
  // State to track API key from localStorage
  const [apiKey, setApiKey] = useState("");

  // Check for API key in localStorage when the component mounts
  useEffect(() => {
    const storedApiKey = localStorage.getItem("CHANGEDETECTION_API_KEY") || "";
    setApiKey(storedApiKey);

    // Set up an event listener for storage changes (in case the API key is updated in another tab)
    const handleStorageChange = () => {
      const updatedApiKey = localStorage.getItem("CHANGEDETECTION_API_KEY") || "";
      setApiKey(updatedApiKey);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <div className="mx-2 flex w-full flex-row items-center justify-between">
      <div className="flex flex-row items-center gap-4">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem className="min-w-[120px]">
              <Link href="/" className="flex items-center gap-2 px-2">
                <Image
                  src={"/alert-logo.png"}
                  alt="ALERT Security Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                  priority
                />
                <span className="text-lg font-bold whitespace-nowrap">ALERT</span>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Dashboard
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/add/email" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Add Email
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/add/url" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Add URL
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/add/keyword" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Add Keywords
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/settings" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Settings
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {!apiKey && (
          <Alert
            variant="destructive"
            className="bg-background m-0 h-auto cursor-pointer border-none p-2 whitespace-nowrap"
          >
            <Link href="/setup/api" className="flex w-full items-center">
              <div className="mr-2 flex items-center self-center">
                <LucideAlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <AlertTitle className="text-xs">Configuration Required</AlertTitle>
                <AlertDescription className="text-xs">API Key not configured</AlertDescription>
              </div>
            </Link>
          </Alert>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          asChild
          aria-label="GitHub repository"
          className="cursor-pointer"
        >
          <Link href="#" target="_blank" rel="noopener noreferrer">
            <Github className="h-[1.2rem] w-[1.2rem]" />
          </Link>
        </Button>
        <ModeToggle />
      </div>
    </div>
  );
}
