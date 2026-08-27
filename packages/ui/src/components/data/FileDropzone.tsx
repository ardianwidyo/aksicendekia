'use client';

import React, { useState } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import { SkeletonState } from '../states/SkeletonState';
import { EmptyState } from '../states/EmptyState';
import { ErrorState } from '../states/ErrorState';

export interface UploadedFile {
  id: string;
  name: string;
  size: string;
}

export interface FileDropzoneProps {
  onFilesSelected?: (files: FileList) => void;
  accept?: string;
  maxSizeText?: string;
  state?: 'normal' | 'loading' | 'empty' | 'error';
  onRetry?: () => void;
  className?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFilesSelected,
  accept = '.pdf,.png,.jpg,.docx',
  maxSizeText = 'Maksimal 10MB per berkas (PDF, PNG, JPG, DOCX)',
  state = 'normal',
  onRetry,
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [filesList, setFilesList] = useState<UploadedFile[]>([
    { id: '1', name: 'Materi_Kurikulum_Merdeka_Fase_A.pdf', size: '2.4 MB' },
  ]);

  if (state === 'loading') {
    return <SkeletonState variant="generic" className={className} />;
  }

  if (state === 'error') {
    return <ErrorState onRetry={onRetry} className={className} />;
  }

  if (state === 'empty') {
    return <EmptyState title="Dropzone Kosong" description="Belum ada berkas terunggah." className={className} />;
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected?.(e.dataTransfer.files);
    }
  };

  const removeFile = (id: string) => {
    setFilesList((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className={`w-full space-y-md ${className}`}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-lg flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[180px] ${
          isDragOver
            ? 'border-primary bg-primary-container/20'
            : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low'
        }`}
      >
        <div className="w-12 h-12 mb-xs rounded-full bg-primary-container/20 text-primary flex items-center justify-center">
          <UploadCloud className="w-6 h-6" />
        </div>
        <p className="font-body text-label-lg font-semibold text-on-surface">
          Seret & lepas berkas di sini, atau klik untuk memilih
        </p>
        <p className="font-body text-body-sm text-on-surface-variant mt-xs">
          {maxSizeText}
        </p>
      </div>

      {filesList.length > 0 && (
        <div className="space-y-xs">
          <p className="font-body text-label-md font-semibold text-on-surface">
            Berkas Terunggah ({filesList.length})
          </p>
          <div className="space-y-xs">
            {filesList.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-sm rounded-lg border border-outline-variant bg-surface-container-lowest"
              >
                <div className="flex items-center gap-xs overflow-hidden">
                  <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="font-body text-body-sm text-on-surface truncate">
                    {file.name}
                  </span>
                  <span className="font-body text-xs text-on-surface-variant flex-shrink-0">
                    ({file.size})
                  </span>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  aria-label="Hapus Berkas"
                  className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
