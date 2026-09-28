'use client';

import React, { useState } from 'react';
import {
  Camera,
  Video,
  Sparkles,
  Compass,
  Sliders,
  Film,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Check,
  X,
  Star,
  Bookmark,
} from 'lucide-react';
import { ConfirmDeleteModal } from './modals/ConfirmDeleteModal';

export interface EquipmentSpec {
  label: string;
  value: string;
}

export interface EquipmentItem {
  _id: string;
  name: string;
  category: string;
  role: string;
  badge: string;
  icon: string;
  keyFeatures: string[];
  specs: EquipmentSpec[];
  featuredIn: string[];
  order: number;
  active: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Camera,
  Video,
  Sparkles,
  Compass,
  Sliders,
  Film,
};

interface EquipmentManagerProps {
  initialEquipment: EquipmentItem[];
}

export const EquipmentManager: React.FC<EquipmentManagerProps> = ({ initialEquipment }) => {
  const [items, setItems] = useState<EquipmentItem[]>(initialEquipment);
  const [filter, setFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'cameras',
    role: '',
    badge: '',
    icon: 'Camera',
    keyFeaturesText: '',
    specs: [{ label: '', value: '' }],
    featuredInText: '',
    order: 0,
    active: true,
  });

  const categories = ['all', ...Array.from(new Set(items.map((i) => i.category.toLowerCase())))];

  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true;
    return item.category.toLowerCase() === filter;
  });

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'cameras',
      role: '',
      badge: '',
      icon: 'Camera',
      keyFeaturesText: '',
      specs: [{ label: '', value: '' }],
      featuredInText: '',
      order: items.length + 1,
      active: true,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: EquipmentItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      role: item.role,
      badge: item.badge || '',
      icon: item.icon || 'Camera',
      keyFeaturesText: (item.keyFeatures || []).join('\n'),
      specs: item.specs && item.specs.length > 0 ? item.specs : [{ label: '', value: '' }],
      featuredInText: (item.featuredIn || []).join(', '),
      order: item.order || 0,
      active: item.active !== false,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSpecChange = (index: number, field: 'label' | 'value', value: string) => {
    const updated = [...formData.specs];
    updated[index][field] = value;
    setFormData({ ...formData, specs: updated });
  };

  const addSpecRow = () => {
    setFormData({
      ...formData,
      specs: [...formData.specs, { label: '', value: '' }],
    });
  };

  const removeSpecRow = (index: number) => {
    const updated = formData.specs.filter((_, i) => i !== index);
    setFormData({ ...formData, specs: updated.length ? updated : [{ label: '', value: '' }] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    const payload = {
      name: formData.name.trim(),
      category: formData.category.trim().toLowerCase(),
      role: formData.role.trim(),
      badge: formData.badge.trim(),
      icon: formData.icon,
      keyFeatures: formData.keyFeaturesText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      specs: formData.specs.filter((s) => s.label.trim() && s.value.trim()),
      featuredIn: formData.featuredInText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      order: Number(formData.order) || 0,
      active: formData.active,
    };

    try {
      if (editingItem) {
        // PUT update
        const res = await fetch(`/api/admin/equipment/${editingItem._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update equipment');

        setItems((prev) =>
          prev.map((it) => (it._id === editingItem._id ? data.equipment : it))
        );
      } else {
        // POST create
        const res = await fetch('/api/admin/equipment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create equipment');

        setItems((prev) => [...prev, data.equipment]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setDeletingId(itemToDelete.id);
    try {
      const res = await fetch(`/api/admin/equipment/${itemToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete equipment');
      }
      setItems((prev) => prev.filter((it) => it._id !== itemToDelete.id));
      setItemToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete equipment');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Category Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 text-xs font-sans rounded-xs capitalize transition-all cursor-pointer ${
                filter === cat
                  ? 'bg-teal/15 text-teal border border-teal/40 font-medium shadow-[0_0_15px_rgba(67,177,159,0.15)]'
                  : 'bg-[#131918] text-[#9EABA2] hover:text-white hover:bg-[#171E1D] border border-white/[0.08]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Add Button */}
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xs bg-teal hover:bg-teal/90 text-[#0B0F0E] font-sans text-xs font-medium transition-all shadow-[0_0_20px_rgba(67,177,159,0.25)] hover:shadow-[0_0_25px_rgba(67,177,159,0.4)]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Equipment</span>
        </button>
      </div>

      {/* Grid of Equipment Cards or Designed Empty State */}
      {filteredItems.length === 0 ? (
        <div className="py-16 px-6 text-center border border-white/[0.08] bg-[#131918] rounded-xs shadow-xl">
          <div className="w-12 h-12 rounded-full bg-teal/10 border border-teal/20 text-teal flex items-center justify-center mx-auto mb-3">
            <Camera className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg text-[#F4F3ED] font-normal mb-1">
            No equipment units found
          </h3>
          <p className="text-xs text-[#9EABA2] max-w-sm mx-auto mb-4 font-sans">
            {filter !== 'all'
              ? `No production hardware currently registered under the "${filter}" category.`
              : 'No studio equipment currently added to the backstage registry.'}
          </p>
          <div className="flex items-center justify-center gap-2">
            {filter !== 'all' ? (
              <button
                type="button"
                onClick={() => setFilter('all')}
                className="px-3 py-1.5 rounded-xs bg-[#182220] hover:bg-[#1E2B28] text-teal border border-teal/30 text-xs font-mono transition-colors cursor-pointer"
              >
                Show all categories
              </button>
            ) : (
              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xs bg-teal hover:bg-teal/90 text-[#0B0F0E] font-sans text-xs font-medium transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Equipment</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item) => {
          const IconComp = ICON_MAP[item.icon] || Camera;

          return (
            <div
              key={item._id}
              className={`p-5 rounded-sm border transition-all shadow-[0_4px_20px_rgba(0,0,0,0.35)] group ${
                item.active
                  ? 'bg-[#131918] border-white/[0.08] hover:border-teal/35 hover:bg-[#161E1D]'
                  : 'bg-[#0E1312] border-white/[0.04] opacity-60'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xs bg-teal/10 border border-teal/20 flex items-center justify-center text-teal shrink-0 group-hover:scale-105 transition-transform">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-sans font-semibold text-lg text-white leading-tight lining-nums">
                        {item.name}
                      </h3>
                      {!item.active && (
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-white/10 text-[#9EABA2] rounded-full">
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#9EABA2] font-sans mt-0.5">{item.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className="px-2.5 py-0.5 text-[10px] font-mono rounded-full bg-teal/15 text-teal border border-teal/30">
                      {item.badge}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="p-1.5 text-[#9EABA2] hover:text-white rounded-xs hover:bg-white/10 transition-colors"
                    title="Edit equipment"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemToDelete({ id: item._id, name: item.name })}
                    disabled={deletingId === item._id}
                    className="p-1.5 text-[#9EABA2]/60 hover:text-red-400 rounded-[8px] hover:bg-red-950/25 transition-colors cursor-pointer"
                    title="Delete equipment"
                  >
                    {deletingId === item._id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Specs & Features Summary */}
              <div className="mt-4 pt-3.5 border-t border-white/[0.08] grid grid-cols-2 gap-3 text-xs font-sans">
                <div>
                  <div className="text-[11px] font-semibold text-[#E5A962] flex items-center gap-1 mb-1">
                    <Star className="w-3 h-3" />
                    <span>Features ({item.keyFeatures?.length || 0})</span>
                  </div>
                  <p className="text-[11px] text-[#9EABA2] line-clamp-2">
                    {item.keyFeatures?.join(' · ') || 'None specified'}
                  </p>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-teal flex items-center gap-1 mb-1">
                    <Sliders className="w-3 h-3" />
                    <span>Specs ({item.specs?.length || 0})</span>
                  </div>
                  <p className="text-[11px] text-[#9EABA2] line-clamp-2">
                    {item.specs?.map((s) => `${s.label}: ${s.value}`).join(' · ') || 'None'}
                  </p>
                </div>
              </div>

              {/* Featured In Tags */}
              {item.featuredIn && item.featuredIn.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-white/[0.05] flex items-center gap-1.5 flex-wrap text-[10px] font-sans text-[#9EABA2]">
                  <Bookmark className="w-3 h-3 text-teal" />
                  {item.featuredIn.map((work) => (
                    <span
                      key={work}
                      className="px-2 py-0.5 rounded-full bg-[#182220] border border-white/[0.08] text-[#9EABA2]"
                    >
                      {work}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#131918] max-w-2xl w-full rounded-[14px] border border-white/10 shadow-[0_10px_50px_rgba(0,0,0,0.8)] overflow-hidden max-h-[90vh] flex flex-col animate-modal-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/[0.08] bg-[#0F1413] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-teal">Production Hardware</span>
                <h2 className="font-serif text-lg text-white font-medium">
                  {editingItem ? 'Edit Equipment Unit' : 'Add New Equipment Unit'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-[#9EABA2] hover:text-white rounded-xs hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {errorMessage && (
                <div className="p-3 rounded-xs bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-sans">
                  {errorMessage}
                </div>
              )}

              {/* Row 1: Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-sans font-medium text-[#9EABA2] mb-1">
                    Equipment Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sony FX3"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs font-sans px-3 py-2 rounded-xs border border-white/10 bg-[#182220] text-white placeholder:text-white/30 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans font-medium text-[#9EABA2] mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="cameras, lenses, aerial..."
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-xs font-sans px-3 py-2 rounded-xs border border-white/10 bg-[#182220] text-white placeholder:text-white/30 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-colors"
                  />
                </div>
              </div>

              {/* Row 2: Role & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-sans font-medium text-[#9EABA2] mb-1">
                    Role / Subtitle *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Full-Frame Cinema Camera"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full text-xs font-sans px-3 py-2 rounded-xs border border-white/10 bg-[#182220] text-white placeholder:text-white/30 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans font-medium text-[#9EABA2] mb-1">
                    Badge
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4K 120p, 61MP RAW"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full text-xs font-sans px-3 py-2 rounded-xs border border-white/10 bg-[#182220] text-white placeholder:text-white/30 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-colors"
                  />
                </div>
              </div>

              {/* Row 3: Icon, Order & Active */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div>
                  <label className="block text-xs font-sans font-medium text-[#9EABA2] mb-1">
                    Icon
                  </label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full text-xs font-sans px-3 py-2 rounded-xs border border-white/10 bg-[#182220] text-white focus:outline-none focus:border-teal transition-colors"
                  >
                    <option value="Camera" className="bg-[#131918]">Camera</option>
                    <option value="Video" className="bg-[#131918]">Video</option>
                    <option value="Sparkles" className="bg-[#131918]">Sparkles</option>
                    <option value="Compass" className="bg-[#131918]">Compass (Drone)</option>
                    <option value="Sliders" className="bg-[#131918]">Sliders</option>
                    <option value="Film" className="bg-[#131918]">Film</option>
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

                <div className="pt-5 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="equipmentActive"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded-xs bg-[#182220] border-white/20 text-teal focus:ring-teal"
                  />
                  <label htmlFor="equipmentActive" className="text-xs font-sans text-white cursor-pointer">
                    Active (Visible on site)
                  </label>
                </div>
              </div>

              {/* Key Features */}
              <div>
                <label className="block text-xs font-sans font-medium text-[#9EABA2] mb-1">
                  Key Features (One feature per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="Full-Frame 12.1MP Sensor&#10;15+ Stops Dynamic Range&#10;Dual Base ISO (800 / 12,800)"
                  value={formData.keyFeaturesText}
                  onChange={(e) => setFormData({ ...formData, keyFeaturesText: e.target.value })}
                  className="w-full text-xs font-sans px-3 py-2 rounded-xs border border-white/10 bg-[#182220] text-white placeholder:text-white/30 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-colors"
                />
              </div>

              {/* Technical Specs Key-Value Rows */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-sans font-medium text-[#9EABA2]">
                    Technical Specifications
                  </label>
                  <button
                    type="button"
                    onClick={addSpecRow}
                    className="text-[11px] text-teal hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Spec Row</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.specs.map((spec, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Label (e.g. Sensor)"
                        value={spec.label}
                        onChange={(e) => handleSpecChange(idx, 'label', e.target.value)}
                        className="flex-1 text-xs font-sans px-3 py-1.5 rounded-xs border border-white/10 bg-[#182220] text-white placeholder:text-white/30 focus:outline-none focus:border-teal"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. 35mm Full-Frame CMOS)"
                        value={spec.value}
                        onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                        className="flex-1 text-xs font-sans px-3 py-1.5 rounded-xs border border-white/10 bg-[#182220] text-white placeholder:text-white/30 focus:outline-none focus:border-teal"
                      />
                      <button
                        type="button"
                        onClick={() => removeSpecRow(idx)}
                        className="p-1.5 text-[#9EABA2] hover:text-red-400 rounded-xs hover:bg-red-950/20 transition-colors"
                        title="Remove spec"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Featured In Tags */}
              <div>
                <label className="block text-xs font-sans font-medium text-[#9EABA2] mb-1">
                  Featured In Weddings (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="Sarah & Youssef, The Sunset Vows, Leila & Amine"
                  value={formData.featuredInText}
                  onChange={(e) => setFormData({ ...formData, featuredInText: e.target.value })}
                  className="w-full text-xs font-sans px-3 py-2 rounded-xs border border-white/10 bg-[#182220] text-white placeholder:text-white/30 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-colors"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-sans text-[#9EABA2] hover:text-white transition-colors"
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
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingItem ? 'Update Equipment' : 'Create Equipment'}</span>
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
        isOpen={!!itemToDelete}
        title="Delete Equipment"
        description={`Are you sure you want to permanently delete "${itemToDelete?.name}"? This action cannot be undone.`}
        isDeleting={!!deletingId}
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};

export default EquipmentManager;
