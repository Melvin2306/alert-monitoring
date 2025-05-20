"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Globe, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Import our custom components
import DeleteConfirmationDialog from "../components/DeleteConfirmationDialog";
import EmailsTab from "../components/EmailsTab";
import KeywordsTab from "../components/KeywordsTab"; // Changed from CompaniesTab to KeywordsTab
import UrlsTab from "../components/UrlsTab";

// Import types and utility functions
import { formatDate, getStatusColor } from "@/lib/utils";
import { useUrlsManagement } from "../lib/hooks";
import { Email, Keyword } from "../lib/types";

/**
 * Main dashboard component for monitoring overview
 * @returns Dashboard React component
 */
export default function Dashboard() {
  // Use our custom hooks for URLs management
  const {
    urls,
    loading: urlsLoading,
    error: urlsError,
    handleRefreshAllUrls,
    handleRefreshUrl,
    handleDeleteUrl,
  } = useUrlsManagement();

  // State for other item types and UI
  const [emails, setEmails] = useState<Email[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]); // Changed from setCompanies to setKeywords
  const [loading, setLoading] = useState({
    emails: true,
    keywords: true,
  });
  const [error, setError] = useState({
    emails: "",
    keywords: "",
  });

  // Fetch emails on component mount
  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const response = await fetch("/api/email/list");
        const result = await response.json();

        if (result.success) {
          setEmails(result.data);
        } else {
          setError((prev) => ({
            ...prev,
            emails: result.message || "Failed to load emails",
          }));
        }
      } catch (err) {
        setError((prev) => ({ ...prev, emails: "Failed to load emails" }));
        console.error("Error fetching emails:", err);
      } finally {
        setLoading((prev) => ({ ...prev, emails: false }));
      }
    };

    // Initial fetch
    fetchEmails();

    // Setup an interval to refresh the emails every minute
    const intervalId = setInterval(fetchEmails, 60000);

    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, []);

  // Fetch keywords on component mount
  useEffect(() => {
    const fetchKeywords = async () => {
      try {
        setLoading((prev) => ({ ...prev, keywords: true }));
        const response = await fetch("/api/keyword/list");
        const result = await response.json();

        if (result.success) {
          setKeywords(result.data);
        } else {
          setError((prev) => ({
            ...prev,
            keywords: result.message || "Failed to load keywords",
          }));
        }
      } catch (err) {
        setError((prev) => ({ ...prev, keywords: "Failed to load keywords" }));
        console.error("Error fetching keywords:", err);
      } finally {
        setLoading((prev) => ({ ...prev, keywords: false }));
      }
    };

    fetchKeywords();
    const intervalIdKeywords = setInterval(fetchKeywords, 60000); // Refresh keywords every minute
    return () => clearInterval(intervalIdKeywords);
  }, []);

  // State for deletion dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: "email" | "url" | "keyword"; // Changed from "company" to "keyword"
    id: string;
  } | null>(null);

  /**
   * Opens the confirmation dialog for deletion
   * @param type - The type of item to delete (email, url, or keyword)
   * @param id - The unique identifier of the item
   */
  const confirmDelete = (type: "email" | "url" | "keyword", id: string) => {
    // Changed from "company" to "keyword"
    setItemToDelete({ type, id });
    setIsDeleteDialogOpen(true);
  };

  /**
   * Handles refreshing a single URL with toast notification
   * @param id - The unique identifier of the URL to refresh
   */
  const handleSingleUrlRefresh = async (id: string) => {
    toast.promise(handleRefreshUrl(id), {
      loading: "Refreshing URL...",
      success: "URL refreshed successfully",
      error: (err) => `Failed to refresh URL: ${err instanceof Error ? err.message : String(err)}`,
    });
  };

  /**
   * Handles refreshing all URLs with toast notification
   */
  const handleRefreshAllUrlsWithToast = async () => {
    toast.promise(handleRefreshAllUrls(), {
      loading: "Refreshing all URLs...",
      success: "All URLs refreshed successfully",
      error: (err) => `Failed to refresh URLs: ${err instanceof Error ? err.message : String(err)}`,
    });
  };

  /**
   * Handles actually deleting a monitored item after confirmation
   */
  const handleDelete = async () => {
    if (!itemToDelete) return;

    const { type, id } = itemToDelete;

    // Close the dialog and reset the itemToDelete
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);

    if (type === "url") {
      toast.promise(
        // The promise
        new Promise(async (resolve, reject) => {
          try {
            const success = await handleDeleteUrl(id);
            if (success) {
              resolve(true);
            } else {
              reject(new Error("Failed to delete URL"));
            }
          } catch (error) {
            reject(error);
          }
        }),
        // The loading/success/error messages
        {
          loading: "Deleting URL...",
          success: "URL deleted successfully",
          error: "Failed to delete URL. Please try again.",
        }
      );
    } else if (type === "email") {
      toast.promise(
        // The promise
        new Promise(async (resolve, reject) => {
          try {
            const response = await fetch(`/api/email?id=${id}`, {
              // Changed to query parameter
              method: "DELETE",
            });

            const result = await response.json();

            if (result.success) {
              setEmails(emails.filter((email) => email.id !== id));
              resolve(true);
            } else {
              reject(new Error(result.message || "Failed to delete email"));
            }
          } catch (error) {
            reject(error);
          }
        }),
        // The loading/success/error messages
        {
          loading: "Deleting email subscription...",
          success: "Email subscription deleted successfully",
          error: "Failed to delete email subscription. Please try again.",
        }
      );
    } else if (type === "keyword") {
      // Changed from "company" to "keyword"
      toast.promise(
        new Promise(async (resolve, reject) => {
          try {
            const response = await fetch(`/api/keyword?id=${id}`, {
              // Changed to query parameter
              method: "DELETE",
            });
            const result = await response.json();
            if (result.success) {
              setKeywords(keywords.filter((kw) => kw.id !== id));
              resolve(true);
            } else {
              reject(new Error(result.message || "Failed to delete keyword"));
            }
          } catch (error) {
            reject(error);
          }
        }),
        {
          loading: "Deleting keyword...",
          success: "Keyword deleted successfully",
          error: "Failed to delete keyword. Please try again.",
        }
      );
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-6 text-3xl font-bold">Monitoring Dashboard</h1>

      <Tabs defaultValue="urls" className="w-full">
        <TabsList className="mb-8 grid grid-cols-3">
          <TabsTrigger value="urls" className="flex cursor-pointer items-center gap-2">
            <Globe className="h-4 w-4" />
            URLs
          </TabsTrigger>
          <TabsTrigger value="emails" className="flex cursor-pointer items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Addresses
          </TabsTrigger>
          <TabsTrigger value="keywords" className="flex cursor-pointer items-center gap-2">
            <Building2 className="h-4 w-4" />
            Keywords
          </TabsTrigger>
        </TabsList>

        {/* URLs Tab */}
        <TabsContent value="urls">
          <UrlsTab
            urls={urls}
            loading={urlsLoading}
            error={urlsError}
            formatDate={formatDate}
            getStatusColor={getStatusColor}
            handleRefreshAllUrls={handleRefreshAllUrlsWithToast}
            handleRefreshUrl={handleSingleUrlRefresh}
            confirmDelete={confirmDelete}
          />
        </TabsContent>

        {/* Email Addresses Tab */}
        <TabsContent value="emails">
          <EmailsTab
            emails={emails}
            loading={loading.emails}
            error={error.emails}
            formatDate={formatDate}
            confirmDelete={confirmDelete}
          />
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords">
          <KeywordsTab // Changed from CompaniesTab to KeywordsTab
            keywords={keywords}
            loading={loading.keywords}
            error={error.keywords}
            formatDate={formatDate}
            confirmDelete={confirmDelete}
          />
        </TabsContent>
      </Tabs>

      {/* Global delete confirmation dialog */}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onCancel={() => setItemToDelete(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}
