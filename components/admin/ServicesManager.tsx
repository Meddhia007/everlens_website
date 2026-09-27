'use client';

import React, { useState } from 'react';
import {
  Camera,
  Film,
  Video,
  Gem,
  Crown,
  Sparkles,
  BookOpen,
  Layers,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Check,
  X,
  Tag,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { ConfirmDeleteModal } from './modals/ConfirmDeleteModal';

export interface ServiceItem {
  _id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  price?: string;
  description?: string;
  features?: string[];
  options?: string[];
  icon: string;
  order: number;
  active: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Camera,
  Film,
  Video,
  Gem,
  Crown,
  Sparkles,
  BookOpen,
  Layers,
};

interface ServicesManagerProps {
  initialServices: ServiceItem[];
}

export const ServicesManager: React.FC<ServicesManagerProps> = ({ initialServices }) => {
  const [services, setServices] = useState<ServiceItem[]>(initialServices);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<{ id: string; title: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    badge: '',
    price: 'Tarifs sur demande',
    description: '',
    featuresText: '',
    optionsText: '',
    icon: 'Camera',
    order: 0,
    active: true,
  });

  const openAddModal = () => {
    setEditingService(null);
    setFormData({
      title: '',
      subtitle: '',
      badge: '',
      price: 'Tarifs sur demande',
      description: '',
      featuresText: 'Photos numériques illimitées\nVidéo teaser 4K\nLivraison sur flash',
      optionsText: 'Préparatifs',
      icon: 'Camera',
      order: services.length + 1,
      active: true,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (service: ServiceItem) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      subtitle: service.subtitle || '',
      badge: service.badge || '',
      price: service.price || 'Tarifs sur demande',
      description: service.description || '',
      featuresText: (service.features || []).join('\n'),
      optionsText: (service.options || []).join('\n'),
      icon: service.icon || 'Camera',
      order: service.order || 0,
      active: service.active !== false,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    const featuresArray = formData.featuresText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const optionsArray = formData.optionsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const payload = {
      title: formData.title.trim(),
      subtitle: formData.subtitle.trim(),
      badge: formData.badge.trim(),
      price: formData.price.trim() || 'Tarifs sur demande',
      description: formData.description.trim(),
      features: featuresArray,
      options: optionsArray,
      icon: formData.icon,
      order: Number(formData.order) || 0,
      active: formData.active,
    };

    try {
      if (editingService) {
        // PUT update
        const res = await fetch(`/api/admin/services/${editingService._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update pack');

        setServices((prev) =>
          prev.map((s) => (s._id === editingService._id ? data.service : s))
        );
      } else {
        // POST create
        const res = await fetch('/api/admin/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create pack');

        setServices((prev) => [...prev, data.service]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return;

    setDeletingId(serviceToDelete.id);
    try {
      const res = await fetch(`/api/admin/services/${serviceToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete pack');
      }
      setServices((prev) => prev.filter((s) => s._id !== serviceToDelete.id));
      setServiceToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete pack');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#131918] p-4 rounded-sm border border-white/[0.08]">
        <div>
          <h3 className="text-sm font-medium text-white">Active Wedding Packs (Offres 2026)</h3>
          <p className="text-xs text-[#9EABA2] font-sans mt-0.5">
            Wedding packages currently presented to couples on the website. Features, options, badges, and ordering can be customized anytime.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xs bg-teal hover:bg-teal/90 text-[#0B0F0E] font-sans text-xs font-medium transition-all shadow-[0_0_20px_rgba(67,177,159,0.25)] hover:shadow-[0_0_25px_rgba(67,177,159,0.4)] self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Wedding Pack</span>
        </button>
      </div>

      {/* Packs Grid or Designed Empty State */}
      {services.length === 0 ? (
        <div className="py-16 px-6 text-center border border-white/[0.08] bg-[#131918] rounded-xs shadow-xl">
          <div className="w-12 h-12 rounded-full bg-teal/10 border border-teal/20 text-teal flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg text-[#F4F3ED] font-normal mb-1">
            No wedding packs configured
          </h3>
          <p className="text-xs text-[#9EABA2] max-w-sm mx-auto mb-4 font-sans">
            No packages are currently published to prospective couples. Create your first wedding pack to showcase services and pricing.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xs bg-teal hover:bg-teal/90 text-[#0B0F0E] font-sans text-xs font-medium transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Pack</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {services.map((service) => {
          const IconComp = ICON_MAP[service.icon] || Camera;
          const isBestOffer = service.badge?.toLowerCase().includes('meilleure');

          return (
            <div
              key={service._id}
              className={`p-5 rounded-sm border flex flex-col justify-between transition-all shadow-[0_4px_20px_rgba(0,0,0,0.35)] group relative ${
                service.active
                  ? isBestOffer
                    ? 'bg-[#151E1C] border-teal/40 hover:border-teal'
                    : 'bg-[#131918] border-white/[0.08] hover:border-teal/35 hover:bg-[#161E1D]'
                  : 'bg-[#0E1312] border-white/[0.04] opacity-60'
              }`}
            >
              <div>
                {/* Header Row: Icon + Title + Actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xs bg-teal/10 border border-teal/20 flex items-center justify-center text-teal shrink-0 group-hover:scale-105 transition-transform">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-serif text-sm font-semibold text-white uppercase leading-tight">
                          {service.title}
                        </h3>
                        {!service.active && (
                          <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 bg-white/10 text-[#9EABA2] rounded-full">
                            Hidden
                          </span>
                        )}
                      </div>
                      {service.subtitle && (
                        <p className="text-[11px] text-teal/90 font-sans mt-0.5">
                          {service.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(service)}
                      className="p-1.5 text-[#9EABA2] hover:text-white rounded-xs hover:bg-white/10 transition-colors cursor-pointer"
                      title="Edit pack"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceToDelete({ id: service._id, title: service.title })}
                      disabled={deletingId === service._id}
                      className="p-1.5 text-[#9EABA2]/60 hover:text-red-400 rounded-[8px] hover:bg-red-950/25 transition-colors cursor-pointer"
                      title="Delete pack"
                    >
                      {deletingId === service._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Badge Tag & Price */}
                <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
                  {service.badge && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold uppercase tracking-wider bg-teal/20 text-teal border border-teal/30">
                      <Tag className="w-2.5 h-2.5" />
                      {service.badge}
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-[#9EABA2]/80">
                    {service.price || 'Tarifs sur demande'}
                  </span>
                </div>

                {/* Included Features Preview */}
                <div className="mt-4 pt-3 border-t border-white/[0.08] space-y-1.5">
                  <div className="text-[10px] uppercase font-mono text-[#9EABA2]/60 flex items-center justify-between">
                    <span>Included ({(service.features || []).length})</span>
                    <span>Order #{service.order}</span>
                  </div>
                  <ul className="space-y-1">
                    {(service.features || []).slice(0, 5).map((feat, idx) => (
                      <li key={idx} className="text-[11px] text-white/80 font-sans flex items-start gap-1.5 line-clamp-1">
                        <CheckCircle2 className="w-3 h-3 text-teal shrink-0 mt-0.5" />
                        <span className="truncate">{feat}</span>
                      </li>
                    ))}
                    {(service.features || []).length > 5 && (
                      <li className="text-[10px] text-teal font-sans italic pl-4">
                        + {(service.features || []).length - 5} more features
                      </li>
                    )}
                  </ul>
                </div>

                {/* Options Preview */}
                {service.options && service.options.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-dashed border-white/[0.06]">
                    <span className="text-[10px] uppercase font-mono text-amber-300/80 font-medium block mb-1">
                      Options :
                    </span>
                    <p className="text-[11px] text-[#9EABA2] font-sans line-clamp-2">
                      {service.options.join(' · ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer status */}
              <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-sans">
                <span className="text-[#9EABA2]/60 font-mono text-[10px]">Icon: {service.icon}</span>
                <span className={`font-mono text-[11px] flex items-center gap-1.5 ${service.active ? 'text-teal' : 'text-[#9EABA2]/50'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${service.active ? 'bg-teal' : 'bg-white/30'}`} />
                  {service.active ? 'Active on site' : 'Inactive'}
                </span>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-[#131918] max-w-xl w-full rounded-[14px] border border-white/10 shadow-[0_10px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col my-8 animate-modal-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/[0.08] bg-[#0F1413] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-teal">Offres Mariage 2026</span>
                <h2 className="font-serif text-lg text-white font-medium">
                  {editingService ? 'Edit Wedding Pack' : 'Create New Wedding Pack'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-[#9EABA2] hover:text-white rounded-xs hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {errorMessage && (
                <div className="p-3 rounded-xs bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-sans">
                  {errorMessage}
                </div>
              )}

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-sans font-medium text-[#9EABA2] mb-1">
                    Pack Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PACK STANDARD"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full text-xs font-sans px-3 py-2 rounded-xs border border-white/10 bg-[#182220] text-white placeholder:text-white/30 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans font-medium text-[#9EABA2] mb-1">
                    Subtitle / Coverage
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Réception 2H or Le choix coup de cœur"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full text-xs font-sans px-3 py-2 rounded-xs border border-white/10 bg-[#182220] text-white placeholder:text-white/30 focus:outline-none focus:border-teal transition-colors"
                  />
                </div>
              </div>

              {/* Badge & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-sans font-medium text-[#9EABA2] mb-1">
                    Badge / Ribbon Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MEILLEURE OFFRE or SIGNATURE"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full text-xs font-sans px-3 py-2 rounded-xs border border-white/10 bg-[#182220] text-white placeholder:text-white/30 focus:outline-none focus:border-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans font-medium text-[#9EABA2] mb-1">
                    Price Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tarifs sur demande or 1 800 TND"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full text-xs font-sans px-3 py-2 rounded-xs border border-white/10 bg-[#182220] text-white placeholder:text-white/30 focus:outline-none focus:border-teal transition-colors"
                  />
                </div>
              </div>

              {/* Features Included (one per line) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-sans font-medium text-[#9EABA2]">
                    Included Features * (one per line)
                  </label>
                  <span className="text-[10px] text-teal font-mono">1 item = 1 bullet point</span>
                </div>
                <textarea
                  rows={6}
                  required
                  placeholder="Reportage vidéo 4K&#10;Aftermovie cinématique&#10;Photos numériques illimitées&#10;80 photos imprimées&#10;Shooting extérieur&#10;Drone"
                  value={formData.featuresText}
                  onChange={(e) => setFormData({ ...formData, featuresText: e.target.value })}
                  className="w-full text-xs font-sans px-3 py-2 rounded-xs border border-white/10 bg-[#182220] text-white placeholder:text-white/30 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-colors font-mono leading-relaxed"
                />
              </div>

              {/* Options / Add-ons (one per line) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-sans font-medium text-[#9EABA2]">
                    Add-on Options (one per line)
                  </label>
                  <span className="text-[10px] text-amber-300 font-mono">Optional</span>
                </div>
                <textarea
                  rows={3}
                  placeholder="Reel cinématique&#10;Préparatifs"
                  value={formData.optionsText}
                  onChange={(e) => setFormData({ ...formData, optionsText: e.target.value })}
                  className="w-full text-xs font-sans px-3 py-2 rounded-xs border border-white/10 bg-[#182220] text-white placeholder:text-white/30 focus:outline-none focus:border-teal transition-colors font-mono leading-relaxed"
                />
              </div>

              {/* Icon & Order & Active */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div>
                  <label className="block text-xs font-sans font-medium text-[#9EABA2] mb-1">
                    Emblem Icon
                  </label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full text-xs font-sans px-3 py-2 rounded-xs border border-white/10 bg-[#182220] text-white focus:outline-none focus:border-teal transition-colors"
                  >
                    <option value="Camera" className="bg-[#131918]">Camera (Photo)</option>
                    <option value="Video" className="bg-[#131918]">Video (Camera)</option>
                    <option value="Film" className="bg-[#131918]">Film (Cinema)</option>
                    <option value="Gem" className="bg-[#131918]">Gem (Diamond Standard)</option>
                    <option value="Crown" className="bg-[#131918]">Crown (Signature Luxury)</option>
                    <option value="Sparkles" className="bg-[#131918]">Sparkles (Super 8 / Glamour)</option>
                    <option value="BookOpen" className="bg-[#131918]">BookOpen (Album &amp; Prints)</option>
                    <option value="Layers" className="bg-[#131918]">Layers (Custom)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-sans font-medium text-[#9EABA2] mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    className="w-full text-xs font-sans px-3 py-2 rounded-xs border border-white/10 bg-[#182220] text-white focus:outline-none focus:border-teal transition-colors"
                  />
                </div>

                <div className="pt-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="serviceActive"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded-xs bg-[#182220] border-white/20 text-teal focus:ring-teal"
                  />
                  <label htmlFor="serviceActive" className="text-xs font-sans text-white cursor-pointer">
                    Active on website
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-sans text-[#9EABA2] hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-[8px] bg-gradient-to-b from-[#48C9B0] to-[#36998A] text-[#0B0F0E] font-sans text-xs font-semibold hover:brightness-105 active:scale-[0.97] transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving pack...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{editingService ? 'Update Wedding Pack' : 'Create Wedding Pack'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reusable Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!serviceToDelete}
        title="Delete Wedding Pack"
        description={`Are you sure you want to permanently delete pack "${serviceToDelete?.title}"? This action cannot be undone.`}
        isDeleting={!!deletingId}
        onConfirm={handleConfirmDelete}
        onCancel={() => setServiceToDelete(null)}
      />
    </div>
  );
};

export default ServicesManager;
