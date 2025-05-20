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

type Keyword = {
  id: string;
  keyword: string;
  category?: string;
  createdAt: string;
};

interface KeywordTabProps {
  keywords: Keyword[];
  loading: boolean;
  error: string;
  formatDate: (dateString: string | null | undefined) => string;
  confirmDelete: (type: "email" | "url" | "keyword", id: string) => void;
}

type SortField = "keyword" | "category" | "createdAt";
type SortDirection = "asc" | "desc";

export default function KeywordTab({
  keywords,
  loading,
  error,
  formatDate,
  confirmDelete,
}: KeywordTabProps) {
  const [sortField, setSortField] = useState<SortField>("keyword");
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

  // Sort keywords
  const sortedKeywords = [...keywords].sort((a, b) => {
    if (sortField === "keyword") {
      return sortDirection === "asc"
        ? a.keyword.localeCompare(b.keyword)
        : b.keyword.localeCompare(a.keyword);
    } else if (sortField === "category") {
      const categoryA = a.category || "";
      const categoryB = b.category || "";
      return sortDirection === "asc"
        ? categoryA.localeCompare(categoryB)
        : categoryB.localeCompare(categoryA);
    } else {
      // Sort by date
      return sortDirection === "asc"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedKeywords.length / itemsPerPage);
  const paginatedKeywords = sortedKeywords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Monitored Keywords</CardTitle>
            <CardDescription>Keywords being tracked for changes</CardDescription>
          </div>
          <Link href="/add/keyword">
            <Button variant="outline" size="sm" className="flex cursor-pointer items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Keywords
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
        ) : keywords.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-muted-foreground">No keywords added yet</p>
            <Link href="/add/keyword">
              <Button variant="outline" className="mt-4 flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Add Your First Keyword
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <Table>
              <TableCaption>A list of keywords being monitored</TableCaption>
              <TableHeader>
                <TableRow>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("keyword")}>
                          <div className="flex items-center gap-1">
                            Keyword
                            {sortField === "keyword" &&
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
                          Keywords that are being monitored across URLs. Click to sort by keyword.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort("category")}
                        >
                          <div className="flex items-center gap-1">
                            Category
                            {sortField === "category" &&
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
                          Group or classification of the keyword to organize monitoring. Click to
                          sort by category.
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
                          The date when this keyword was added to the monitoring list. Click to sort
                          by date.
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
                          Available operations for each keyword including edit settings and delete.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedKeywords.map((keywordItem) => (
                  <TableRow key={keywordItem.id}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TableCell className="font-medium">{keywordItem.keyword}</TableCell>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{keywordItem.keyword}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TableCell>{keywordItem.category || "-"}</TableCell>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Category: {keywordItem.category || "No category assigned"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TableCell>{formatDate(keywordItem.createdAt)}</TableCell>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Added on: {formatDate(keywordItem.createdAt)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/edit/keyword/${keywordItem.id}`}>
                                <Button variant="ghost" size="icon">
                                  <PencilIcon className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit {keywordItem.keyword}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => confirmDelete("keyword", keywordItem.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete {keywordItem.keyword} from monitoring</p>
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
                  {Math.min(currentPage * itemsPerPage, keywords.length)} of {keywords.length}{" "}
                  keywords
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
