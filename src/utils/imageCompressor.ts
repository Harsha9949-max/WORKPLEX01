/**
 * In-browser Image Compressor Utility for Super-fast Uploads
 * Shrinks image dimensions and applies high-performance JPG compression on the fly.
 * Reduces 2MB-10MB digital photos to ultra-lightweight ~20KB-80KB payloads.
 */

export const compressImageToBlob = (
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.75
): Promise<Blob> => {
  return new Promise((resolve) => {
    // If the file is not an image or very small (e.g., < 20KB), upload as-is
    if (!file.type.startsWith('image/') || file.size < 20 * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate proportional new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file); // Fallback to raw file if canvas context is unavailable
            return;
          }

          // Use high-quality resizing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(img, 0, 0, width, height);

          // Convert canvas back to lightweight JPEG blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Return compressed blob, preserving original name if possible
                resolve(blob);
              } else {
                resolve(file); // Fallback
              }
            },
            'image/jpeg',
            quality
          );
        } catch (err) {
          console.warn('Canvas resizing crashed, falling back to original file:', err);
          resolve(file);
        }
      };

      img.onerror = () => {
        resolve(file);
      };
    };

    reader.onerror = () => {
      resolve(file);
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Universal helper to read a File or Blob as Base64.
 */
export const fileToBase64 = (file: Blob | File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
  });
};
