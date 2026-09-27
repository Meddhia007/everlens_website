'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Copy,
  Plus,
  Trash2,
  Edit2,
  Image as ImageIcon,
  Film,
  UploadCloud,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  Layers,
  ArrowRight,
  Star,
  X,
  Split,
  Eye,
  Scissors,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { clsx } from 'clsx';
import { ImageCropperModal, InstagramRatio } from './ImageCropperModal';
import { ConfirmDeleteModal } from './modals/ConfirmDeleteModal';

export interface AdminPortfolioMedia {
  url: string;
  type: 'photo' | 'video';
  caption?: string;
  aspectRatio?: string;
  originalUrl?: string;
}

export interface AdminPortfolioPost {
  _id: string;
  title: string;
  slug?: string;
  location: string;
  year?: string;
  category: string;
  coverImage: string;
  videoUrl?: string;
  media: AdminPortfolioMedia[];
  featured?: boolean;
  order?: number;
  createdAt?: string;
}

export const PortfolioPostsManager: React.FC = () => {
  const [posts, setPosts] = useState<AdminPortfolioPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [editingPost, setEditingPost] = useState<AdminPortfolioPost | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Instagram Ratio & Cropper state
  const [postRatio, setPostRatio] = useState<InstagramRatio>('4:5');
  const [cropQueue, setCropQueue] = useState<{ file: File; src: string; index?: number }[]>([]);
  const [activeCropItem, setActiveCropItem] = useState<{ file?: File; src: string; index?: number } | null>(null);

  // Delete modal state
  const [postToDelete, setPostToDelete] = useState<{ id: string; title: string; isGallery?: boolean } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form states for Single Post
  const [formTitle, setFormTitle] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formYear, setFormYear] = useState('2024');
  const [formCategory, setFormCategory] = useState('photography');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formMedia, setFormMedia] = useState<AdminPortfolioMedia[]>([]);
  const [formCoverImage, setFormCoverImage] = useState('');
  const [formFeatured, setFormFeatured] = useState(false);
  const [formOrder, setFormOrder] = useState<number>(1);
  const [isUploading, setIsUploading] = useState(false);

  // Batch Splitter state
  const [batchTitle, setBatchTitle] = useState('');
  const [batchLocation, setBatchLocation] = useState('Tunisia · 2024');
  const [batchCategory, setBatchCategory] = useState('photography');
  const [batchPhotos, setBatchPhotos] = useState<string[]>([]);
  const [photosPerPost, setPhotosPerPost] = useState<number>(4);
  const [isBatchUploading, setIsBatchUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all portfolio posts
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/portfolio');
      const data = await res.json();
      if (res.ok && data.posts) {
        setPosts(data.posts);
      } else {
        setError(data.error || 'Failed to load portfolio posts');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Open single post modal (new or edit)
  const openSingleModal = (post?: AdminPortfolioPost) => {
    if (post) {
      setEditingPost(post);
      setFormTitle(post.title);
      setFormLocation(post.location || '');
      setFormYear(post.year || '2024');
      setFormCategory(post.category || 'photography');
      setFormVideoUrl(post.videoUrl || '');
      setFormMedia(post.media || []);
      setFormCoverImage(post.coverImage || post.media?.[0]?.url || '');
      setFormFeatured(!!post.featured);
      setFormOrder(post.order ?? 1);
      const detectedRatio = (post.media?.[0]?.aspectRatio as InstagramRatio) || '4:5';
      setPostRatio(detectedRatio === '1:1' ? '1:1' : '4:5');
    } else {
      setEditingPost(null);
      setFormTitle('');
      setFormLocation('Tunisia · 2024');
      setFormYear('2024');
      setFormCategory('photography');
      setFormVideoUrl('');
      setFormMedia([]);
      setFormCoverImage('');
      setFormFeatured(false);
      setFormOrder(posts.length + 1);
      setPostRatio('4:5');
    }
    setIsEditModalOpen(true);
  };

  // Upload files for Single Post with Instagram aspect ratio check
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    try {
      const fileArr = Array.from(files);
      const toUploadDirectly: File[] = [];
      const toCrop: { file: File; src: string }[] = [];

      for (const file of fileArr) {
        if (!file.type.startsWith('image/')) {
          toUploadDirectly.push(file);
          continue;
        }

        const objectUrl = URL.createObjectURL(file);
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            const actual = img.naturalWidth / img.naturalHeight;
            const target = postRatio === '1:1' ? 1.0 : (4 / 5); // 0.8
            // If aspect ratio deviates by more than 3%, prompt for crop
            if (Math.abs(actual - target) > 0.03) {
              toCrop.push({ file, src: objectUrl });
            } else {
              toUploadDirectly.push(file);
            }
            resolve();
          };
          img.onerror = () => {
            toUploadDirectly.push(file);
            resolve();
          };
          img.src = objectUrl;
        });
      }

      // Upload directly conforming files
      if (toUploadDirectly.length > 0) {
        const formData = new FormData();
        toUploadDirectly.forEach((f) => formData.append('files', f));

        const res = await fetch('/api/admin/portfolio/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.uploaded) {
          const newMedia: AdminPortfolioMedia[] = data.uploaded.map((u: any) => ({
            url: u.url,
            originalUrl: u.url,
            type: u.type,
            caption: '',
            aspectRatio: postRatio,
          }));

          setFormMedia((prev) => {
            const updated = [...prev, ...newMedia];
            if (!formCoverImage && updated.length > 0) {
              setFormCoverImage(updated[0].url);
            }
            return updated;
          });
        }
      }

      // If any non-conforming images, trigger the cropper for the first one and queue the rest
      if (toCrop.length > 0) {
        setActiveCropItem(toCrop[0]);
        setCropQueue(toCrop.slice(1));
      }
    } catch (err) {
      console.error('File upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Crop complete handler (non-destructive)
  const handleCropComplete = async (croppedBlob: Blob, croppedDataUrl: string, originalSrc: string) => {
    try {
      if (activeCropItem?.index !== undefined) {
        // Re-cropping an existing photo
        const idx = activeCropItem.index;
        const formData = new FormData();
        const croppedFile = new File([croppedBlob], `crop-${Date.now()}.jpg`, { type: 'image/jpeg' });
        formData.append('files', croppedFile);

        const res = await fetch('/api/admin/portfolio/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.uploaded?.[0]) {
          const newUrl = data.uploaded[0].url;
          setFormMedia((prev) => {
            const updated = [...prev];
            const old = updated[idx];
            updated[idx] = {
              ...old,
              url: newUrl,
              originalUrl: old.originalUrl || old.url,
              aspectRatio: postRatio,
            };
            if (formCoverImage === old.url) {
              setFormCoverImage(newUrl);
            }
            return updated;
          });
        }
      } else if (activeCropItem?.file) {
        // Upload both original file (for non-destructive editing) and cropped image
        const formData = new FormData();
        const croppedFile = new File([croppedBlob], `crop-${Date.now()}-${activeCropItem.file.name}`, { type: 'image/jpeg' });
        formData.append('files', activeCropItem.file);
        formData.append('files', croppedFile);

        const res = await fetch('/api/admin/portfolio/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.uploaded) {
          const origUpload = data.uploaded.find((u: any) => u.filename === activeCropItem.file?.name) || data.uploaded[0];
          const cropUpload = data.uploaded.find((u: any) => u.filename !== activeCropItem.file?.name) || data.uploaded[1] || data.uploaded[0];

          const newMedia: AdminPortfolioMedia = {
            url: cropUpload.url,
            originalUrl: origUpload.url,
            type: 'photo',
            caption: '',
            aspectRatio: postRatio,
          };
          setFormMedia((prev) => {
            const updated = [...prev, newMedia];
            if (!formCoverImage) {
              setFormCoverImage(newMedia.url);
            }
            return updated;
          });
        }
      }
    } catch (err) {
      console.error('Error uploading cropped image:', err);
    } finally {
      if (cropQueue.length > 0) {
        setActiveCropItem(cropQueue[0]);
        setCropQueue((prev) => prev.slice(1));
      } else {
        setActiveCropItem(null);
      }
    }
  };

  const handleCropCancel = () => {
    if (cropQueue.length > 0) {
      setActiveCropItem(cropQueue[0]);
      setCropQueue((prev) => prev.slice(1));
    } else {
      setActiveCropItem(null);
    }
  };

  // Delete Post confirmation handler
  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/portfolio/${postToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p._id !== postToDelete.id));
        setPostToDelete(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete post');
      }
    } catch {
      alert('Network error while deleting post');
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick Move Up / Down display order handler with instant optimistic update
  const handleQuickMove = async (post: AdminPortfolioPost, direction: 'up' | 'down') => {
    const currentIdx = posts.findIndex((p) => p._id === post._id);
    if (currentIdx === -1) return;

    const targetIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
    if (targetIdx < 0 || targetIdx >= posts.length) return;

    const reordered = [...posts];
    const temp = reordered[currentIdx];
    reordered[currentIdx] = reordered[targetIdx];
    reordered[targetIdx] = temp;

    // Normalize orders: 1, 2, 3...
    const ordersPayload = reordered.map((p, idx) => ({
      id: p._id,
      order: idx + 1,
    }));

    // Optimistic UI update
    setPosts(reordered.map((p, idx) => ({ ...p, order: idx + 1 })));

    try {
      const res = await fetch('/api/admin/portfolio', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: ordersPayload }),
      });
      if (!res.ok) {
        fetchPosts(); // Rollback if server fails
      }
    } catch {
      fetchPosts();
    }
  };

  // Save Single Post
  const handleSavePost = async () => {
    if (formMedia.length === 0 && !formCoverImage) {
      alert('Please upload at least one photo or provide a cover image.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: formTitle.trim() || editingPost?.title || `Moment #${formOrder || Date.now().toString(36).slice(-4)}`,
        location: formLocation.trim() || 'Tunisia',
        year: formYear.trim() || new Date().getFullYear().toString(),
        category: formCategory.trim(),
        videoUrl: formVideoUrl.trim(),
        coverImage: formCoverImage || formMedia[0]?.url,
        media: formMedia,
        featured: formFeatured,
        order: Number(formOrder) || 1,
      };

      let res;
      if (editingPost) {
        res = await fetch(`/api/admin/portfolio/${editingPost._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setIsEditModalOpen(false);
        fetchPosts();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save post');
      }
    } catch (err: any) {
      alert(err?.message || 'Error saving post');
    } finally {
      setIsSaving(false);
    }
  };

  // Upload files for Batch Splitter
  const handleBatchFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsBatchUploading(true);

    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append('files', f));

      const res = await fetch('/api/admin/portfolio/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.uploaded) {
        const newUrls = data.uploaded.map((u: any) => u.url);
        setBatchPhotos((prev) => [...prev, ...newUrls]);
      }
    } catch (err) {
      console.error('Batch upload error:', err);
    } finally {
      setIsBatchUploading(false);
    }
  };

  // Submit Batch Posts
  const handleBatchCreate = async () => {
    if (batchPhotos.length === 0) {
      alert('Please upload photos to split.');
      return;
    }

    setIsSaving(true);
    try {
      // Chunk photos into sets of photosPerPost (e.g. 4 photos each)
      const chunks: string[][] = [];
      for (let i = 0; i < batchPhotos.length; i += photosPerPost) {
        chunks.push(batchPhotos.slice(i, i + photosPerPost));
      }

      const generatedPosts = chunks.map((chunk, index) => {
        const postNum = posts.length + index + 1;
        return {
          title: `Moment #${postNum}`,
          location: 'Tunisia',
          year: new Date().getFullYear().toString(),
          category: batchCategory.trim(),
          coverImage: chunk[0],
          media: chunk.map((url) => ({
            url,
            type: 'photo',
            caption: '',
          })),
          featured: false,
          order: postNum,
        };
      });

      const res = await fetch('/api/admin/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch: true,
          posts: generatedPosts,
        }),
      });

      if (res.ok) {
        setIsBatchModalOpen(false);
        setBatchPhotos([]);
        setBatchTitle('');
        fetchPosts();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to generate batch posts');
      }
    } catch (err: any) {
      alert(err?.message || 'Error creating batch posts');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (categoryFilter !== 'all') {
      const pCat = p.category?.toLowerCase() || '';
      const filterCat = categoryFilter.toLowerCase();
      if (filterCat === 'films' || filterCat === 'film') {
        if (pCat !== 'film' && pCat !== 'films' && pCat !== 'video') return false;
      } else if (filterCat === 'photography') {
        if (pCat !== 'photography' && pCat !== 'photo') return false;
      } else if (filterCat === 'traditional') {
        if (!pCat.includes('traditional') && !pCat.includes('wteya') && !pCat.includes('traditionnel')) return false;
      } else if (filterCat === 'editorial') {
        if (!pCat.includes('editorial') && !pCat.includes('éditorial')) return false;
      } else if (pCat !== filterCat) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.title?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q) ||
        (p as any).galleryCouple?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8 text-left">
      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cream/10 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full border border-teal/40 bg-teal/10 text-[10px] uppercase tracking-widest text-teal font-sans">
              Homepage Showcase
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-cream tracking-tight">
            Portfolio Carousel Posts
          </h1>
          <p className="text-xs sm:text-sm font-sans text-cream/60 max-w-xl leading-relaxed">
            Manage multi-photo Instagram-style carousel posts (3–6 photos each) and cinematic film reels showcased on the homepage.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Batch Splitter Tool Button */}
          <button
            type="button"
            onClick={() => setIsBatchModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-teal/40 text-teal hover:bg-teal/10 rounded-xs text-xs font-medium transition-colors cursor-pointer"
            title="Upload e.g. 20 photos and automatically split them into 4-photo carousel posts"
          >
            <Split className="w-3.5 h-3.5" />
            <span>Batch 4-Photo Splitter</span>
          </button>

          {/* New Carousel Post Button */}
          <button
            type="button"
            onClick={() => openSingleModal()}
            className="flex items-center gap-2 px-4 py-2 bg-teal hover:bg-cream text-ink font-semibold rounded-xs text-xs transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Carousel Post</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-ink-2 p-4 rounded-xs border border-cream/10">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {['all', 'photography', 'films', 'traditional', 'editorial'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={clsx(
                'px-3 py-1.5 rounded-2xs text-xs font-sans capitalize transition-colors cursor-pointer',
                categoryFilter === cat
                  ? 'bg-teal text-ink font-semibold shadow-xs'
                  : 'text-cream/60 hover:text-cream hover:bg-ink-3'
              )}
            >
              {cat === 'all' ? 'All' : cat === 'films' ? 'Films' : cat === 'traditional' ? 'Traditional' : cat === 'editorial' ? 'Editorial' : cat}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search posts..."
          className="bg-ink-3 border border-cream/15 rounded-xs px-3 py-1.5 text-xs text-cream placeholder:text-cream/35 focus:outline-none focus:border-teal min-w-[220px]"
        />
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs font-mono text-cream/50 flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-teal" />
          <span>Loading portfolio posts...</span>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="py-16 px-6 text-center border border-white/[0.08] bg-[#131918] rounded-xs shadow-xl">
          <div className="w-12 h-12 rounded-full bg-teal/10 border border-teal/20 text-teal flex items-center justify-center mx-auto mb-3">
            <Copy className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg text-[#F4F3ED] font-normal mb-1">
            No portfolio posts found
          </h3>
          <p className="text-xs text-[#9EABA2] max-w-sm mx-auto mb-4 font-sans">
            {searchQuery || categoryFilter !== 'all'
              ? 'No portfolio posts match your active search query or category filter.'
              : 'Create Instagram-style multi-photo carousels or cinematic film reels to showcase your work.'}
          </p>
          <div className="flex items-center justify-center gap-2">
            {searchQuery || categoryFilter !== 'all' ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                }}
                className="px-3 py-1.5 rounded-xs bg-[#182220] hover:bg-[#1E2B28] text-teal border border-teal/30 text-xs font-mono transition-colors cursor-pointer"
              >
                Reset filters
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openSingleModal()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xs bg-teal hover:bg-teal/90 text-[#0B0F0E] font-sans text-xs font-medium transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Carousel Post</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post, index) => {
            const isFilm =
              post.category === 'film' ||
              post.category === 'films' ||
              Boolean(post.videoUrl) ||
              post.coverImage?.includes('.mp4') ||
              post.coverImage?.includes('.mov') ||
              post.media?.some((m) => m.type === 'video');

            const slideCount = post.media?.length || 1;
            const isFromGallery = (post as any).source === 'gallery';
            const displayUrl = post.coverImage || post.media?.[0]?.url || post.videoUrl || '';
            const isVideoFile =
              displayUrl.includes('.mp4') ||
              displayUrl.includes('.mov') ||
              displayUrl.includes('.webm') ||
              (isFilm && !post.coverImage);

            return (
              <div
                key={post._id}
                className="group bg-ink-2 border border-cream/15 rounded-[14px] overflow-hidden flex flex-col justify-between card-lift shadow-md hover:border-teal/50 transition-all"
              >
                {/* Cover Image or Video & Badges */}
                <div className="relative aspect-[4/5] bg-ink-3 overflow-hidden">
                  {isVideoFile ? (
                    <video
                      src={displayUrl}
                      muted
                      autoPlay
                      loop
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none"
                    />
                  ) : (
                    <img
                      src={displayUrl}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}

                  {/* Dark veil gradient for text legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

                  {/* Top-Left Order Badge & Gallery Source */}
                  <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-1.5">
                    {post.order !== undefined && post.order > 0 && post.order <= 8 ? (
                      <span className="px-2 py-1 rounded-[8px] bg-teal text-ink font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        <span>#{post.order} · Top 8</span>
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-[8px] bg-black/60 backdrop-blur-xs border border-white/20 text-cream/70 font-mono text-[10px] font-medium shadow-md">
                        #{post.order ?? index + 1}
                      </span>
                    )}

                    {isFromGallery && (
                      <span className="px-2 py-0.5 rounded-[6px] bg-teal/20 backdrop-blur-xs border border-teal/40 text-teal font-mono text-[9px] font-medium uppercase tracking-wider shadow-sm">
                        From Gallery
                      </span>
                    )}
                  </div>

                  {/* Top-Right Badge: Multi-Photo or Film */}
                  <div className="absolute top-3 right-3 z-10">
                    {isFilm ? (
                      <span className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-xs border border-white/20 text-teal flex items-center justify-center shadow-md">
                        <Film className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-[8px] bg-black/60 backdrop-blur-xs border border-white/20 text-cream flex items-center gap-1.5 shadow-md">
                        <Copy className="w-3 h-3 text-teal" />
                        <span className="text-[11px] font-mono font-medium">{slideCount} Photos</span>
                      </span>
                    )}
                  </div>

                  {/* Overlay Title & Gallery Info */}
                  <div className="absolute bottom-2.5 left-3 right-3 z-10 pointer-events-none">
                    <p className="text-xs font-serif font-medium text-white truncate drop-shadow">
                      {post.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-cream/70 font-sans truncate drop-shadow">
                      <span className="capitalize">{post.category}</span>
                      {post.location && <span>· {post.location}</span>}
                      {(post as any).galleryCouple && <span>· {(post as any).galleryCouple}</span>}
                    </div>
                  </div>
                </div>

                {/* Clean Action Footer with Quick Order Stepper */}
                <div className="p-3 bg-ink-2 border-t border-cream/10 flex items-center justify-between gap-2">
                  {/* Quick Order Stepper */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleQuickMove(post, 'up')}
                      disabled={index === 0}
                      className="p-1.5 text-cream/50 hover:text-teal hover:bg-ink-3 rounded-[6px] transition-colors disabled:opacity-20 cursor-pointer"
                      title="Move Up in Homepage Grid"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono text-teal font-semibold px-2 py-0.5 rounded bg-ink-3">
                      #{post.order ?? index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuickMove(post, 'down')}
                      disabled={index === filteredPosts.length - 1}
                      className="p-1.5 text-cream/50 hover:text-teal hover:bg-ink-3 rounded-[6px] transition-colors disabled:opacity-20 cursor-pointer"
                      title="Move Down in Homepage Grid"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openSingleModal(post)}
                      className="px-2.5 py-1.5 text-cream/80 hover:text-teal hover:bg-ink-3 rounded-[8px] text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer active:scale-[0.97]"
                      title="Edit Post"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPostToDelete({ id: post._id, title: post.title, isGallery: isFromGallery })}
                      className="p-1.5 text-cream/40 hover:text-red-400 hover:bg-red-950/30 rounded-[8px] transition-colors cursor-pointer active:scale-[0.97]"
                      title={isFromGallery ? "Remove from Public Portfolio" : "Delete Post"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Single Post Create / Edit Modal */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200 select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditModalOpen(false);
          }}
        >
          <div className="bg-[#171D1C] border border-cream/15 rounded-[14px] max-w-2xl w-full max-h-[90vh] flex flex-col justify-between overflow-hidden shadow-2xl text-left text-cream animate-modal-in">
            {/* Modal Header */}
            <div className="p-5 border-b border-cream/10 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl text-cream font-medium">
                  {editingPost ? 'Edit Portfolio Post' : 'Create New Carousel Post'}
                </h3>
                <p className="text-xs font-sans text-cream/50 mt-0.5">
                  Multi-photo post with slide transitions (Instagram style).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-cream/50 hover:text-cream rounded-[8px] hover:bg-cream/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs font-sans flex-1">
              {/* Instagram Ratio Selector */}
              <div className="flex items-center justify-between p-3 bg-ink-3/70 rounded-[8px] border border-cream/10">
                <div className="space-y-0.5">
                  <div className="text-[11px] font-mono text-cream font-semibold uppercase tracking-wider">
                    Instagram Aspect Ratio
                  </div>
                  <div className="text-[11px] text-cream/50">
                    Enforce exact Instagram dimensions for carousel images
                  </div>
                </div>
                <div className="inline-flex rounded-[8px] p-0.5 bg-ink-2 border border-cream/15">
                  <button
                    type="button"
                    onClick={() => setPostRatio('4:5')}
                    className={clsx(
                      'px-3 py-1 text-xs font-mono rounded-[6px] transition-all cursor-pointer',
                      postRatio === '4:5'
                        ? 'bg-teal text-ink font-semibold shadow-xs'
                        : 'text-cream/60 hover:text-cream'
                    )}
                  >
                    4:5 (1080×1350)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostRatio('1:1')}
                    className={clsx(
                      'px-3 py-1 text-xs font-mono rounded-[6px] transition-all cursor-pointer',
                      postRatio === '1:1'
                        ? 'bg-teal text-ink font-semibold shadow-xs'
                        : 'text-cream/60 hover:text-cream'
                    )}
                  >
                    1:1 (1080×1080)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-cream/70">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-ink-3 border border-cream/15 rounded-[8px] p-2 text-xs text-cream focus:border-teal outline-none"
                  >
                    <option value="photography">Photography</option>
                    <option value="film">Film Reel (Video)</option>
                    <option value="traditional">Traditional / Wteya</option>
                    <option value="editorial">Editorial</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono uppercase text-cream/70">
                      Display Order
                    </label>
                    {formOrder <= 8 && (
                      <span className="text-[9px] font-mono text-teal font-semibold">★ Top 8</span>
                    )}
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={formOrder}
                    onChange={(e) => setFormOrder(Math.max(1, parseInt(e.target.value) || 1))}
                    title="Posts 1-8 appear unblurred in the initial grid view"
                    className="w-full bg-ink-3 border border-cream/15 rounded-[8px] p-2 text-xs text-cream focus:border-teal outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-cream/70">
                    Video URL (For Films)
                  </label>
                  <input
                    type="text"
                    value={formVideoUrl}
                    onChange={(e) => setFormVideoUrl(e.target.value)}
                    placeholder="/portfolio/videos/reel-1.mp4"
                    className="w-full bg-ink-3 border border-cream/15 rounded-[8px] p-2 text-xs text-cream focus:border-teal outline-none font-mono"
                  />
                </div>
              </div>

              {/* Photos Management Section */}
              <div className="space-y-3 pt-2 border-t border-cream/10">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-mono uppercase text-cream/90 font-medium">
                      Carousel Photos ({formMedia.length} Photos)
                    </label>
                    <p className="text-[11px] text-cream/50">
                      Upload photos. Non-conforming photos will prompt the crop tool automatically.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3.5 py-1.5 bg-teal/15 hover:bg-teal text-teal hover:text-ink border border-teal/40 rounded-[8px] text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.97]"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5" />
                    )}
                    <span>Upload Photos</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                </div>

                {/* Uploaded Photos Grid */}
                {formMedia.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-cream/20 hover:border-teal/50 rounded-[14px] p-8 text-center cursor-pointer space-y-2 bg-ink-3/40 transition-colors"
                  >
                    <UploadCloud className="w-8 h-8 text-cream/30 mx-auto" />
                    <p className="text-xs text-cream/70 font-medium">
                      Click to select photos from your computer
                    </p>
                    <p className="text-[11px] text-cream/40">
                      Supports JPG, PNG, WEBP or MP4
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {formMedia.map((m, idx) => {
                      const isCover = m.url === formCoverImage;
                      return (
                        <div
                          key={idx}
                          className={clsx(
                            'relative rounded-[8px] overflow-hidden border bg-ink-3 group',
                            postRatio === '1:1' ? 'aspect-square' : 'aspect-[4/5]',
                            isCover ? 'border-teal ring-2 ring-teal' : 'border-cream/20'
                          )}
                        >
                          <img src={m.url} alt="" className="w-full h-full object-cover" />

                          {/* Cover badge */}
                          {isCover && (
                            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-teal text-ink font-mono text-[9px] font-bold rounded-[6px] uppercase tracking-wider flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-current" />
                              <span>Cover</span>
                            </div>
                          )}

                          {/* Hover Actions */}
                          <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                            {/* Crop / Re-crop Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveCropItem({
                                  src: m.originalUrl || m.url,
                                  index: idx,
                                });
                              }}
                              className="p-1.5 bg-[#182220] text-teal border border-teal/40 rounded-[8px] hover:scale-110 transition-transform cursor-pointer"
                              title="Crop to Instagram ratio"
                            >
                              <Scissors className="w-3.5 h-3.5" />
                            </button>

                            {!isCover && (
                              <button
                                type="button"
                                onClick={() => setFormCoverImage(m.url)}
                                className="p-1.5 bg-teal text-ink rounded-[8px] hover:scale-110 transition-transform cursor-pointer"
                                title="Set as Cover Photo"
                              >
                                <Star className="w-3.5 h-3.5 fill-current" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                const next = formMedia.filter((_, i) => i !== idx);
                                setFormMedia(next);
                                if (isCover && next.length > 0) {
                                  setFormCoverImage(next[0].url);
                                }
                              }}
                              className="p-1.5 bg-red-600 text-white rounded-[8px] hover:scale-110 transition-transform cursor-pointer"
                              title="Remove Photo"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="absolute bottom-1 left-2 text-[10px] font-mono text-white/70">
                            #{idx + 1}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-ink-2 border-t border-cream/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-cream/20 text-cream/70 hover:text-cream rounded-[8px] text-xs transition-colors cursor-pointer active:scale-[0.97]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePost}
                disabled={isSaving}
                className="px-5 py-2 bg-gradient-to-b from-[#48C9B0] to-[#36998A] text-ink font-semibold rounded-[8px] text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 active:scale-[0.97] hover:brightness-105"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{editingPost ? 'Save Changes' : 'Publish Carousel Post'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch 4-Photo Splitter Modal */}
      {isBatchModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200 select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsBatchModalOpen(false);
          }}
        >
          <div className="bg-[#171D1C] border border-cream/15 rounded-[14px] max-w-2xl w-full max-h-[90vh] flex flex-col justify-between overflow-hidden shadow-2xl text-left text-cream animate-modal-in">
            {/* Modal Header */}
            <div className="p-5 border-b border-cream/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[8px] bg-teal/15 border border-teal/40 flex items-center justify-center text-teal shrink-0">
                  <Split className="w-4 h-4 text-teal" />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-cream font-medium">
                    Batch 4-Photo Carousel Splitter
                  </h3>
                  <p className="text-xs font-sans text-cream/50 mt-0.5">
                    Upload 12–20 wedding photos to automatically generate 4-photo carousel posts with 1 click.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="p-1.5 text-cream/50 hover:text-cream rounded-[8px] hover:bg-cream/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs font-sans flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-cream/70">
                    Category
                  </label>
                  <select
                    value={batchCategory}
                    onChange={(e) => setBatchCategory(e.target.value)}
                    className="w-full bg-ink-3 border border-cream/15 rounded-[8px] p-2 text-xs text-cream focus:border-teal outline-none"
                  >
                    <option value="photography">Photography</option>
                    <option value="traditional">Traditional / Wteya</option>
                    <option value="editorial">Editorial</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-cream/70">
                    Photos Per Post (Carousel Size)
                  </label>
                  <select
                    value={photosPerPost}
                    onChange={(e) => setPhotosPerPost(Number(e.target.value))}
                    className="w-full bg-ink-3 border border-cream/15 rounded-[8px] p-2 text-xs text-cream focus:border-teal outline-none font-mono"
                  >
                    <option value={3}>3 Photos per Post</option>
                    <option value={4}>4 Photos per Post (Standard Instagram)</option>
                    <option value={5}>5 Photos per Post</option>
                    <option value={6}>6 Photos per Post</option>
                  </select>
                </div>
              </div>

              {/* Upload area */}
              <div className="space-y-3 pt-2 border-t border-cream/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-cream/90 font-medium">
                    Select All Wedding Photos ({batchPhotos.length} Photos Selected)
                  </span>

                  <button
                    type="button"
                    onClick={() => batchFileInputRef.current?.click()}
                    disabled={isBatchUploading}
                    className="px-3.5 py-1.5 bg-teal text-ink font-semibold rounded-[8px] text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.97]"
                  >
                    {isBatchUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5" />
                    )}
                    <span>Select Batch Photos</span>
                  </button>
                  <input
                    ref={batchFileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleBatchFileUpload(e.target.files)}
                  />
                </div>

                {batchPhotos.length === 0 ? (
                  <div
                    onClick={() => batchFileInputRef.current?.click()}
                    className="border-2 border-dashed border-teal/30 hover:border-teal rounded-[14px] p-8 text-center cursor-pointer space-y-2 bg-ink-3/40 transition-colors"
                  >
                    <UploadCloud className="w-8 h-8 text-teal mx-auto" />
                    <p className="text-xs text-cream/80 font-medium">
                      Select 12, 16, 20 or more wedding photos at once
                    </p>
                    <p className="text-[11px] text-cream/40">
                      They will be automatically grouped into sequential {photosPerPost}-photo carousel posts.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Live Split Preview */}
                    <div className="p-3.5 bg-ink-3 border border-teal/30 rounded-[8px] text-xs text-cream space-y-1.5">
                      <div className="flex items-center gap-2 text-teal font-medium">
                        <Check className="w-4 h-4 text-teal" />
                        <span>
                          {batchPhotos.length} photos will be split into{' '}
                          {Math.ceil(batchPhotos.length / photosPerPost)} carousel posts ({photosPerPost} photos each):
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-cream/60 space-y-0.5 pl-6">
                        {Array.from({ length: Math.ceil(batchPhotos.length / photosPerPost) }).map(
                          (_, idx) => (
                            <div key={idx}>
                              • Post {idx + 1}: {batchTitle || 'Wedding'} — Part {idx + 1} (
                              {Math.min(photosPerPost, batchPhotos.length - idx * photosPerPost)} photos)
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Thumbnails */}
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                      {batchPhotos.map((url, idx) => (
                        <div key={idx} className="relative aspect-[4/5] rounded-[6px] overflow-hidden border border-cream/20">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <span className="absolute bottom-0.5 left-1 text-[9px] font-mono text-white/80">
                            #{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-ink-2 border-t border-cream/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="px-4 py-2 border border-cream/20 text-cream/70 hover:text-cream rounded-[8px] text-xs transition-colors cursor-pointer active:scale-[0.97]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBatchCreate}
                disabled={isSaving || batchPhotos.length === 0}
                className="px-5 py-2 bg-gradient-to-b from-[#48C9B0] to-[#36998A] text-ink font-semibold rounded-[8px] text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 active:scale-[0.97] hover:brightness-105"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Split className="w-3.5 h-3.5" />}
                <span>
                  Generate {Math.ceil(batchPhotos.length / photosPerPost) || 0} Carousel Posts
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!postToDelete}
        title={postToDelete?.isGallery ? "Remove from Public Portfolio?" : "Delete Portfolio Post"}
        description={
          postToDelete?.isGallery
            ? `Are you sure you want to remove "${postToDelete.title}" from the public homepage portfolio? This media file will remain safely preserved in the client's private gallery.`
            : `Are you sure you want to delete "${postToDelete?.title}"? This action cannot be undone.`
        }
        confirmLabel={postToDelete?.isGallery ? "Remove from Portfolio" : "Delete"}
        isDeleting={isDeleting}
        onConfirm={confirmDeletePost}
        onCancel={() => setPostToDelete(null)}
      />

      {/* Instagram Image Cropper Modal */}
      {activeCropItem && (
        <ImageCropperModal
          isOpen={!!activeCropItem}
          imageSrc={activeCropItem.src}
          initialRatio={postRatio}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
};

export default PortfolioPostsManager;
