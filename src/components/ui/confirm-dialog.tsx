'use client';

import * as React from 'react';
import { Modal } from './modal';
import { Button } from './button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-md">
      <div className="flex gap-4">
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-650 dark:text-red-400">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 border-t border-slate-100 dark:border-slate-800/80 pt-4">
        <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button variant="danger" size="sm" onClick={onConfirm} isLoading={isLoading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
