import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Trash2, RefreshCw } from 'lucide-react';
import { KycUploadedFile } from '../types/kyc';
import { formatFileSize } from '../data/kycData';

interface DocumentUploadBoxProps {
  label: string;
  sublabel?: string;
  currentFile: KycUploadedFile | null;
  onFileSelect: (file: KycUploadedFile) => void;
  onFileRemove: () => void;
  acceptTypes?: string[];
  maxSizeBytes?: number;
}

export default function DocumentUploadBox({
  label,
  sublabel = 'JPEG, PNG or PDF (Max 5MB)',
  currentFile,
  onFileSelect,
  onFileRemove,
  acceptTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  maxSizeBytes = 5 * 1024 * 1024, // 5 MB
}: DocumentUploadBoxProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = (file: File) => {
    setErrorMessage(null);

    // 1. Type Validation
    const isAcceptedType =
      acceptTypes.includes(file.type) ||
      file.name.toLowerCase().endsWith('.pdf') ||
      file.name.toLowerCase().endsWith('.jpg') ||
      file.name.toLowerCase().endsWith('.jpeg') ||
      file.name.toLowerCase().endsWith('.png');

    if (!isAcceptedType) {
      setErrorMessage('Unsupported file format. Please upload JPEG, PNG, or PDF.');
      return;
    }

    // 2. Size Validation (Max 5MB)
    if (file.size > maxSizeBytes) {
      setErrorMessage(
        `File exceeds maximum 5MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`
      );
      return;
    }

    // 3. Create preview object url if image
    let previewUrl: string | undefined = undefined;
    if (file.type.startsWith('image/')) {
      previewUrl = URL.createObjectURL(file);
    }

    const uploadedDoc: KycUploadedFile = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: file.name,
      sizeBytes: file.size,
      type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
      previewUrl,
      uploadedAt: 'Just now',
    };

    onFileSelect(uploadedDoc);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
    // Reset file input so re-uploading the same filename triggers onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5 text-left">
      <div className="flex items-center justify-between text-xs">
        <label className="font-bold text-neutral-300">{label}</label>
        {currentFile && (
          <span className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Uploaded
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Sunken Dropzone Card */}
      {currentFile ? (
        /* Preview / Uploaded State */
        <div className="bg-[#151518] border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-3 relative overflow-hidden group">
          <div className="flex items-center gap-3 min-w-0">
            {/* Thumbnail or Icon */}
            {currentFile.previewUrl ? (
              <div className="w-12 h-12 rounded-xl bg-black/40 overflow-hidden border border-white/10 shrink-0 relative">
                <img
                  src={currentFile.previewUrl}
                  alt={currentFile.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 stroke-[1.5]" />
              </div>
            )}

            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-[260px]">
                {currentFile.name}
              </div>
              <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5">
                <span>{formatFileSize(currentFile.sizeBytes)}</span>
                <span>•</span>
                <span className="text-neutral-500">{currentFile.uploadedAt}</span>
              </div>
            </div>
          </div>

          {/* Action buttons: Remove / Re-upload */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Replace / Re-upload document"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Replace</span>
            </button>

            <button
              type="button"
              onClick={onFileRemove}
              title="Remove document"
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Empty Upload Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`bg-[#151518] border-2 border-dashed rounded-2xl p-4 text-center transition cursor-pointer select-none flex flex-col items-center justify-center gap-2 ${
            isDragOver
              ? 'border-amber-400 bg-amber-500/5'
              : 'border-white/15 hover:border-amber-400/50'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-white/5 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <UploadCloud className="w-5 h-5 stroke-[1.75]" />
          </div>

          <div>
            <div className="text-xs font-bold text-white">
              <span className="text-amber-400 hover:underline">Click to upload</span> or drag and drop
            </div>
            <p className="text-[10px] text-neutral-400 mt-0.5">{sublabel}</p>
          </div>
        </div>
      )}

      {/* Validation Error Banner */}
      {errorMessage && (
        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
