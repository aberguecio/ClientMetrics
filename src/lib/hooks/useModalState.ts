'use client';

import { useState, useCallback } from 'react';

/**
 * Custom hook for managing modal state
 *
 * Provides convenient state management for modals with optional editing data
 *
 * @param initialState - Initial open/closed state (default: false)
 * @returns Object containing isOpen state, editingItem, open, close, and openWithItem functions
 *
 * @example
 * const chartModal = useModalState<SavedChart>();
 * // Open empty modal
 * chartModal.open();
 * // Open modal with editing data
 * chartModal.openWithItem(existingChart);
 * // Close modal
 * chartModal.close();
 */
export function useModalState<T = any>(initialState: boolean = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  const [editingItem, setEditingItem] = useState<T | undefined>(undefined);

  const open = useCallback(() => {
    setIsOpen(true);
    setEditingItem(undefined);
  }, []);

  const openWithItem = useCallback((item: T) => {
    setIsOpen(true);
    setEditingItem(item);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setEditingItem(undefined);
  }, []);

  return {
    isOpen,
    editingItem,
    open,
    openWithItem,
    close
  };
}
