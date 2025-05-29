/**
 * API functions for the dashboard
 */

import { Url } from "./types";

/**
 * Fetches all URLs from the API
 * @returns Promise with the fetched URL data
 */
export const fetchUrls = async (): Promise<Url[]> => {
  const encodedApiKey = localStorage.getItem("CHANGEDETECTION_API_KEY") || "";

  const response = await fetch("/api/all-urls", {
    headers: {
      "x-api-key": encodedApiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.watches || [];
};

/**
 * Handles refreshing all URLs to check for changes
 * @returns Promise that resolves when completed
 */
export const refreshAllUrls = async (): Promise<Url[]> => {
  const encodedApiKey = localStorage.getItem("CHANGEDETECTION_API_KEY") || "";

  // First, trigger the recheck process using the ?recheck_all=1 parameter as per API docs
  const triggerResponse = await fetch("/api/all-urls?recheck_all=1", {
    headers: {
      "x-api-key": encodedApiKey,
    },
  });

  if (!triggerResponse.ok) {
    const errorData = await triggerResponse.json().catch(() => ({}));
    throw new Error(
      `Error ${triggerResponse.status}: ${errorData.message || triggerResponse.statusText}`
    );
  }

  // Give the system a moment to process the recheck requests
  // Then fetch the updated data after a short delay
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const dataResponse = await fetch("/api/all-urls", {
          headers: {
            "x-api-key": encodedApiKey,
          },
        });

        if (!dataResponse.ok) {
          throw new Error(`Error ${dataResponse.status}: ${dataResponse.statusText}`);
        }

        const data = await dataResponse.json();
        resolve(data.watches || []);
      } catch (error) {
        reject(error);
      }
    }, 2000); // Wait 2 seconds before fetching updated data
  });
};

/**
 * Handles refreshing a specific URL to check for changes
 * @param id - The unique identifier of the URL to refresh
 * @returns Promise that resolves when completed
 */
export const refreshUrl = async (id: string): Promise<Url[]> => {
  const encodedApiKey = localStorage.getItem("CHANGEDETECTION_API_KEY") || "";

  // Call our backend API to trigger the refresh
  const triggerResponse = await fetch(`/api/url`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": encodedApiKey,
    },
    body: JSON.stringify({ watchId: id }),
  });

  if (!triggerResponse.ok) {
    const errorData = await triggerResponse.json().catch(() => ({}));
    throw new Error(
      `Error ${triggerResponse.status}: ${errorData.message || triggerResponse.statusText}`
    );
  }

  // Give the system a moment to process the recheck request
  // Then fetch the updated data after a short delay
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const dataResponse = await fetch("/api/all-urls", {
          headers: {
            "x-api-key": encodedApiKey,
          },
        });

        if (!dataResponse.ok) {
          throw new Error(`Error ${dataResponse.status}: ${dataResponse.statusText}`);
        }

        const data = await dataResponse.json();
        resolve(data.watches || []);
      } catch (error) {
        reject(error);
      }
    }, 2000); // Wait 2 seconds before fetching updated data
  });
};

/**
 * Deletes a URL by ID
 * @param id - The unique identifier of the URL to delete
 * @returns Promise that resolves when completed
 */
export const deleteUrl = async (id: string): Promise<void> => {
  const encodedApiKey = localStorage.getItem("CHANGEDETECTION_API_KEY") || "";

  const response = await fetch(`/api/url?watchId=${id}`, {
    method: "DELETE",
    headers: {
      "x-api-key": encodedApiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
};
