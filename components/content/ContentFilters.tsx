"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X, Filter, ArrowUpDown } from "lucide-react";
import { PlatformType, ContentStatus } from "@prisma/client";

interface FilterState {
  search: string;
  platform?: PlatformType;
  status?: ContentStatus;
  startDate?: string;
  endDate?: string;
  sortBy: "createdAt" | "updatedAt" | "publishedAt" | "title";
  sortOrder: "asc" | "desc";
}

interface ContentFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  debounceMs?: number;
}

export function ContentFilters({
  onFilterChange,
  debounceMs = 300,
}: ContentFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange(filters);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [filters, onFilterChange, debounceMs]);

  const updateFilter = useCallback(
    (key: keyof FilterState, value: any) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearSearch = () => {
    updateFilter("search", "");
  };

  const clearFilters = () => {
    setFilters({
      search: filters.search, // Keep search
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  const hasActiveFilters =
    filters.platform || filters.status || filters.startDate || filters.endDate;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search content..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {filters.search && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-md transition-colors ${
              hasActiveFilters
                ? "border-blue-500 text-blue-700 bg-blue-50"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filter
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                {[
                  filters.platform,
                  filters.status,
                  filters.startDate,
                  filters.endDate,
                ].filter(Boolean).length}
              </span>
            )}
          </button>

          {isFilterOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsFilterOpen(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                <div className="p-4 space-y-4">
                  {/* Platform Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Platform
                    </label>
                    <select
                      value={filters.platform || ""}
                      onChange={(e) =>
                        updateFilter(
                          "platform",
                          e.target.value || undefined
                        )
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All platforms</option>
                      <option value="HASHNODE">Hashnode</option>
                      <option value="DEVTO">Dev.to</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LINKEDIN">LinkedIn</option>
                      <option value="TWITTER">Twitter</option>
                      <option value="FACEBOOK">Facebook</option>
                      <option value="REDDIT">Reddit</option>
                      <option value="NEWSLETTER">Newsletter</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={filters.status || ""}
                      onChange={(e) =>
                        updateFilter("status", e.target.value || undefined)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All statuses</option>
                      <option value="DRAFT">Draft</option>
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="FAILED">Failed</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>

                  {/* Date Range */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Date Range
                    </label>
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={filters.startDate || ""}
                        onChange={(e) =>
                          updateFilter("startDate", e.target.value || undefined)
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Start date"
                      />
                      <input
                        type="date"
                        value={filters.endDate || ""}
                        onChange={(e) =>
                          updateFilter("endDate", e.target.value || undefined)
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="End date"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <button
                      onClick={clearFilters}
                      className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
          >
            <ArrowUpDown className="w-4 h-4" />
            Sort
          </button>

          {isSortOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsSortOpen(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                <div className="p-2">
                  <button
                    onClick={() => {
                      updateFilter("sortBy", "createdAt");
                      updateFilter("sortOrder", "desc");
                      setIsSortOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${
                      filters.sortBy === "createdAt" &&
                      filters.sortOrder === "desc"
                        ? "bg-blue-50 text-blue-700"
                        : ""
                    }`}
                  >
                    Newest first
                  </button>
                  <button
                    onClick={() => {
                      updateFilter("sortBy", "createdAt");
                      updateFilter("sortOrder", "asc");
                      setIsSortOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${
                      filters.sortBy === "createdAt" &&
                      filters.sortOrder === "asc"
                        ? "bg-blue-50 text-blue-700"
                        : ""
                    }`}
                  >
                    Oldest first
                  </button>
                  <button
                    onClick={() => {
                      updateFilter("sortBy", "updatedAt");
                      updateFilter("sortOrder", "desc");
                      setIsSortOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${
                      filters.sortBy === "updatedAt"
                        ? "bg-blue-50 text-blue-700"
                        : ""
                    }`}
                  >
                    Recently updated
                  </button>
                  <button
                    onClick={() => {
                      updateFilter("sortBy", "title");
                      updateFilter("sortOrder", "asc");
                      setIsSortOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${
                      filters.sortBy === "title" ? "bg-blue-50 text-blue-700" : ""
                    }`}
                  >
                    Title (A-Z)
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
