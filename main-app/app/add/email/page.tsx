"use client";

import { FormField, FormWrapper } from "@/components/FormWrapper";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Define the schema for just an email address
const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Infer the type from the schema
type EmailValues = z.infer<typeof emailSchema>;

/**
 * Email form component for adding email addresses to receive alerts
 * @returns React component for adding email addresses to the alert system
 */
export default function EmailForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Setup react-hook-form with zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
  } = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
    mode: "onChange", // Validate on change instead of just on submit
  });

  /**
   * Handles form submission for adding an email address
   */
  const onSubmit = async (): Promise<Response> => {
    return new Promise<Response>((resolve) => {
      handleSubmit(async (data) => {
        setIsSubmitting(true);
        try {
          const response = await fetch("/api/email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });

          reset();
          resolve(response);
        } finally {
          setIsSubmitting(false);
        }
      })();
    });
  };

  return (
    <FormWrapper
      title="Add Email address to ALERT"
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      loadingMessage="Adding your email to alerts..."
      successMessage="Email successfully added to alert system"
      errorMessage="Failed to add email"
      submitButtonText="Add Email"
      isValid={isValid && isDirty}
    >
      <div className="bg-muted mb-6 rounded-md p-4">
        <p className="text-muted-foreground text-sm">
          Add an email address to receive alerts about your monitored URLs and keywords.
        </p>
      </div>
      <FormField
        label="Email Address"
        id="email"
        type="email"
        placeholder="your@email.com"
        register={register("email")}
        error={errors.email}
        isDisabled={isSubmitting}
      />
    </FormWrapper>
  );
}
