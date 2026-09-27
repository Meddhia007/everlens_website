'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { NewGalleryModal } from './modals/NewGalleryModal';

export type QuickModalType = 'newGallery' | 'portfolio' | 'packs' | 'equipment' | null;

interface AdminModalContextType {
  activeModal: QuickModalType;
  openModal: (type: QuickModalType) => void;
  closeModal: () => void;
  openNewGallery: () => void;
}

const AdminModalContext = createContext<AdminModalContextType | undefined>(undefined);

export const AdminModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeModal, setActiveModal] = useState<QuickModalType>(null);

  const openModal = (type: QuickModalType) => setActiveModal(type);
  const closeModal = () => setActiveModal(null);
  const openNewGallery = () => setActiveModal('newGallery');

  return (
    <AdminModalContext.Provider value={{ activeModal, openModal, closeModal, openNewGallery }}>
      {children}
      <NewGalleryModal
        isOpen={activeModal === 'newGallery'}
        onClose={closeModal}
      />
    </AdminModalContext.Provider>
  );
};

export const useAdminModal = () => {
  const context = useContext(AdminModalContext);
  if (!context) {
    throw new Error('useAdminModal must be used within an AdminModalProvider');
  }
  return context;
};

export default AdminModalContext;
