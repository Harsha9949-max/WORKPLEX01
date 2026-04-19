import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, writeBatch, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CatalogRow } from './useExcelParser';
import toast from 'react-hot-toast';

export interface CatalogProduct {
  id: string; // SKU is id
  sku: string;
  name: string;
  category: string;
  description: string;
  hvrsBasePrice: number;
  suggestedRetailPrice: number;
  images: string[];
  tags: string[];
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
  uploadedBy: string;
}

export function useCatalogProducts(adminUserId: string) {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'catalogProducts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CatalogProduct));
      setProducts(data);
      setLoading(false);
    }, (error) => {
      toast.error('Failed to fetch catalog products');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const batchUpload = async (validRows: CatalogRow[]) => {
    if (!validRows.length) return;
    
    try {
      const chunkSize = 20;
      for (let i = 0; i < validRows.length; i += chunkSize) {
        const chunk = validRows.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        
        chunk.forEach(row => {
          const sku = row.SKU.trim();
          const docRef = doc(db, 'catalogProducts', sku);
          const images = [row.Image_URL_1.trim()];
          if (row.Image_URL_2?.trim()) images.push(row.Image_URL_2.trim());
          if (row.Image_URL_3?.trim()) images.push(row.Image_URL_3.trim());

          const tags = row.Tags ? String(row.Tags).split(',').map(t => t.trim()).filter(Boolean) : [];
          const isActive = String(row.Is_Active).toLowerCase() === 'false' ? false : true;

          batch.set(docRef, {
            sku,
            name: row.Name.trim(),
            category: row.Category.trim(),
            description: row.Description.trim(),
            hvrsBasePrice: Number(row.Base_Price),
            suggestedRetailPrice: Number(row.Suggested_Price),
            images,
            tags,
            isActive,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            uploadedBy: adminUserId
          }, { merge: true });
        });

        await batch.commit();
      }
      toast.success('Successfully uploaded products to catalog!');
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
      throw error; // Rethrow to handle in UI
    }
  };

  const toggleActive = async (productId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'catalogProducts', productId), {
        isActive: !currentStatus,
        updatedAt: serverTimestamp()
      });
      toast.success(currentStatus ? 'Product disabled' : 'Product activated');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      await deleteDoc(doc(db, 'catalogProducts', productId));
      toast.success('Product deleted');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return { products, loading, batchUpload, toggleActive, deleteProduct };
}
