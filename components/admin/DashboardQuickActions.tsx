'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Copy, Package, Layers, ArrowRight, ExternalLink, X } from 'lucide-react';
import { useAdminModal } from './AdminModalContext';
import { PortfolioPostsManager } from './PortfolioPostsManager';
import { ServicesManager, ServiceItem } from './ServicesManager';
import { EquipmentManager, EquipmentItem } from './EquipmentManager';

interface DashboardQuickActionsProps {
  initialServices?: ServiceItem[];
  initialEquipment?: EquipmentItem[];
}

export const DashboardQuickActions: React.FC<DashboardQuickActionsProps> = ({
  initialServices = [],
  initialEquipment = [],
}) => {
  const { openNewGallery } = useAdminModal();
  const [activeModal, setActiveModal] = useState<'portfolio' | 'packs' | 'equipment' | null>(null);

  const closeModal = () => setActiveModal(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeModal) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal]);

  return (
    <>
      {/* Quick Actions List in Dashboard Widget */}
      <div className="space-y-2">
        {/* Action 1: Create New Client Gallery */}
        <button
          type="button"
          onClick={openNewGallery}
          className="w-full flex items-center justify-between p-3 rounded-[8px] bg-[#182220] hover:bg-[#1E2B28] border border-white/[0.06] hover:border-teal/30 text-xs text-[#F4F3ED] transition-all group active:scale-[0.98] cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-teal/10 border border-teal/20 text-teal flex items-center justify-center">
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="font-medium">Create New Client Gallery</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[#9EABA2] group-hover:text-teal group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* Action 2: Manage Portfolio Posts */}
        <button
          type="button"
          onClick={() => setActiveModal('portfolio')}
          className="w-full flex items-center justify-between p-3 rounded-[8px] bg-[#182220] hover:bg-[#1E2B28] border border-white/[0.06] hover:border-teal/30 text-xs text-[#F4F3ED] transition-all group active:scale-[0.98] cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-teal/10 border border-teal/20 text-teal flex items-center justify-center">
              <Copy className="w-3.5 h-3.5" />
            </div>
            <span className="font-medium">Manage Portfolio Posts</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[#9EABA2] group-hover:text-teal group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* Action 3: Edit Wedding Packs & Pricing */}
        <button
          type="button"
          onClick={() => setActiveModal('packs')}
          className="w-full flex items-center justify-between p-3 rounded-[8px] bg-[#182220] hover:bg-[#1E2B28] border border-white/[0.06] hover:border-teal/30 text-xs text-[#F4F3ED] transition-all group active:scale-[0.98] cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-teal/10 border border-teal/20 text-teal flex items-center justify-center">
              <Package className="w-3.5 h-3.5" />
            </div>
            <span className="font-medium">Edit Wedding Packs &amp; Pricing</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[#9EABA2] group-hover:text-teal group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* Action 4: Manage Studio Equipment */}
        <button
          type="button"
          onClick={() => setActiveModal('equipment')}
          className="w-full flex items-center justify-between p-3 rounded-[8px] bg-[#182220] hover:bg-[#1E2B28] border border-white/[0.06] hover:border-teal/30 text-xs text-[#F4F3ED] transition-all group active:scale-[0.98] cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-teal/10 border border-teal/20 text-teal flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <span className="font-medium">Manage Studio Equipment</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[#9EABA2] group-hover:text-teal group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>

      {/* Portfolio Posts Centered Modal */}
      {activeModal === 'portfolio' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs select-none"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-[#0B0F0E] border border-white/10 rounded-[14px] max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#131918] shrink-0">
              <div className="flex items-center gap-2.5">
                <Copy className="w-4 h-4 text-teal" />
                <h3 className="font-serif text-lg text-white font-medium">
                  Portfolio Posts Management
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 text-[#9EABA2] hover:text-white rounded-[8px] hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-[#0F1413]">
              <PortfolioPostsManager />
            </div>
          </div>
        </div>
      )}

      {/* Wedding Packs Centered Modal */}
      {activeModal === 'packs' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs select-none"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-[#0B0F0E] border border-white/10 rounded-[14px] max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#131918] shrink-0">
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-teal" />
                <h3 className="font-serif text-lg text-white font-medium">
                  Wedding Packs &amp; Pricing Management
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 text-[#9EABA2] hover:text-white rounded-[8px] hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-[#0F1413]">
              <ServicesManager initialServices={initialServices} />
            </div>
          </div>
        </div>
      )}

      {/* Studio Equipment Centered Modal */}
      {activeModal === 'equipment' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs select-none"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-[#0B0F0E] border border-white/10 rounded-[14px] max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#131918] shrink-0">
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-teal" />
                <h3 className="font-serif text-lg text-white font-medium">
                  Studio Equipment Management
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 text-[#9EABA2] hover:text-white rounded-[8px] hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-[#0F1413]">
              <EquipmentManager initialEquipment={initialEquipment} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardQuickActions;
