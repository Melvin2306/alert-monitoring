"use client";

import { FormField, FormWrapper } from "@/components/FormWrapper";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Define the schema for email validation
const emailSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required")
    .max(320, "Email must be less than 320 characters"),
});

// Infer the type from the schema
type EmailValues = z.infer<typeof emailSchema>;

/**
 * Email form component for editing email addresses
 * @returns React component for editing email details
 */
export default function EditEmailForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const params = useParams();
  const router = useRouter();
  const emailId = params.id as string;

  // Setup react-hook-form with zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  // Fetch the email details
  useEffect(() => {
    const fetchEmailDetails = async () => {
      if (!emailId) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/email?id=${emailId}`);

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          setValue("email", data.data.email);
        } else {
          throw new Error(data.message || "Failed to load email details");
        }
      } catch (err) {
        console.error("Error fetching email details:", err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmailDetails();
  }, [emailId, setValue]);

  /**
   * Handles form submission for updating an email
   */
  const onSubmit = async (): Promise<Response> => {
    return new Promise<Response>((resolve) => {
      handleSubmit(async (data) => {
        try {
          setIsSubmitting(true);

          const response = await fetch("/api/email", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: emailId,
              email: data.email,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
          }

          // Successfully updated
          router.push("/");
          resolve(response);
        } catch (err) {
          console.error("Error updating email:", err);
          setError(err instanceof Error ? err.message : String(err));
          resolve(new Response(null, { status: 500 }));
        } finally {
          setIsSubmitting(false);
        }
      })();
    });
  };

  if (isLoading) {
    return <div className="container mx-auto py-10">Loading email details...</div>;
  }

  if (error) {
    return <div className="container mx-auto py-10 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <FormWrapper
        title="Edit Email"
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        loadingMessage="Updating email..."
        successMessage="Successfully updated email"
        errorMessage="Failed to update email"
        submitButtonText="Update Email"
      >
        <FormField
          label="Email Address"
          id="email"
          type="email"
          placeholder="you@example.com"
          register={register("email")}
          error={errors.email}
          isDisabled={isSubmitting}
        />
      </FormWrapper>
    </div>
  );
}
