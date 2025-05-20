"use client";

import { FormField, FormWrapper } from "@/components/FormWrapper";
import { zodResolver } from "@hookform/resolvers/zod";
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
    ),
  title: z.string().optional(),
});

// Infer the type from the schema
type UrlValues = z.infer<typeof urlSchema>;

/**
 * URL form component for adding websites to monitor
 * @returns React component for adding URL monitoring
 */
export default function UrlForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Setup react-hook-form with zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
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

            // Try to validate URL format manually as an additional check
            try {
              const parsedUrl = new URL(finalUrl);

              // Verify scheme
              if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
                console.log("Invalid URL scheme:", parsedUrl.protocol);
                return;
              }

              // Verify not internal network
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
                console.log("Blocked internal hostname:", hostname);
                return;
              }

              console.log("Valid URL format:", finalUrl);
            } catch {
              console.log("Invalid URL format:", finalUrl);
            }
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

  /**
   * Handles form submission for adding a URL to monitor
   */
  const onSubmit = async (): Promise<Response> => {
    return new Promise<Response>((resolve) => {
      handleSubmit(async (data) => {
        setIsSubmitting(true);
        try {
          const encodedApiKey = localStorage.getItem("CHANGEDETECTION_API_KEY") || "";

          // Sanitize data before submission to prevent XSS
          const sanitizedData = {
            url: data.url, // URL is already validated by our schema
            title: data.title ? sanitizeInput(data.title) : undefined,
          };

          const response = await fetch("/api/url", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": encodedApiKey,
            },
            body: JSON.stringify(sanitizedData),
          });

          // Reset the form with default values
          reset(
            {
              url: "",
              title: "",
            },
            {
              keepDirty: false,
              keepErrors: false,
              keepIsSubmitted: false,
              keepTouched: false,
              keepIsValid: false,
              keepSubmitCount: false,
            }
          );

          resolve(response);
        } finally {
          setIsSubmitting(false);
        }
      })();
    });
  };

  // For debugging validation state
  useEffect(() => {
    console.log("Form state:", { isValid, isDirty, errors: Object.keys(errors).length });
  }, [isValid, isDirty, errors]);

  // Custom validation check to determine if the form is ready to submit
  const isFormValid = useMemo(() => {
    // Form must be dirty (user has interacted with it)
    if (!isDirty) return false;

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

      return true;
    } catch {
      return false;
    }
  }, [isDirty, errors, watch]);

  return (
    <FormWrapper
      title="Add URL to Monitor"
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      loadingMessage="Adding URL to monitoring..."
      successMessage="Successfully added URL to monitoring"
      errorMessage="Failed to add URL"
      submitButtonText="Add URL"
      isValid={isFormValid}
    >
      <div className="bg-muted mb-6 rounded-md p-4">
        <p className="text-muted-foreground text-sm">
          Add a URL that you want to track. You can either enter a full URL with
          &quot;https://&quot; or simply enter a domain name - the system will automatically add
          &quot;https://&quot; for you. Only public websites with http:// or https:// protocols are
          allowed. Add a title to describe the URL you are monitoring.
        </p>
      </div>
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
                try {
                  const parsedUrl = new URL(finalUrl);

                  // Verify scheme
                  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
                    console.log("onChange invalid URL scheme:", parsedUrl.protocol);
                    return;
                  }

                  // Verify not internal network
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
                    console.log("onChange blocked internal hostname:", hostname);
                    return;
                  }

                  console.log("onChange valid URL:", finalUrl);
                } catch {}
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
    </FormWrapper>
  );
}
