"use client";

import { FormField, FormWrapper } from "@/components/FormWrapper";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Function to sanitize user input to prevent XSS
function sanitizeInput(input: string): string {
  if (!input) return input;
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Define the schema for URL validation
const urlSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .refine(
      (url) => {
        try {
          const parsedUrl = new URL(url);
          // Only allow http and https schemes
          return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
        } catch {
          return false;
        }
      },
      {
        message: "Please enter a valid URL starting with http:// or https://",
      }
    )
    .refine(
      (url) => {
        try {
          const parsedUrl = new URL(url);
          const hostname = parsedUrl.hostname.toLowerCase();

          // Prevent internal network URLs
          const blockedPatterns = [
            /^localhost$/i,
            /^127\.\d+\.\d+\.\d+$/,
            /^10\.\d+\.\d+\.\d+$/,
            /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/,
            /^192\.168\.\d+\.\d+$/,
            /^0\.0\.0\.0$/,
            /^::1$/,
          ];

          return !blockedPatterns.some((pattern) => pattern.test(hostname));
        } catch {
          return false;
        }
      },
      {
        message: "URLs pointing to internal or private networks are not allowed",
      }
    )
    .refine(
      (url) => {
        try {
          const parsedUrl = new URL(url);
          const hostname = parsedUrl.hostname.toLowerCase();

          // Require a valid domain with at least one dot and some characters after the dot
          // This prevents URLs like https://example
          return /^.+\..+$/.test(hostname);
        } catch {
          return false;
        }
      },
      {
        message: "Please enter a valid URL with a proper domain (e.g., example.com)",
      }
    ),
  title: z.string().optional(),
});

// Infer the type from the schema
type UrlValues = z.infer<typeof urlSchema>;

/**
 * URL form component for editing websites to monitor
 * @returns React component for editing URL monitoring
 */
export default function EditUrlForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const params = useParams();
  const router = useRouter();
  const watchId = params.id as string;

  // Setup react-hook-form with zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    setValue,
    watch,
    trigger,
  } = useForm<UrlValues>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      url: "",
      title: "",
    },
    mode: "onChange",
  });

  const urlValue = watch("url");

  /**
   * Automatically adds https:// prefix to URL input when the user types or changes the value
   * This effect runs whenever the URL value changes
   */
  useEffect(() => {
    // Skip on empty values or initial load
    if (!urlValue || urlValue.trim() === "") return;

    // Check if the URL doesn't already start with http:// or https://
    if (!urlValue.match(/^https?:\/\//i)) {
      setValue("url", `https://${urlValue.trim()}`, {
        shouldValidate: true,
        shouldDirty: true,
      });
      // Use setTimeout to ensure the value is set before validation
      setTimeout(() => trigger("url"), 0);
    }
  }, [urlValue, setValue, trigger]);

  /**
   * Handles paste events specifically for the URL input field
   * This adds the https:// prefix to any URL pasted without it
   */
  useEffect(() => {
    // Handle paste event for clipboard data
    const handlePaste = (event: globalThis.ClipboardEvent) => {
      // Only process if our URL input field is focused
      if (document.activeElement?.id === "url") {
        const pastedText = event.clipboardData?.getData("text");
        if (pastedText && pastedText.trim() !== "") {
          // Remove whitespace and check if there's no protocol prefix
          const trimmedText = pastedText.trim();

          let finalUrl = trimmedText;
          if (!trimmedText.match(/^https?:\/\//i)) {
            finalUrl = `https://${trimmedText}`;
            // Prevent default paste for URLs we need to modify
            event.preventDefault();
          }

          // Set value with validation, making sure form is marked as dirty
          setValue("url", finalUrl, {
            shouldValidate: true,
            shouldDirty: true,
          });

          // Trigger validation after a short delay to ensure the value is set
          setTimeout(() => {
            trigger("url");
          }, 50);
        }
      }
    };

    // Add the event listener
    document.addEventListener("paste", handlePaste);

    // Clean up the event listener on component unmount
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [setValue, trigger]);

  // Custom validation check to determine if the form is ready to submit
  const isFormValid = useMemo(() => {
    // Form must be dirty (user has interacted with it)
    if (!isDirty) return false;

    // Check for validation status from the form itself
    if (!isValid) return false;

    // Must have no validation errors
    if (Object.keys(errors).length > 0) return false;

    // URL field must have a value
    const url = watch("url");
    if (!url || url.trim() === "") return false;

    // URL must be in valid format (additional check beyond Zod validation)
    try {
      const parsedUrl = new URL(url);

      // Only allow http and https schemes
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        return false;
      }

      // Block internal/private network hostnames
      const hostname = parsedUrl.hostname.toLowerCase();
      const blockedPatterns = [
        /^localhost$/i,
        /^127\.\d+\.\d+\.\d+$/,
        /^10\.\d+\.\d+\.\d+$/,
        /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/,
        /^192\.168\.\d+\.\d+$/,
        /^0\.0\.0\.0$/,
        /^::1$/,
      ];

      if (blockedPatterns.some((pattern) => pattern.test(hostname))) {
        return false;
      }

      // Require a valid domain with at least one dot and some characters after the dot
      if (!/^.+\..+$/.test(hostname)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }, [isDirty, errors, watch, isValid]);

  // Fetch the URL details
  useEffect(() => {
    const fetchUrlDetails = async () => {
      if (!watchId) return;

      try {
        setIsLoading(true);

        const encodedApiKey = localStorage.getItem("CHANGEDETECTION_API_KEY") || "";

        // First, get all URLs
        const response = await fetch("/api/all-urls", {
          headers: {
            "x-api-key": encodedApiKey,
          },
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        interface WatchData {
          id: string;
          url: string;
          title?: string;
        }

        const data = await response.json();
        const watch = data.watches.find((w: WatchData) => w.id === watchId);

        if (!watch) {
          throw new Error("URL not found");
        }

        // Set form fields with existing values
        setValue("url", watch.url);
        setValue("title", watch.title || "");

        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching URL details:", err);
        setError(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
      }
    };

    fetchUrlDetails();
  }, [watchId, setValue]);

  /**
   * Handles form submission for updating a URL
   */
  const onSubmit = async (): Promise<Response> => {
    return new Promise<Response>((resolve) => {
      handleSubmit(async (data) => {
        setIsSubmitting(true);
        try {
          const encodedApiKey = localStorage.getItem("CHANGEDETECTION_API_KEY") || "";

          // Sanitize the input to prevent XSS before sending to server
          const sanitizedData = {
            watchId,
            url: data.url,
            title: data.title ? sanitizeInput(data.title) : undefined,
          };

          const response = await fetch("/api/url", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": encodedApiKey,
            },
            body: JSON.stringify(sanitizedData),
          });

          // Redirect back to dashboard after successful update
          if (response.ok) {
            router.push("/");
          }

          resolve(response);
        } finally {
          setIsSubmitting(false);
        }
      })();
    });
  };

  /**
   * Handles deleting the URL
   */
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const encodedApiKey = localStorage.getItem("CHANGEDETECTION_API_KEY") || "";

      const response = await fetch(`/api/url?watchId=${watchId}`, {
        method: "DELETE",
        headers: {
          "x-api-key": encodedApiKey,
        },
      });

      if (response.ok) {
        router.push("/");
      } else {
        const data = await response.json();
        setError(data.message || "Failed to delete URL");
      }
    } catch (err) {
      console.error("Error deleting URL:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="container mx-auto py-10">Loading URL details...</div>;
  }

  if (error) {
    return <div className="container mx-auto py-10 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <FormWrapper
        title="Edit URL"
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        isValid={isFormValid}
        loadingMessage="Updating URL..."
        successMessage="Successfully updated URL"
        errorMessage="Failed to update URL"
        submitButtonText="Update URL"
      >
        <FormField
          label="Website URL"
          id="url"
          type="url"
          placeholder="https://example.com or example.com"
          register={{
            ...register("url"),
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              // If the user pastes directly and we didn't catch it with the paste event
              // This will handle that case when the input value changes
              const currentValue = e.target.value;

              if (currentValue && currentValue.trim() !== "") {
                let finalUrl = currentValue.trim();

                // Handle URL prefixing if needed
                if (!finalUrl.match(/^https?:\/\//i)) {
                  finalUrl = `https://${finalUrl}`;
                }

                // Set the value with validation flags
                setValue("url", finalUrl, {
                  shouldValidate: true,
                  shouldDirty: true,
                });

                // Trigger validation with slight delay to ensure value is set
                setTimeout(() => {
                  trigger("url");
                }, 50);
              } else if (currentValue === "") {
                // Handle empty input case
                setValue("url", "", {
                  shouldValidate: true,
                  shouldDirty: false,
                });
                trigger("url");
              }
            },
          }}
          error={errors.url}
          isDisabled={isSubmitting}
        />

        <FormField
          label="Title"
          id="title"
          type="text"
          placeholder="My Website Monitor"
          register={register("title")}
          error={errors.title}
          isOptional={true}
          isDisabled={isSubmitting}
        />

        <div className="mt-8 border-t pt-6">
          <h3 className="mb-4 text-lg font-medium text-red-600">Danger Zone</h3>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                className="flex items-center gap-2"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete URL from Monitoring"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this URL and remove it
                  from your monitoring list.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Delete URL"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </FormWrapper>
    </div>
  );
}
