import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import { apiClient } from "../../lib/api";
import { Image, Upload, CheckCircle, AlertCircle, X, Loader2 } from "lucide-react";

interface ImageUploaderProps {
  onUploadComplete: (url: string) => void;
  initialUrl?: string;
  label?: string;
}

export default function ImageUploader({ onUploadComplete, initialUrl = "", label = "Scent Visual Asset" }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState<string>(initialUrl);
  const [errorInput, setErrorInput] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial URL if updated by parent
  React.useEffect(() => {
    setImageUrl(initialUrl);
  }, [initialUrl]);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const uploadFile = (file: File) => {
    setErrorInput("");
    if (!file.type.startsWith("image/")) {
      setErrorInput("Selected file must be an image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorInput("Asset is too large. Keep it under 2MB.");
      return;
    }

    // Simulate progress for UX
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null || prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 10;
      });
    }, 100);

    try {
      // TODO: Replace with actual MERN upload endpoint
      // const formData = new FormData();
      // formData.append('image', file);
      // const res = await apiClient('/upload', { method: 'POST', body: formData });
      // const downloadUrl = res.url;

      const downloadUrl = URL.createObjectURL(file);
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => {
        setImageUrl(downloadUrl);
        onUploadComplete(downloadUrl);
        setUploadProgress(null);
      }, 300);
    } catch (err: any) {
      clearInterval(interval);
      console.error("Upload Error:", err);
      setErrorInput(err.message || "Failed to upload asset.");
      setUploadProgress(null);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    setImageUrl("");
    onUploadComplete("");
  };

  return (
    <div className="space-y-2">
      <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold">
        {label}
      </label>

      {imageUrl ? (
        <div className="relative group border border-white/10 rounded-xl overflow-hidden bg-zinc-950/40">
          <img
            src={imageUrl}
            alt="Scent aura preview"
            className="w-full h-32 object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={onButtonClick}
              className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-[10px] font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-white/10"
            >
              <Upload className="w-3.5 h-3.5" /> Replace
            </button>
            <button
              type="button"
              onClick={clearImage}
              className="px-3 py-1.5 bg-red-600/30 hover:bg-red-600/50 text-red-200 text-[10px] font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-red-500/20"
            >
              <X className="w-3.5 h-3.5" /> Remove
            </button>
          </div>
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono rounded flex items-center gap-1">
            <CheckCircle className="w-3 h-3 animate-pulse" /> Live Upload
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
          className={`relative border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? "border-[#D21B27] bg-[#D21B27]/5"
              : "border-white/15 hover:border-white/30 bg-white/[0.01] hover:bg-white/[0.03]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleChange}
          />

          {uploadProgress !== null ? (
            <div className="space-y-3 py-2 flex flex-col items-center">
              <Loader2 className="w-6 h-6 text-[#D21B27] animate-spin" />
              <div className="text-xs text-stone-200 font-mono tracking-wide">
                Uploading Aura: {uploadProgress}%
              </div>
              <div className="w-full max-w-xs bg-white/5 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-[#D21B27] h-full transition-all duration-350"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2 flex flex-col items-center">
              <Upload className="w-5 h-5 text-neutral-400" />
              <p className="text-[11px] text-neutral-300 font-light font-sans">
                Drag and drop scent photo, or <span className="text-[#D21B27] font-semibold underline">browse</span>
              </p>
              <p className="text-[9px] text-zinc-500 font-mono">
                Supports JPEG, PNG, or WebP up to 2MB
              </p>
            </div>
          )}
        </div>
      )}

      {errorInput && (
        <div className="text-[#D21B27] text-[10px] font-mono flex items-center gap-1 mt-1 bg-red-500/5 p-2 border border-red-500/10 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{errorInput}</span>
        </div>
      )}
    </div>
  );
}
