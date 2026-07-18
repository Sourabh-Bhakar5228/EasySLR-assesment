'use client';

import * as React from 'react';
import { UploadCloud, FileSpreadsheet, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploaderProps {
  selectedProjectName: string;
  onFileSelected: (file: File) => void;
  onReset: () => void;
  fileName: string;
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function FileUploader({
  selectedProjectName,
  onFileSelected,
  onReset,
  fileName,
}: FileUploaderProps) {
  const [dragActive, setDragActive] = React.useState<boolean>(false);
  const [validationError, setValidationError] = React.useState<string>('');

  const validateAndSelectFile = (file: File) => {
    setValidationError('');

    // Check extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      setValidationError('Invalid file type. Only Excel files (.xlsx, .xls) are allowed.');
      return;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError(`File is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    onFileSelected(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          2. Upload Excel File
        </h3>
        {selectedProjectName && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-750 dark:bg-primary-950/40 dark:text-primary-400 font-medium">
            Target: {selectedProjectName}
          </span>
        )}
      </div>

      {!fileName ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? 'border-primary-500 bg-primary-50/20 dark:bg-primary-950/10 shadow-inner'
              : 'border-slate-300 hover:border-primary-400 bg-slate-50/50 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/20 dark:hover:bg-slate-950/40'
          }`}
        >
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleChange}
            accept=".xlsx, .xls"
          />
          <div className="p-3.5 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800/60 mb-3 text-primary-500">
            <UploadCloud className="h-6.5 w-6.5" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-350">
            Drag & drop your Excel sheet here, or click to browse
          </p>
          <p className="text-xs text-slate-550 dark:text-slate-500 mt-1">
            Accepts .xlsx and .xls (Max {MAX_FILE_SIZE_MB}MB)
          </p>

          {validationError && (
            <div className="mt-4 flex items-center gap-2 text-xs text-red-650 bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg border border-red-100 dark:border-red-900/30">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span className="font-semibold">{validationError}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-lg bg-primary-50 dark:bg-primary-950/40 text-primary-600">
              <FileSpreadsheet className="h-5.5 w-5.5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {fileName}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                File loaded successfully
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8.5 w-8.5 p-0 rounded-lg text-slate-400 hover:text-red-500 dark:hover:bg-red-950/25 transition-colors"
            onClick={() => {
              setValidationError('');
              onReset();
            }}
          >
            <Trash2 className="h-4.5 w-4.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
