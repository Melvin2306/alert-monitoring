"use client";

import { ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface FormWrapperProps {
  title: string;
  children: ReactNode;
  onSubmit: () => Promise<Response>;
  isSubmitting: boolean;
  loadingMessage: string;
  successMessage: string;
  errorMessage: string;
  submitButtonText: string;
  isValid?: boolean;
}

/**
 * A reusable form wrapper component for consistent form styling and behavior
 */
export function FormWrapper({
  title,
  children,
  onSubmit,
  isSubmitting,
  loadingMessage,
  successMessage,
  errorMessage,
  submitButtonText,
  isValid = true,
}: FormWrapperProps) {
  const handleSubmit = async () => {
    toast.promise(
      // The promise
      onSubmit().then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || errorMessage);
        }
        return response.json();
      }),

      // The loading/success/error messages
      {
        loading: loadingMessage,
        //@ts-expect-error Throws an error type but still works
        success: () => ({
          title: successMessage,
          description: "Success! What would you like to do next?",
          action: {
            label: "Add More",
            onClick: () => {
              // Form is already reset in the onSubmit function
            },
          },
          cancel: {
            label: "Go to Dashboard",
            onClick: () => {
              window.location.href = "/";
            },
          },
        }),
        error: (error) => `Error: ${error.message || errorMessage}`,
      }
    );
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-2xl font-bold">{title}</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-4"
      >
        {children}

        <Button
          variant="default"
          type="submit"
          disabled={isSubmitting || !isValid}
          className="w-full rounded-md px-4 py-2 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
        >
          {isSubmitting ? `${submitButtonText}...` : submitButtonText}
        </Button>
      </form>
    </div>
  );
}

/**
 * A reusable form field component for consistent field styling
 */
export function FormField({
  label,
  id,
  type,
  placeholder,
  register,
  error,
  isOptional = false,
  isDisabled = false,
}: {
  label: string;
  id: string;
  type: string;
  placeholder: string;
  register: Record<string, unknown>;
  error?: { message?: string };
  isOptional?: boolean;
  isDisabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="block text-sm font-medium">
        {label}
        {isOptional && " (Optional)"}
      </Label>
      <Input
        {...register}
        id={id}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none"
        disabled={isDisabled}
      />
      {error && error.message && <p className="text-sm text-red-500">{error.message}</p>}
    </div>
  );
}
