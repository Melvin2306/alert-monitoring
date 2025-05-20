"use client";

import { FormField, FormWrapper } from "@/components/FormWrapper";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Define the schema for keywords
const keywordsSchema = z.object({
  keyword: z
    .string()
    .min(2, "Keyword must be at least 2 characters")
    .max(100, "Keyword must be less than 100 characters"),
  category: z.string().optional(),
});

// Infer the type from the schema
type KeywordsValues = z.infer<typeof keywordsSchema>;

/**
 * Keywords form component for adding keywords to monitor
 * @returns React component for adding keyword details
 */
export default function KeywordsForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Setup react-hook-form with zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
  } = useForm<KeywordsValues>({
    resolver: zodResolver(keywordsSchema),
    defaultValues: {
      keyword: "",
      category: "",
    },
    mode: "onChange", // Validate on change instead of just on submit
  });

  /**
   * Handles form submission for adding keywords
   */
  const onSubmit = async (): Promise<Response> => {
    return new Promise<Response>((resolve) => {
      handleSubmit(async (data) => {
        setIsSubmitting(true);
        try {
          const response = await fetch("/api/keyword", {
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
      title="Add Keywords to Monitor"
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      loadingMessage="Adding keywords to monitoring..."
      successMessage="Successfully added keywords to monitoring"
      errorMessage="Failed to add keywords"
      submitButtonText="Add Keywords"
      isValid={isValid && isDirty}
    >
      <div className="bg-muted mb-6 rounded-md p-4">
        <p className="text-muted-foreground text-sm">
          Add keywords that you want to get notified about. This could be a company name, industry,
          person&apos;s name, location, or any term you want to track.
        </p>
      </div>

      <FormField
        label="Keyword"
        id="keyword"
        type="text"
        placeholder="Example: Acme Corporation, Blockchain, John Smith"
        register={register("keyword")}
        error={errors.keyword}
        isDisabled={isSubmitting}
      />

      <FormField
        label="Category"
        id="category"
        type="text"
        placeholder="Keyword, Industry, Person, Location, etc."
        register={register("category")}
        error={errors.category}
        isOptional={true}
        isDisabled={isSubmitting}
      />
    </FormWrapper>
  );
}
