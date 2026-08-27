'use client';

import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { SkeletonState } from '../states/SkeletonState';
import { EmptyState } from '../states/EmptyState';
import { ErrorState } from '../states/ErrorState';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  state?: 'normal' | 'loading' | 'empty' | 'error';
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  pageSize?: number;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  state = 'normal',
  onRetry,
  emptyTitle = 'Belum Ada Data Tabel',
  emptyDescription = 'Tidak ada entri data yang tersedia untuk ditampilkan.',
  pageSize = 5,
  className = '',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  if (state === 'loading') {
    return <SkeletonState variant="table" rows={pageSize} className={className} />;
  }

  if (state === 'error') {
    return <ErrorState onRetry={onRetry} className={className} />;
  }

  if (state === 'empty' || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        className={className}
      />
    );
  }

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else setSortKey(null);
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  let processedData = [...data];
  if (sortKey) {
    processedData.sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const totalPages = Math.ceil(processedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = processedData.slice(startIndex, startIndex + pageSize);

  return (
    <div className={`w-full border border-outline-variant bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left font-body text-body-md border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface font-body text-label-md">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-md py-sm font-semibold select-none"
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className={`flex items-center gap-xs ${col.sortable ? 'cursor-pointer hover:text-primary' : ''}`}>
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-on-surface-variant">
                        {sortKey === col.key ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp className="w-4 h-4 text-primary" />
                          ) : (
                            <ArrowDown className="w-4 h-4 text-primary" />
                          )
                        ) : (
                          <ArrowUpDown className="w-4 h-4" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {paginatedData.map((row, idx) => (
              <tr key={idx} className="hover:bg-surface-container-low/50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-md py-sm text-on-surface text-body-sm">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between gap-sm px-md py-sm bg-surface-container-low border-t border-outline-variant text-body-sm text-on-surface-variant">
        <span>
          Menampilkan {startIndex + 1} - {Math.min(startIndex + pageSize, processedData.length)} dari {processedData.length} data
        </span>
        <div className="flex items-center gap-xs">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1 rounded border border-outline-variant hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold px-xs">
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1 rounded border border-outline-variant hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Halaman Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
