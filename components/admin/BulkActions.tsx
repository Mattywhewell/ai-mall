/**
 * Bulk Actions Component
 * Handle bulk approve/reject operations for pending products
 */

'use client';

import { Check, X, XCircle } from 'lucide-react';

interface BulkActionsProps {
  selectedCount: number;
  onApprove: () => void;
  onReject: () => void;
  onClear: () => void;
}

export function BulkActions({ selectedCount, onApprove, onReject, onClear }: BulkActionsProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-blue-900">
          {selectedCount} product{selectedCount !== 1 ? 's' : ''} selected
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onApprove}
          className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-600 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <Check className="w-4 h-4 mr-2" />
          Bulk Approve
        </button>

        <button
          onClick={onReject}
          className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <X className="w-4 h-4 mr-2" />
          Bulk Reject
        </button>

        <button
          onClick={onClear}
          className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-gray-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Clear
        </button>
      </div>
    </div>
  );
}