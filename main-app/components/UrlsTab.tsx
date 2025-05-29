import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { SortDirection, UrlSortField, UrlsTabProps } from "@/lib/types";
import { getChangeDetectionBaseUrl } from "@/lib/utils";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  PencilIcon,
  PlusCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function UrlsTab({
  urls,
  loading,
  error,
  formatDate,
  getStatusColor,
  handleRefreshAllUrls,
  handleRefreshUrl,
  confirmDelete,
}: UrlsTabProps) {
  const [sortField, setSortField] = useState<UrlSortField>("url");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Handle sorting
  const handleSort = (field: UrlSortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort URLs
  const sortedUrls = [...urls].sort((a, b) => {
    if (sortField === "url") {
      return sortDirection === "asc" ? a.url.localeCompare(b.url) : b.url.localeCompare(a.url);
    } else if (sortField === "title") {
      const titleA = a.title || "";
      const titleB = b.title || "";
      return sortDirection === "asc" ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
    } else if (sortField === "lastChecked") {
      const dateA = a.lastChecked ? new Date(a.lastChecked).getTime() : 0;
      const dateB = b.lastChecked ? new Date(b.lastChecked).getTime() : 0;
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    } else if (sortField === "lastChanged") {
      const dateA = a.lastChanged ? new Date(a.lastChanged).getTime() : 0;
      const dateB = b.lastChanged ? new Date(b.lastChanged).getTime() : 0;
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    } else {
      // Sort by status
      const statusA = a.status || "pending";
      const statusB = b.status || "pending";
      return sortDirection === "asc"
        ? statusA.localeCompare(statusB)
        : statusB.localeCompare(statusA);
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedUrls.length / itemsPerPage);
  const paginatedUrls = sortedUrls.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <CardTitle className="text-xl">Monitored URLs</CardTitle>
              <CardDescription>Websites and APIs being tracked for changes</CardDescription>
            </div>
            <a
              href={`${getChangeDetectionBaseUrl()}/`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open changedetection.io dashboard"
              title="Open changedetection.io dashboard"
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4 text-blue-500" />
                      Changedetection.io
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Open changedetection.io dashboard in a new tab</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </a>
          </div>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex cursor-pointer items-center gap-2"
                    onClick={handleRefreshAllUrls}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh All
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh all URLs</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Link href="/add/url">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add URL
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add a new URL to monitor</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <RefreshCw className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : urls.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-muted-foreground">No URLs added yet</p>
            <Link href="/add/url">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="mt-4 flex cursor-pointer items-center gap-2"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Your First URL
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add your first URL to monitor</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Link>
          </div>
        ) : (
          <>
            <Table>
              <TableCaption>A list of URLs currently being monitored</TableCaption>
              <TableHeader>
                <TableRow>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("url")}>
                          <div className="flex items-center gap-1">
                            URL
                            {sortField === "url" &&
                              (sortDirection === "asc" ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : (
                                <ArrowDown className="h-4 w-4" />
                              ))}
                          </div>
                        </TableHead>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>The web address being monitored for changes. Click to sort by URL.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("title")}>
                          <div className="flex items-center gap-1">
                            Title
                            {sortField === "title" &&
                              (sortDirection === "asc" ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : (
                                <ArrowDown className="h-4 w-4" />
                              ))}
                          </div>
                        </TableHead>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Custom name for the URL - can be used to identify ransomware groups or
                          describe the purpose of monitoring. Click to sort by title.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort("lastChecked")}
                        >
                          <div className="flex items-center gap-1">
                            Last Checked
                            {sortField === "lastChecked" &&
                              (sortDirection === "asc" ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : (
                                <ArrowDown className="h-4 w-4" />
                              ))}
                          </div>
                        </TableHead>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          The most recent time the system checked this URL for changes. Click to
                          sort by check time.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort("lastChanged")}
                        >
                          <div className="flex items-center gap-1">
                            Last Changed
                            {sortField === "lastChanged" &&
                              (sortDirection === "asc" ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : (
                                <ArrowDown className="h-4 w-4" />
                              ))}
                          </div>
                        </TableHead>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          The most recent time any content change was detected on this URL. Click to
                          sort by change time.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                          <div className="flex items-center gap-1">
                            Status
                            {sortField === "status" &&
                              (sortDirection === "asc" ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : (
                                <ArrowDown className="h-4 w-4" />
                              ))}
                          </div>
                        </TableHead>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Current monitoring status showing if the URL has changed, is unchanged,
                          pending check, or has errors. Click to sort by status.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TableHead className="text-right">Actions</TableHead>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Available operations for each URL including refresh, view details, edit
                          settings, and delete.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUrls.map((url) => (
                  <TableRow key={url.id}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TableCell className="max-w-xs truncate font-medium">{url.url}</TableCell>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{url.url}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TableCell>{url.title || "-"}</TableCell>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {url.title ||
                              "No title set yet. Set a title by clicking the 'edit' button"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TableCell>{formatDate(url.lastChecked)}</TableCell>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Last time the URL was checked: {formatDate(url.lastChecked)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TableCell>{formatDate(url.lastChanged)}</TableCell>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Last time the URL was changed: {formatDate(url.lastChanged)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TableCell>
                            <span className={getStatusColor(url.status)}>
                              {url.status === "error"
                                ? "Error - Check the changedetection instance"
                                : url.status || "Pending"}
                            </span>
                          </TableCell>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {url.status === "error"
                              ? `Error detected: ${url.errorText || "Unknown error"}`
                              : url.status === "changed"
                                ? "This URL has changed since it was last checked"
                                : url.status === "unchanged"
                                  ? "This URL has not changed since it was last checked"
                                  : url.status === "pending"
                                    ? "This URL is currently being checked"
                                    : "Status unknown"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRefreshUrl(url.id)}
                                disabled={url.status === "pending"}
                              >
                                <RefreshCw
                                  className={`h-4 w-4 ${url.status === "pending" ? "animate-spin" : ""}`}
                                />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Refresh this URL</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a
                                href={`${getChangeDetectionBaseUrl()}/preview/${url.id}#text`}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="View in changedetection.io"
                                title="View in changedetection.io"
                              >
                                <Button variant="ghost" size="icon">
                                  <ExternalLink className="h-4 w-4 text-blue-500" />
                                </Button>
                              </a>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View in changedetection.io</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/edit/url/${url.id}`}>
                                <Button variant="ghost" size="icon">
                                  <PencilIcon className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit {url.url}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => confirmDelete("url", url.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete {url.url} from monitoring</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-muted-foreground text-sm">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, urls.length)} of {urls.length} URLs
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-muted-foreground text-sm">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
