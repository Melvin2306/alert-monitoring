/**
 * Custom React hooks for the dashboard
 */

import { useEffect, useState } from "react";
import { deleteUrl, fetchUrls, refreshAllUrls, refreshUrl } from "./api";
import { Url } from "./types";

/**
 * Custom hook for managing URLs in the dashboard
 * @returns URL-related state and handlers
 */
export const useUrlsManagement = () => {
  const [urls, setUrls] = useState<Url[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch URLs on component mount
  useEffect(() => {
    const fetchUrlsData = async () => {
      try {
        setLoading(true);
        const data = await fetchUrls();
        setUrls(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    };

    fetchUrlsData();
  }, []);

  // Handler for refreshing all URLs
  const handleRefreshAllUrls = async () => {
    try {
      setLoading(true);

      // Mark all URLs as pending during refresh
      const pendingUrls: Url[] = urls.map((url) => ({
        ...url,
        status: "pending",
      }));
      setUrls(pendingUrls);

      const updatedUrls = await refreshAllUrls();
      setUrls(updatedUrls);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);

      // Reset URLs to their previous state but with error status
      const errorUrls: Url[] = urls.map((url) => ({
        ...url,
        status: "error",
        errorText: err instanceof Error ? err.message : String(err),
      }));
      setUrls(errorUrls);
    }
  };

  // Handler for refreshing a specific URL
  const handleRefreshUrl = async (id: string) => {
    // Find the URL in the state
    const urlToRefresh = urls.find((url) => url.id === id);
    if (!urlToRefresh) return;

    try {
      // Update loading state for specific URL
      const updatedUrls: Url[] = [...urls];
      const urlIndex = updatedUrls.findIndex((u) => u.id === id);
      if (urlIndex >= 0) {
        updatedUrls[urlIndex] = { ...updatedUrls[urlIndex], status: "pending" };
        setUrls(updatedUrls);
      }

      setLoading(true);
      const refreshedUrls = await refreshUrl(id);
      setUrls(refreshedUrls);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);

      // Reset the URL status if there was an error
      const updatedUrls: Url[] = [...urls];
      const urlIndex = updatedUrls.findIndex((u) => u.id === id);
      if (urlIndex >= 0) {
        updatedUrls[urlIndex] = {
          ...updatedUrls[urlIndex],
          status: "error",
          errorText: err instanceof Error ? err.message : String(err),
        };
        setUrls(updatedUrls);
      }
    }
  };

  // Handler for deleting a URL
  const handleDeleteUrl = async (id: string) => {
    try {
      await deleteUrl(id);
      // Update state to remove the deleted URL
      setUrls(urls.filter((url) => url.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    }
  };

  return {
    urls,
    loading,
    error,
    handleRefreshAllUrls,
    handleRefreshUrl,
    handleDeleteUrl,
    setUrls,
  };
};
