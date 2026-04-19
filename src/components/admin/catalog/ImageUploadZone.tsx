import React, { useRef } from 'react';
import { UploadStatus } from '../../../hooks/admin/useImageUpload';
import { UploadCloud, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  startUpload: (files: File[]) => void;
  uploads: UploadStatus[];
  isUploading: boolean;
}

export default function ImageUploadZone({ startUpload, uploads, isUploading }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const validFiles = filesArray.filter(file => {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`File ${file.name} exceeds 5MB limit`);
          return false;
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          toast.error(`File ${file.name} is not a supported image format`);
          return false;
        }
        return true;
      });

      if (validFiles.length > 20) {
        toast.error('Maximum 20 images allowed at once');
        validFiles.length = 20;
      }

      if (validFiles.length > 0) {
        startUpload(validFiles);
      }
    }
  };

  const copyToClipboard = (url: string | null) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard!');
  };

  return (
    <div className="bg-[#111111] p-6 rounded-2xl border border-[#2A2A2A]">
      <h3 className="text-lg font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="bg-[#E8B84B] text-black w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
        Step 1: Upload Product Images First
      </h3>
      
      <div 
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed border-[#2A2A2A] rounded-2xl p-8 text-center cursor-pointer hover:border-[#E8B84B] transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <UploadCloud className="mx-auto text-gray-500 mb-2" size={32} />
        <p className="text-sm text-white font-bold">Drag and drop images here or click to browse</p>
        <p className="text-xs text-gray-500 mt-1">Accepts JPG, PNG, WEBP. Max 5MB each. Max 20 files.</p>
        <input 
          type="file" 
          multiple 
          accept="image/jpeg, image/png, image/webp" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>

      {uploads.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Instruction: Copy these URLs → paste into your Excel sheet Image_URL columns
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploads.map((upload, idx) => (
              <div key={idx} className="bg-black border border-white/10 rounded-xl p-3 flex flex-col gap-2">
                <p className="text-[10px] text-gray-400 font-mono truncate" title={upload.file.name}>{upload.file.name}</p>
                <div className="h-1.5 w-full bg-[#1A1A1A] rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${upload.error ? 'bg-red-500' : 'bg-[#E8B84B]'}`}
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
                {upload.error ? (
                  <p className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle size={10} /> {upload.error}</p>
                ) : upload.url ? (
                  <div className="flex gap-2 items-center mt-1">
                    <input type="text" readOnly value={upload.url} className="text-[10px] bg-[#1A1A1A] text-gray-400 px-2 py-1.5 rounded flex-1 outline-none font-mono truncate" />
                    <button onClick={(e) => { e.stopPropagation(); copyToClipboard(upload.url); }} className="p-1.5 text-[#00C9A7] hover:bg-[#00C9A7]/10 rounded" title="Copy URL">
                      <Copy size={14} />
                    </button>
                    <CheckCircle2 size={14} className="text-[#00C9A7]" />
                  </div>
                ) : (
                  <p className="text-gray-500 text-[10px]">{Math.round(upload.progress)}% uploading...</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
