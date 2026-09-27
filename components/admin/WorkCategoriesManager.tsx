'use client';

import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { ConfirmDeleteModal } from './modals/ConfirmDeleteModal';

export interface WorkCategoryItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
  active: boolean;
}

interface WorkCategoriesManagerProps {
  initialCategories: WorkCategoryItem[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export const WorkCategoriesManager: React.FC<WorkCategoriesManagerProps> = ({
  initialCategories,
}) => {
  const [categories, setCategories] = useState<WorkCategoryItem[]>(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<WorkCategoryItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    order: 0,
    active: true,
  });

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      order: categories.length + 1,
      active: true,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: WorkCategoryItem) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      order: cat.order || 0,
      active: cat.active !== false,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    // Only auto-generate slug if creating or if slug matches old auto-generated slug
    if (!editingCategory) {
      setFormData((prev) => ({
        ...prev,
        name: val,
        slug: slugify(val),
      }));
    } else {
      setFormData((prev) => ({ ...prev, name: val }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    const payload = {
      name: formData.name.trim(),
      slug: slugify(formData.slug || formData.name),
      description: formData.description.trim(),
      order: Number(formData.order) || 0,
      active: formData.active,
    };

    try {
      if (editingCategory) {
        // PUT update
        const res = await fetch(`/api/admin/work-categories/${editingCategory._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update category');

        setCategories((prev) =>
          prev.map((c) => (c._id === editingCategory._id ? data.category : c))
        );
      } else {
        // POST create
        const res = await fetch('/api/admin/work-categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create category');

        setCategories((prev) => [...prev, data.category]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    setDeletingId(categoryToDelete.id);
    try {
      const res = await fetch(`/api/admin/work-categories/${categoryToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete category');
      }
      setCategories((prev) => prev.filter((c) => c._id !== categoryToDelete.id));
      setCategoryToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#131918] border border-white/[0.08] p-4 rounded-xs">
        <p className="text-xs text-[#9EABA2] font-sans">
          Manage portfolio filter categories and taxonomy grouping for wedding collections.
        </p>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xs bg-teal hover:bg-[#389a8a] text-[#0B0F0E] font-sans text-xs font-semibold transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-[#131918] rounded-xs border border-white/[0.08] overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-[#0E1413] border-b border-white/[0.08] text-[11px] uppercase tracking-wider text-[#9EABA2] font-medium font-mono">
            <tr>
              <th className="py-3 px-4">Category Name</th>
              <th className="py-3 px-4">Slug (URL Key)</th>
              <th className="py-3 px-4 hidden sm:table-cell">Description</th>
              <th className="py-3 px-4 text-center">Order</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 px-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-teal/10 border border-teal/20 text-teal flex items-center justify-center mx-auto mb-3">
                    <Tag className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-lg text-[#F4F3ED] font-normal mb-1">
                    No work categories defined
                  </h3>
                  <p className="text-xs text-[#9EABA2] max-w-sm mx-auto mb-4 font-sans">
                    Categories help organize your public portfolio and editorial collections.
                  </p>
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xs bg-teal hover:bg-teal/90 text-[#0B0F0E] font-sans text-xs font-medium transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create First Category</span>
                  </button>
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
              <tr key={cat._id} className="hover:bg-[#18201E] transition-colors">
                <td className="py-3.5 px-4 font-serif text-sm font-medium text-[#F4F3ED]">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1 rounded-xs bg-teal/10 border border-teal/20 text-teal">
                      <Tag className="w-3.5 h-3.5 shrink-0" />
                    </div>
                    <span>{cat.name}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 font-mono text-[11px] text-teal/90">
                  <span className="bg-teal/5 border border-teal/15 px-2 py-0.5 rounded-2xs">
                    {cat.slug}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-[#9EABA2] hidden sm:table-cell max-w-xs truncate">
                  {cat.description || '—'}
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-[#9EABA2]">
                  {cat.order}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono ${
                      cat.active
                        ? 'bg-teal/10 text-teal border border-teal/30'
                        : 'bg-white/5 text-white/40 border border-white/10'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${cat.active ? 'bg-teal' : 'bg-white/30'}`} />
                    {cat.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(cat)}
                      className="p-1.5 text-white/50 hover:text-teal rounded-xs hover:bg-white/5 transition-colors cursor-pointer"
                      title="Edit category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryToDelete({ id: cat._id, name: cat.name })}
                      disabled={deletingId === cat._id}
                      className="p-1.5 text-white/40 hover:text-red-400 rounded-[8px] hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete category"
                    >
                      {deletingId === cat._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131918] max-w-md w-full rounded-[14px] border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-modal-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/[0.08] bg-[#0E1413] flex items-center justify-between">
              <h2 className="font-serif text-lg text-[#F4F3ED] font-medium">
                {editingCategory ? 'Edit Work Category' : 'Add Work Category'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#9EABA2] hover:text-white rounded-xs hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xs bg-red-950/40 border border-red-800 text-red-300 text-xs font-sans">
                  {errorMessage}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-sans font-medium text-[#9EABA2] mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Photography, Films, Super 8mm"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full text-xs font-sans px-3 py-2 rounded-xs border border-white/10 bg-[#182220] text-white placeholder:text-white/30 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-sans font-medium text-[#9EABA2] mb-1.5">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. photography, films, super-8mm"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full text-xs font-mono px-3 py-2 rounded-xs border border-white/10 bg-[#182220] text-white placeholder:text-white/30 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-sans font-medium text-[#9EABA2] mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Short description of this portfolio category..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs font-sans px-3 py-2 rounded-xs border border-white/10 bg-[#182220] text-white placeholder:text-white/30 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                />
              </div>

              {/* Order & Active */}
              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-sans font-medium text-[#9EABA2] mb-1.5">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xs border border-white/10 bg-[#182220] text-white placeholder:text-white/30 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                  />
                </div>

                <div className="pt-5 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="catActive"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded-2xs accent-teal cursor-pointer w-4 h-4"
                  />
                  <label htmlFor="catActive" className="text-xs font-sans text-[#F4F3ED] cursor-pointer">
                    Active
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
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
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
        isOpen={!!categoryToDelete}
        title="Delete Work Category"
        description={`Are you sure you want to permanently delete category "${categoryToDelete?.name}"? This action cannot be undone.`}
        isDeleting={!!deletingId}
        onConfirm={handleConfirmDelete}
        onCancel={() => setCategoryToDelete(null)}
      />
    </div>
  );
};

export default WorkCategoriesManager;
