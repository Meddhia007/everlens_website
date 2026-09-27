'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, Check, ZoomIn, ZoomOut, RotateCcw, Move, Scissors } from 'lucide-react';

export type InstagramRatio = '1:1' | '4:5';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  initialRatio?: InstagramRatio;
  onCropComplete: (croppedBlob: Blob, croppedDataUrl: string, originalSrc: string) => void;
  onCancel: () => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  initialRatio = '4:5',
  onCropComplete,
  onCancel,
}) => {
  const [ratio, setRatio] = useState<InstagramRatio>(initialRatio);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Target output dimensions
  const targetDims = useMemo(() => {
    return ratio === '1:1' ? { width: 1080, height: 1080 } : { width: 1080, height: 1350 };
  }, [ratio]);

  // Crop preview box dimensions (proportional to target aspect ratio)
  const cropBoxWidth = ratio === '1:1' ? 320 : 280;
  const cropBoxHeight = ratio === '1:1' ? 320 : 350;

  // Load natural dimensions reliably on imageSrc change
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      }
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Reset pan/zoom on image or initialRatio change
  useEffect(() => {
    setRatio(initialRatio);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [imageSrc, initialRatio]);

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onCancel();
    },
    [isOpen, onCancel]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Calculate base display size so the photo fills (covers) the crop window at zoom = 1
  const { baseWidth, baseHeight } = useMemo(() => {
    if (!imageSize.width || !imageSize.height) {
      return { baseWidth: cropBoxWidth, baseHeight: cropBoxHeight };
    }
    const imgAspect = imageSize.width / imageSize.height;
    const boxAspect = cropBoxWidth / cropBoxHeight;

    if (imgAspect > boxAspect) {
      // Landscape or wider than box: match box height, scale width proportionally
      return {
        baseHeight: cropBoxHeight,
        baseWidth: Math.round(cropBoxHeight * imgAspect),
      };
    } else {
      // Portrait or taller than box: match box width, scale height proportionally
      return {
        baseWidth: cropBoxWidth,
        baseHeight: Math.round(cropBoxWidth / imgAspect),
      };
    }
  }, [imageSize, cropBoxWidth, cropBoxHeight]);

  // Maximum allowed panning bounds so image does not fly off screen
  const maxPanX = Math.max(0, (baseWidth * zoom - cropBoxWidth) / 2);
  const maxPanY = Math.max(0, (baseHeight * zoom - cropBoxHeight) / 2);

  // Keep pan clamped within bounds when zoom, ratio, or image changes
  useEffect(() => {
    setPan((prev) => ({
      x: Math.min(maxPanX, Math.max(-maxPanX, prev.x)),
      y: Math.min(maxPanY, Math.max(-maxPanY, prev.y)),
    }));
  }, [maxPanX, maxPanY]);

  if (!isOpen || !imageSrc) return null;

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    }
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const rawX = e.clientX - dragStart.x;
    const rawY = e.clientY - dragStart.y;
    setPan({
      x: Math.min(maxPanX, Math.max(-maxPanX, rawX)),
      y: Math.min(maxPanY, Math.max(-maxPanY, rawY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const rawX = e.touches[0].clientX - dragStart.x;
    const rawY = e.touches[0].clientY - dragStart.y;
    setPan({
      x: Math.min(maxPanX, Math.max(-maxPanX, rawX)),
      y: Math.min(maxPanY, Math.max(-maxPanY, rawY)),
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom((prev) => Math.min(3, Math.max(0.8, +(prev + delta).toFixed(2))));
  };

  // Reset View
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Execute export crop to exact Instagram resolution (1080x1350 or 1080x1080)
  const handleCrop = () => {
    if (!imageRef.current) return;
    const img = imageRef.current;

    const canvas = document.createElement('canvas');
    canvas.width = targetDims.width;
    canvas.height = targetDims.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill background with dark luxury tone for letterbox / safety margins
    ctx.fillStyle = '#0B0F0E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const dispWidth = baseWidth * zoom;
    const dispHeight = baseHeight * zoom;

    // Position of image relative to crop box
    const imageLeftInContainer = (cropBoxWidth - dispWidth) / 2 + pan.x;
    const imageTopInContainer = (cropBoxHeight - dispHeight) / 2 + pan.y;

    // Scale factor from preview box to full resolution output canvas
    const canvasScale = targetDims.width / cropBoxWidth;

    const destX = imageLeftInContainer * canvasScale;
    const destY = imageTopInContainer * canvasScale;
    const destWidth = dispWidth * canvasScale;
    const destHeight = dispHeight * canvasScale;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, destX, destY, destWidth, destHeight);

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(blob, croppedDataUrl, imageSrc);
        }
      },
      'image/jpeg',
      0.95
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xs select-none"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-[#131918] border border-white/10 rounded-[14px] max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-modal-in text-left text-[#F4F3ED]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-[#0E1413] flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Scissors className="w-3.5 h-3.5 text-teal" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-teal">
                Instagram Precision Framing
              </span>
            </div>
            <h3 className="font-serif text-lg text-white font-medium">
              Crop to Exact Instagram Dimensions
            </h3>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-[#9EABA2] hover:text-white rounded-[8px] hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ratio Selector & Specs Toolbar */}
        <div className="p-3 sm:px-5 bg-[#171E1D] border-b border-white/[0.06] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#9EABA2]">Ratio:</span>
            <button
              type="button"
              onClick={() => {
                setRatio('4:5');
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className={`px-3 py-1 rounded-[8px] font-mono text-xs transition-all active:scale-[0.97] cursor-pointer ${
                ratio === '4:5'
                  ? 'bg-teal/20 text-teal border border-teal/40 font-semibold'
                  : 'bg-[#131918] text-[#9EABA2] hover:text-white border border-white/10'
              }`}
            >
              4:5 Portrait (1080 × 1350)
            </button>
            <button
              type="button"
              onClick={() => {
                setRatio('1:1');
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className={`px-3 py-1 rounded-[8px] font-mono text-xs transition-all active:scale-[0.97] cursor-pointer ${
                ratio === '1:1'
                  ? 'bg-teal/20 text-teal border border-teal/40 font-semibold'
                  : 'bg-[#131918] text-[#9EABA2] hover:text-white border border-white/10'
              }`}
            >
              1:1 Square (1080 × 1080)
            </button>
          </div>

          <div className="hidden sm:block text-[11px] font-mono text-teal bg-teal/10 px-2.5 py-1 rounded-[8px] border border-teal/20">
            {targetDims.width} × {targetDims.height} px
          </div>
        </div>

        {/* Viewfinder Canvas Area */}
        <div
          className="relative flex-1 bg-[#0A0E0D] p-4 sm:p-6 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onWheel={handleWheel}
        >
          {/* Framed Viewfinder Mask */}
          <div
            ref={containerRef}
            style={{ width: `${cropBoxWidth}px`, height: `${cropBoxHeight}px` }}
            className="relative overflow-hidden border-2 border-teal/60 rounded-[8px] shadow-[0_0_0_9999px_rgba(0,0,0,0.75)] flex items-center justify-center select-none"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            {/* Thirds Grid Overlay for Composition */}
            <div className="absolute inset-0 pointer-events-none z-10 grid grid-cols-3 grid-rows-3">
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div />
            </div>

            {/* Draggable & Scalable Image */}
            <img
              ref={imageRef}
              src={imageSrc}
              crossOrigin="anonymous"
              alt="Crop preview"
              onLoad={handleImageLoad}
              style={{
                width: `${baseWidth}px`,
                height: `${baseHeight}px`,
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 100ms ease-out',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
              className="select-none max-w-none shrink-0"
              draggable={false}
            />
          </div>

          {/* Hint Overlay */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-black/75 rounded-full text-[10px] font-mono text-[#9EABA2] pointer-events-none flex items-center gap-1.5 backdrop-blur-xs border border-white/10 whitespace-nowrap">
            <Move className="w-3 h-3 text-teal" />
            <span>Drag to re-center • Scroll or slider to zoom</span>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="p-3 px-5 bg-[#0F1413] border-t border-white/[0.08] flex items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-3 flex-1 max-w-sm">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(0.8, +(prev - 0.1).toFixed(2)))}
              className="text-[#9EABA2] hover:text-white transition-colors cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min={0.8}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-teal h-1 bg-[#182220] rounded-[8px] cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(3, +(prev + 0.1).toFixed(2)))}
              className="text-[#9EABA2] hover:text-white transition-colors cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-[#9EABA2] w-12 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-[11px] text-[#9EABA2] hover:text-white px-2 py-1 rounded-[8px] hover:bg-white/5 transition-colors cursor-pointer"
            title="Reset position and zoom"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-[#131918] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-sans text-[#9EABA2] hover:text-white hover:bg-white/[0.04] rounded-[8px] transition-all active:scale-[0.97] cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCrop}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-gradient-to-b from-[#48C9B0] to-[#36998A] text-[#0B0F0E] font-sans text-xs font-semibold hover:brightness-105 active:scale-[0.97] transition-all shadow-sm cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Apply Crop ({targetDims.width} × {targetDims.height})</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;
