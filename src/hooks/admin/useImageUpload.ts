import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import toast from 'react-hot-toast';

export interface UploadStatus {
  file: File;
  progress: number;
  url: string | null;
  error: string | null;
}

export function useImageUpload() {
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const startUpload = async (files: File[]) => {
    const initialUploads = files.map(file => ({
      file,
      progress: 0,
      url: null,
      error: null
    }));
    
    setUploads(initialUploads);
    setIsUploading(true);

    const uploadPromises = files.map((file, index) => {
      return new Promise<void>((resolve) => {
        const timestamp = Date.now();
        const storageRef = ref(storage, `catalog/products/${timestamp}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploads(prev => {
              const newUploads = [...prev];
              newUploads[index].progress = progress;
              return newUploads;
            });
          }, 
          (error) => {
            setUploads(prev => {
              const newUploads = [...prev];
              newUploads[index].error = error.message;
              return newUploads;
            });
            resolve();
          }, 
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              setUploads(prev => {
                const newUploads = [...prev];
                newUploads[index].url = downloadURL;
                newUploads[index].progress = 100;
                return newUploads;
              });
            } catch (err: any) {
               setUploads(prev => {
                const newUploads = [...prev];
                newUploads[index].error = err.message;
                return newUploads;
              });
            }
            resolve();
          }
        );
      });
    });

    await Promise.all(uploadPromises);
    setIsUploading(false);
    toast.success('Image upload process complete!');
  };

  const clearUploads = () => {
    setUploads([]);
  };

  return { uploads, isUploading, startUpload, clearUploads };
}
