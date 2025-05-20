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
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  PencilIcon,
  PlusCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Email = {
  id: string;
  email: string;
  createdAt: string;
};

interface EmailsTabProps {
  emails: Email[];
  loading: boolean;
  error: string;
  formatDate: (dateString: string | null | undefined) => string;
  confirmDelete: (type: "email" | "url" | "keyword", id: string) => void;
}

type SortField = "email" | "createdAt";
type SortDirection = "asc" | "desc";

export default function EmailsTab({
  emails,
  loading,
  error,
  formatDate,
  confirmDelete,
}: EmailsTabProps) {
  const [sortField, setSortField] = useState<SortField>("email");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort emails
  const sortedEmails = [...emails].sort((a, b) => {
    if (sortField === "email") {
      return sortDirection === "asc"
        ? a.email.localeCompare(b.email)
        : b.email.localeCompare(a.email);
    } else {
      // Sort by date
      return sortDirection === "asc"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedEmails.length / itemsPerPage);
  const paginatedEmails = sortedEmails.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Email Addresses</CardTitle>
            <CardDescription>Email addresses that receive alerts</CardDescription>
          </div>
          <Link href="/add/email">
            <Button variant="outline" size="sm" className="flex cursor-pointer items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Email
            </Button>
          </Link>
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
        ) : emails.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-muted-foreground">No email addresses added yet</p>
            <Link href="/add/email">
              <Button variant="outline" className="mt-4 flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Add Your First Email
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <Table>
              <TableCaption>A list of email addresses for notifications</TableCaption>
              <TableHeader>
                <TableRow>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("email")}>
                          <div className="flex items-center gap-1">
                            Email Address
                            {sortField === "email" &&
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
                          Email addresses that receive alerts when monitored URLs change. Click to
                          sort by email.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort("createdAt")}
                        >
                          <div className="flex items-center gap-1">
                            Added On
                            {sortField === "createdAt" &&
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
                          The date when this email address was added to the notification list. Click
                          to sort by date.
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
                          Available operations for each email address including edit settings and
                          delete.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEmails.map((email) => (
                  <TableRow key={email.id}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TableCell className="font-medium">{email.email}</TableCell>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{email.email}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TableCell>{formatDate(email.createdAt)}</TableCell>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Added on: {formatDate(email.createdAt)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/edit/email/${email.id}`}>
                                <Button variant="ghost" size="icon">
                                  <PencilIcon className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit {email.email}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => confirmDelete("email", email.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete {email.email} from notifications</p>
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
                  {Math.min(currentPage * itemsPerPage, emails.length)} of {emails.length} emails
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
