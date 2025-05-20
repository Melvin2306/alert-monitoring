"use client";

import { FormField, FormWrapper } from "@/components/FormWrapper";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Define the schema for keywords
const keywordSchema = z.object({
  keyword: z
    .string()
    .min(2, "Keyword must be at least 2 characters")
    .max(100, "Keyword must be less than 100 characters"),
  category: z.string().optional(),
});

// Infer the type from the schema
type KeywordValues = z.infer<typeof keywordSchema>;

/**
 * Keyword form component for editing keywords to monitor
 * @returns React component for editing keyword details
 */
export default function EditKeywordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const params = useParams();
  const router = useRouter();
  const keywordId = params.id as string;

  // Setup react-hook-form with zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<KeywordValues>({
    resolver: zodResolver(keywordSchema),
    defaultValues: {
      keyword: "",
      category: "",
    },
  });

  // Fetch the keyword details
  useEffect(() => {
    const fetchKeywordDetails = async () => {
      if (!keywordId) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/keyword?id=${keywordId}`);

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          setValue("keyword", data.data.keyword);
          if (data.data.category) {
            setValue("category", data.data.category);
          }
        } else {
          throw new Error(data.message || "Failed to load keyword details");
        }
      } catch (err) {
        console.error("Error fetching keyword details:", err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchKeywordDetails();
  }, [keywordId, setValue]);

  /**
   * Handles form submission for updating a keyword
   */
  const onSubmit = async (): Promise<Response> => {
    return new Promise<Response>((resolve) => {
      handleSubmit(async (data) => {
        try {
          setIsSubmitting(true);

          const response = await fetch("/api/keyword", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: keywordId,
              keyword: data.keyword,
              category: data.category || null,
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
          console.error("Error updating keyword:", err);
          setError(err instanceof Error ? err.message : String(err));
          resolve(new Response(null, { status: 500 }));
        } finally {
          setIsSubmitting(false);
        }
      })();
    });
  };

  if (isLoading) {
    return <div className="container mx-auto py-10">Loading keyword details...</div>;
  }

  if (error) {
    return <div className="container mx-auto py-10 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <FormWrapper
        title="Edit Keyword"
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        loadingMessage="Updating keyword..."
        successMessage="Successfully updated keyword"
        errorMessage="Failed to update keyword"
        submitButtonText="Update Keyword"
      >
        <FormField
          label="Keyword"
          id="keyword"
          type="text"
          placeholder="Enter a keyword to track"
          register={register("keyword")}
          error={errors.keyword}
          isDisabled={isSubmitting}
        />

        <FormField
          label="Category"
          id="category"
          type="text"
          placeholder="Optional category"
          register={register("category")}
          error={errors.category}
          isOptional={true}
          isDisabled={isSubmitting}
        />
      </FormWrapper>
    </div>
  );
}
