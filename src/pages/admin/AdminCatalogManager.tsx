import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  DownloadCloud, Upload, AlertTriangle, Search, Filter as FilterIcon, 
  MoreVertical, Edit2, Trash2, Plus, X, ChevronLeft, ChevronRight, Check,
  ChevronDown, FileSpreadsheet, Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { db, auth } from '../../lib/firebase';
import { collection, doc, query, where, writeBatch, serverTimestamp, deleteDoc, updateDoc, onSnapshot, getDocs } from 'firebase/firestore';

// --- SMART PARSER UTILS ---
const findDataSheet = (workbook) => {
  const sheetNames = workbook.SheetNames;
  const dataSheetKeywords = ['bulk_upload', 'products', 'catalog', 'upload', 'items', 'sheet1', 'data', 'inventory', 'product'];
  for (const keyword of dataSheetKeywords) {
    const match = sheetNames.find(name => name.toLowerCase().includes(keyword));
    if (match) return match;
  }
  let bestSheet = sheetNames[0];
  let maxRows = 0;
  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', blankrows: false });
    if (rows.length > maxRows) { maxRows = rows.length; bestSheet = sheetName; }
  }
  return bestSheet;
};

const COLUMN_MAP = {
  name: ['name', 'product name', 'product name (mandatory) maximum 200 characters', 'product name (mandatory)', 'item name', 'title', 'product title', 'item title', 'product', 'description', 'product description', 'item description', 'listing name', 'article name'],
  sku: ['sku', 'sku id', 'sku id (not to be edited)', 'custom sku', 'custom sku (optional) maximum 40 characters', 'custom sku (optional)', 'item sku', 'seller sku', 'article number', 'model number', 'product id', 'item id', 'asin', 'product code', 'barcode', 'product sku'],
  basePrice: ['base_price', 'base price', 'mrp', 'mrp (mandatory) number only', 'mrp (mandatory)', 'maximum retail price', 'cost price', 'purchase price', 'original price', 'market price', 'listed price', 'price', 'rate', 'unit price'],
  suggestedPrice: ['suggested_price', 'suggested price', 'selling price', 'selling price (optional) number only should be less than mrp', 'selling price (optional)', 'sale price', 'offer price', 'discounted price', 'final price', 'retail price', 'your price', 'list price'],
  category: ['category', 'business category', 'business category (mandatory) select from dropdown', 'business category (mandatory)', 'product category', 'product category (mandatory)', 'item category', 'type', 'product type', 'department', 'section', 'genre'],
  description: ['description', 'product description', 'product description (optional) maximum 2000 characters', 'product description (optional)', 'item description', 'details', 'about', 'product details', 'specification', 'features', 'info'],
  image1: ['image_url_1', 'image url 1', 'image1', 'product image1 (optional)', 'product image1', 'image 1', 'photo1', 'photo 1', 'picture1', 'img1', 'thumbnail', 'main image', 'primary image', 'cover image'],
  image2: ['image_url_2', 'image url 2', 'image2', 'product image2 (optional)', 'product image2', 'image 2', 'photo2', 'photo 2', 'picture2', 'img2'],
  image3: ['image_url_3', 'image url 3', 'image3', 'product image3 (optional)', 'product image3', 'image 3', 'photo3', 'photo 3', 'picture3', 'img3'],
  image4: ['image_url_4', 'image url 4', 'image4', 'product image4 (optional)', 'product image4', 'image 4', 'photo4'],
  image5: ['image_url_5', 'image url 5', 'image5', 'product image5 (optional)', 'product image5', 'image 5', 'photo5'],
  tags: ['tags', 'keywords', 'search terms', 'labels', 'attributes', 'best seller'],
  isActive: ['is_active', 'is active', 'active', 'status', 'available', 'in stock', 'enabled', 'published']
};

const findColumn = (headers, fieldVariants) => {
  for (const header of headers) {
    const normalizedHeader = header.toString().toLowerCase().trim().replace(/\s+/g, ' ');
    for (const variant of fieldVariants) {
      const normalizedVariant = variant.toLowerCase().trim();
      if (normalizedHeader === normalizedVariant || normalizedHeader.includes(normalizedVariant) || normalizedVariant.includes(normalizedHeader)) {
        return header;
      }
    }
  }
  return null;
};

const parseRowWithMapping = (row, columnMapping) => {
  const getValue = (field) => {
    const col = columnMapping[field];
    if (!col) return '';
    const val = row[col];
    return val !== null && val !== undefined ? String(val).trim() : '';
  };
  const getNumber = (field) => {
    const val = getValue(field);
    const num = parseFloat(val.replace(/[₹,\s]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const images = [getValue('image1'), getValue('image2'), getValue('image3'), getValue('image4'), getValue('image5')]
    .filter(url => url && url.startsWith('http') && url.length > 10);

  const name = getValue('name');
  const sku = getValue('sku') || `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  const category = getValue('category') || 'General';

  return {
    name, sku, category, description: getValue('description'),
    basePrice: getNumber('basePrice'), suggestedPrice: getNumber('suggestedPrice'),
    images, tags: getValue('tags').split(',').map(t => t.trim()).filter(Boolean), isActive: true
  };
};

const detectFormat = (headers) => {
  const headerStr = headers.join(' ').toLowerCase();
  if (headerStr.includes('mrp') && headerStr.includes('business category')) return 'Meesho / SmartBiz (Amazon)';
  if (headerStr.includes('asin') || headerStr.includes('amazon')) return 'Amazon Seller Central';
  if (headerStr.includes('flipkart')) return 'Flipkart Seller Hub';
  if (headerStr.includes('base_price')) return 'WorkPlex Template';
  return 'Custom Format';
};

const ProductImage = ({ images, name }) => {
  const [imgError, setImgError] = useState(false);
  const src = images?.[0] || '';
  if (!src || imgError) {
    return (
      <div style={{ width: 40, height: 40, background: '#2A2A2A', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
        📦
      </div>
    );
  }
  return <img src={src} alt={name} width={40} height={40} style={{ objectFit: 'cover', borderRadius: 6 }} onError={() => setImgError(true)} />;
};

export default function AdminCatalogManager() {
  const [activeTab, setActiveTab] = useState('BuyRix');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Table filters & pagination & selection
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  
  // Modals
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showSingleAdd, setShowSingleAdd] = useState(false);
  
  const [productForm, setProductForm] = useState({
    id: '', name: '', sku: '', category: '', description: '', 
    hvrsBasePrice: '', suggestedRetailPrice: '',
    image1: '', image2: '', image3: '', tags: '', isActive: true
  });
  
  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Validation state
  const [validProducts, setValidProducts] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [skippedRows, setSkippedRows] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [detectedFormat, setDetectedFormat] = useState('');
  const [parsingStatus, setParsingStatus] = useState('idle');
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef(null);

  // 1. Fetch Products
  const fetchProducts = useCallback(() => {
    setLoading(true);
    const q = query(collection(db, 'catalogProducts'), where('venture', '==', activeTab));
    const unsubscribe = onSnapshot(q, (snap) => {
      const prods = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      prods.sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setProducts(prods);
      setLoading(false);
    }, (err) => {
      toast.error('Failed to load products');
      setLoading(false);
    });
    return unsubscribe;
  }, [activeTab]);

  useEffect(() => {
    const unsub = fetchProducts();
    return () => unsub && unsub();
  }, [fetchProducts]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [activeTab, searchTerm, statusFilter]);

  // Bulk Upload Implementation
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const isValid = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.type.includes('spreadsheet') || file.type.includes('excel');
    if (!isValid) {
      toast.error('Please upload .xlsx file');
      return;
    }
    processFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    processFile(file);
    e.target.value = '';
  };

  const processFile = (file) => {
    setSelectedFile(file);
    setParsingStatus('parsing');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, {
          type: 'array',
          cellDates: true,
        });

        // STEP 1: Find correct sheet
        const targetSheet = findDataSheet(workbook);
        const sheet = workbook.Sheets[targetSheet];

        // STEP 2: Get raw rows
        const rawRows = XLSX.utils.sheet_to_json(
          sheet,
          {
            defval: '',
            raw: false,
            blankrows: false,
          }
        );

        if (rawRows.length === 0) {
          toast.error('No data found in file. Please check your Excel file.');
          setParsingStatus('error');
          return;
        }

        // STEP 3: Detect column mapping from first row's keys
        const headers = Object.keys(rawRows[0]);

        const columnMapping = {};
        for (const [field, variants] of Object.entries(COLUMN_MAP)) {
          const found = findColumn(headers, variants);
          if (found) {
            columnMapping[field] = found;
          }
        }

        // Show detected format to admin
        const detectedFormat = detectFormat(headers);
        setDetectedFormat(detectedFormat);

        // STEP 4: Parse all rows
        const valid = [];
        const errors = [];
        const skipped = [];

        rawRows.forEach((row, index) => {
          const rowNum = index + 2;
          const parsed = parseRowWithMapping(row, columnMapping);

          // Skip completely empty rows
          if (!parsed.name && !parsed.sku) {
            skipped.push(rowNum);
            return;
          }

          const rowErrors = [];

          // Only NAME is truly required
          if (!parsed.name) {
            // Try to build name from other fields
            const possibleName =
              row['Product Name'] ||
              row['Title'] ||
              row['Item'] ||
              Object.values(row).find(v => v && String(v).length > 3 && String(v).length < 200);

            if (possibleName) {
              parsed.name = String(possibleName).trim();
            } else {
              rowErrors.push('Product name not found');
            }
          }

          // Price validation
          // If only MRP exists, use it for both
          if (parsed.basePrice > 0 && parsed.suggestedPrice === 0) {
            parsed.suggestedPrice = parsed.basePrice;
          }

          // If only selling price exists
          if (parsed.basePrice === 0 && parsed.suggestedPrice > 0) {
            parsed.basePrice = Math.round(parsed.suggestedPrice * 0.8);
          }

          // Both prices missing — try to find any numeric value as price
          if (parsed.basePrice === 0 && parsed.suggestedPrice === 0) {
            const anyPrice = Object.values(row).find(v => {
              const n = parseFloat(String(v));
              return !isNaN(n) && n > 0 && n < 1000000;
            });
            if (anyPrice) {
              parsed.basePrice = parseFloat(String(anyPrice));
              parsed.suggestedPrice = parsed.basePrice;
            }
          }

          if (rowErrors.length > 0) {
            errors.push({
              row: rowNum,
              errors: rowErrors,
              data: parsed
            });
          } else {
            valid.push({
              ...parsed,
              venture: activeTab,
            });
          }
        });

        setValidProducts(valid);
        setValidationErrors(errors);
        setSkippedRows(skipped);
        setColumnMapping(columnMapping);
        setParsingStatus('done');

      } catch (err) {
        toast.error('Could not read file. Try again.');
        setParsingStatus('error');
      }
    };

    reader.onerror = () => {
      toast.error('File read failed.');
      setParsingStatus('error');
    };

    reader.readAsArrayBuffer(file);
  };

  const uploadProducts = async () => {
    setUploading(true);
    setUploadProgress(0);

    try {
      // Check for existing SKUs
      const existingSkus = new Set();
      const existingQuery = await getDocs(
        query(
          collection(db, 'catalogProducts'),
          where('venture', '==', activeTab)
        )
      );
      existingQuery.forEach(doc => {
        existingSkus.add(doc.data().sku);
      });

      // Filter out duplicates
      const newProducts = validProducts.filter(p => !existingSkus.has(p.sku));
      const duplicates = validProducts.filter(p => existingSkus.has(p.sku));

      if (newProducts.length === 0) {
        toast.error('All products already exist in catalog. No duplicates added.');
        setUploading(false);
        return;
      }

      if (duplicates.length > 0) {
        // Show warning but continue
        toast(`⚠️ ${duplicates.length} duplicate products skipped. Uploading ${newProducts.length} new.`, { icon: '⚠️' });
      }

      // Get all reseller shops for this venture
      const shopsQuery = await getDocs(query(collection(db, 'partnerShops'), where('venture', '==', activeTab)));
      const resellerShops = shopsQuery.docs.map(doc => doc.id);

      // Batch upload in chunks of 20
      const chunks = [];
      for (let i = 0; i < newProducts.length; i += 20) {
        chunks.push(newProducts.slice(i, i+20));
      }

      let uploaded = 0;
      for (const chunk of chunks) {
        let batch = writeBatch(db);
        let batchCount = 0;
        const commitAndReset = async () => {
             if (batchCount > 0) {
                 await batch.commit();
                 batch = writeBatch(db);
                 batchCount = 0;
             }
        };

        for (const product of chunk) {
          const ref = doc(collection(db, 'catalogProducts'));
          batch.set(ref, {
            sku: product.sku,
            name: product.name,
            category: product.category,
            description: product.description || '',
            hvrsBasePrice: product.basePrice,
            suggestedRetailPrice: product.suggestedPrice || (product.basePrice * 1.5),
            images: product.images || [],
            tags: product.tags || [],
            isActive: true,
            venture: activeTab,
            importedFrom: detectedFormat,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            uploadedBy: auth?.currentUser?.uid || 'admin'
          });
          batchCount++;

          // Sync to all respective resellers
          for (const shopUid of resellerShops) {
              const partnerProdRef = doc(db, `partnerProducts/${shopUid}/products`, ref.id);
              batch.set(partnerProdRef, {
                 productId: ref.id,
                 name: product.name,
                 images: product.images || [],
                 hvrsBasePrice: product.basePrice,
                 partnerSellingPrice: product.suggestedPrice || (product.basePrice * 1.5),
                 partnerMargin: (product.suggestedPrice || (product.basePrice * 1.5)) - product.basePrice,
                 category: product.category || 'General',
                 description: product.description || '',
                 isActive: true,
                 venture: activeTab,
                 addedAt: serverTimestamp()
              });
              batchCount++;
              if (batchCount >= 450) await commitAndReset();
          }
           await commitAndReset();
        }
        await commitAndReset();
        uploaded += chunk.length;
        setUploadProgress(Math.round((uploaded / newProducts.length) * 100));
      }

      toast.success(`✅ ${uploaded} products added to ${activeTab} catalog!`);
      setShowBulkUpload(false);
      resetModal();
      fetchProducts();

    } catch (err) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetModal = () => {
    setSelectedFile(null);
    setValidProducts([]);
    setValidationErrors([]);
    setSkippedRows([]);
    setColumnMapping({});
    setDetectedFormat('');
    setParsingStatus('idle');
    setUploading(false);
    setUploadProgress(0);
  };

  const downloadTemplate = () => {
    const wsData = [
      ['SKU', 'Name', 'Category', 'Description', 'Base_Price', 'Suggested_Price', 'Image_URL_1', 'Image_URL_2', 'Image_URL_3', 'Tags', 'Is_Active'],
      ['BX001', 'iPhone Case', 'Electronics', 'Premium leather case', '500', '750', 'https://example.com/img1.jpg', '', '', 'case,phone', 'true']
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "WorkPlex Catalog");
    XLSX.writeFile(wb, "products_template.xlsx");
  };

  // Single Product Edit/Add
  const handleSingleSave = async (e) => {
    e.preventDefault();
    try {
      const basePrice = parseFloat(productForm.hvrsBasePrice);
      const suggested = parseFloat(productForm.suggestedRetailPrice);
      if (basePrice <= 0) return toast.error("Base price must be greater than 0");
      if (suggested <= basePrice) return toast.error("Suggested price must be greater than Base price");
      
      setUploading(true);
      const payload = {
        name: productForm.name,
        sku: productForm.sku,
        category: productForm.category,
        description: productForm.description,
        hvrsBasePrice: basePrice,
        suggestedRetailPrice: suggested,
        images: [productForm.image1, productForm.image2, productForm.image3].filter(Boolean),
        tags: productForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        isActive: productForm.isActive,
        venture: activeTab
      };

      if (productForm.id) {
        await updateDoc(doc(db, 'catalogProducts', productForm.id), payload);
        toast.success("Product updated successfully!");
      } else {
        const productRef = doc(collection(db, 'catalogProducts'));
        let batch = writeBatch(db);
        let batchCount = 0;
        const commitAndReset = async () => {
             if (batchCount > 0) {
                 await batch.commit();
                 batch = writeBatch(db);
                 batchCount = 0;
             }
        };

        batch.set(productRef, {
          ...payload,
          createdAt: serverTimestamp(),
          uploadedBy: auth?.currentUser?.uid || 'admin'
        });
        batchCount++;

        const shopsQuery = await getDocs(query(collection(db, 'partnerShops'), where('venture', '==', activeTab)));
        for (const shopDoc of shopsQuery.docs) {
             const partnerProdRef = doc(db, `partnerProducts/${shopDoc.id}/products`, productRef.id);
             batch.set(partnerProdRef, {
                 productId: productRef.id,
                 name: payload.name,
                 images: payload.images || [],
                 hvrsBasePrice: payload.hvrsBasePrice,
                 partnerSellingPrice: payload.suggestedRetailPrice || (payload.hvrsBasePrice * 1.5),
                 partnerMargin: (payload.suggestedRetailPrice || (payload.hvrsBasePrice * 1.5)) - payload.hvrsBasePrice,
                 category: payload.category || 'General',
                 description: payload.description || '',
                 isActive: payload.isActive,
                 venture: activeTab,
                 addedAt: serverTimestamp()
             });
             batchCount++;
             if (batchCount >= 450) await commitAndReset();
        }
        await commitAndReset();
        toast.success("Product added and synced to resellers successfully!");
      }
      setShowSingleAdd(false);
    } catch (error) {
      toast.error("Operation failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const openEditModal = (prod) => {
    setProductForm({
      id: prod.id, name: prod.name, sku: prod.sku, category: prod.category,
      description: prod.description || '', hvrsBasePrice: prod.hvrsBasePrice.toString(),
      suggestedRetailPrice: prod.suggestedRetailPrice.toString(),
      image1: prod.images?.[0] || '', image2: prod.images?.[1] || '', image3: prod.images?.[2] || '',
      tags: prod.tags?.join(', ') || '', isActive: prod.isActive
    });
    setShowSingleAdd(true);
    setActionMenuOpen(null);
  };

  const deleteProductItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteDoc(doc(db, 'catalogProducts', id));
      toast.success("Product deleted successfully");
    } catch (e) {
      toast.error("Failed to delete");
    }
    setActionMenuOpen(null);
  };
  
  const toggleActiveStatus = async (prod) => {
    try {
      await updateDoc(doc(db, 'catalogProducts', prod.id), { isActive: !prod.isActive });
      toast.success(`Product ${!prod.isActive ? 'activated' : 'deactivated'}`);
    } catch (e) {
      toast.error("Failed to update status");
    }
    setActionMenuOpen(null);
  };

  // Bulk actions operations
  const runBulkAction = async (action) => {
    if (selectedIds.length === 0 && action !== 'upload') return;
    setBulkActionOpen(false);

    if (action === 'upload') {
      setShowBulkUpload(true);
    } else if (action === 'activate') {
      try {
        const batch = writeBatch(db);
        selectedIds.forEach(id => batch.update(doc(db, 'catalogProducts', id), { isActive: true }));
        await batch.commit();
        toast.success("Activated selected products");
        setSelectedIds([]);
      } catch(e) { toast.error("Action failed"); }
    } else if (action === 'deactivate') {
      try {
        const batch = writeBatch(db);
        selectedIds.forEach(id => batch.update(doc(db, 'catalogProducts', id), { isActive: false }));
        await batch.commit();
        toast.success("Deactivated selected products");
        setSelectedIds([]);
      } catch(e) { toast.error("Action failed"); }
    } else if (action === 'delete') {
      if (!window.confirm(`Delete ${selectedIds.length} products?`)) return;
      try {
        const batch = writeBatch(db);
        selectedIds.forEach(id => batch.delete(doc(db, 'catalogProducts', id)));
        await batch.commit();
        toast.success("Deleted selected products");
        setSelectedIds([]);
      } catch(e) { toast.error("Action failed"); }
    }
  };

  // Filter & Pagination
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'All' ? true : statusFilter === 'Active' ? p.isActive : !p.isActive;
      return matchSearch && matchStatus;
    });
  }, [products, searchTerm, statusFilter]);

  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const currentData = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const toggleSelectAll = () => {
    if (selectedIds.length === currentData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentData.map(p => p.id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const categoriesBuyRix = ['Electronics', 'Accessories', 'Gadgets', 'Mobile', 'Computers'];
  const categoriesVyuma = ['Fashion', 'Beauty', 'Lifestyle', 'Home Decor', 'Wellness'];
  const activeCategories = activeTab === 'BuyRix' ? categoriesBuyRix : categoriesVyuma;

  return (
    <div className="min-h-screen bg-[#0A0A0A] font-sans pb-20">
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">CATALOG MANAGER</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">DUAL-STEP PRODUCT UPLOAD PIPELINE</p>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setActiveTab('BuyRix')}
            className={`px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
              activeTab === 'BuyRix' ? 'bg-[#E8B84B] text-black shadow-lg shadow-[#E8B84B]/20' : 'bg-[#111111] border border-[#2A2A2A] text-gray-500 hover:text-white'
            }`}
          >
            BUYRIX CATALOG
          </button>
          <button 
            onClick={() => setActiveTab('Vyuma')}
            className={`px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
              activeTab === 'Vyuma' ? 'bg-[#E8B84B] text-black shadow-lg shadow-[#E8B84B]/20' : 'bg-[#111111] border border-[#2A2A2A] text-gray-500 hover:text-white'
            }`}
          >
            VYUMA CATALOG
          </button>
        </div>

        {/* Top Action Row & Search */}
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 flex flex-col xl:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto overflow-hidden">
            <h2 className="text-lg font-black text-white uppercase tracking-tight whitespace-nowrap self-center">CATALOG INVENTORY</h2>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text" 
                placeholder="Search SKU or Name..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-[#E8B84B] text-sm"
              />
            </div>
            
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none bg-[#1A1A1A] border border-[#2A2A2A] text-white pl-10 pr-10 py-2.5 rounded-xl outline-none focus:border-[#E8B84B] text-sm hidden sm:block w-32"
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hidden sm:block" size={16} />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hidden sm:block" size={16} />
            </div>
          </div>

          <div className="flex items-center gap-3 w-full xl:w-auto">
            {selectedIds.length > 0 && <span className="text-xs text-[#E8B84B] font-bold">{selectedIds.length} products selected</span>}
            
            <div className="relative w-full sm:w-auto">
              <button 
                onClick={() => setBulkActionOpen(!bulkActionOpen)}
                className="w-full sm:w-auto flex items-center justify-between gap-2 px-4 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white text-sm font-bold shadow-sm"
              >
                Bulk Actions <ChevronDown size={16} />
              </button>
              {bulkActionOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-xl z-10 overflow-hidden">
                  <button onClick={() => runBulkAction('upload')} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-[#2A2A2A]">Bulk Upload (.xlsx)</button>
                  <button onClick={() => runBulkAction('activate')} disabled={!selectedIds.length} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-[#2A2A2A] disabled:opacity-50">Activate Selected</button>
                  <button onClick={() => runBulkAction('deactivate')} disabled={!selectedIds.length} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-[#2A2A2A] disabled:opacity-50">Deactivate Selected</button>
                  <button onClick={() => runBulkAction('delete')} disabled={!selectedIds.length} className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-[#2A2A2A] disabled:opacity-50">Delete Selected</button>
                </div>
              )}
            </div>

            <button 
              onClick={() => {
                setProductForm({ name: '', sku: '', category: '', description: '', hvrsBasePrice: '', suggestedRetailPrice: '', image1: '', image2: '', image3: '', tags: '', isActive: true, id: '' });
                setShowSingleAdd(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#E8B84B] text-black rounded-xl font-black uppercase tracking-widest text-sm whitespace-nowrap hover:bg-[#F5CA66] transition-colors"
            >
              <Plus size={18} /> Add Product
            </button>
          </div>
        </div>

        {/* Table Area */}
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left align-middle border-collapse text-sm">
              <thead>
                <tr className="bg-[#0A0A0A] border-b border-[#2A2A2A] text-xs uppercase tracking-widest font-black text-gray-500">
                  <th className="px-6 py-4 w-[50px]">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.length === currentData.length && currentData.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-[#2A2A2A] bg-[#1A1A1A] accent-[#E8B84B] focus:ring-[#E8B84B]"
                      />
                    </div>
                  </th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Base Price</th>
                  <th className="px-6 py-4">Suggested</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="w-4 h-4 bg-[#2A2A2A] rounded"></div></td>
                      <td className="px-6 py-4 flex gap-3">
                        <div className="w-10 h-10 bg-[#2A2A2A] rounded-lg"></div>
                        <div className="flex flex-col gap-2 justify-center"><div className="w-32 h-3 bg-[#2A2A2A] rounded"></div><div className="w-20 h-2 bg-[#2A2A2A] rounded"></div></div>
                      </td>
                      <td className="px-6 py-4"><div className="w-20 h-5 bg-[#2A2A2A] rounded-full"></div></td>
                      <td className="px-6 py-4"><div className="w-16 h-4 bg-[#2A2A2A] rounded"></div></td>
                      <td className="px-6 py-4"><div className="w-16 h-4 bg-[#2A2A2A] rounded"></div></td>
                      <td className="px-6 py-4"><div className="w-16 h-5 bg-[#2A2A2A] rounded-full"></div></td>
                      <td className="px-6 py-4"><div className="w-8 h-8 bg-[#2A2A2A] rounded-lg mx-auto"></div></td>
                    </tr>
                  ))
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center text-gray-500 mb-2">
                          <Search size={24} />
                        </div>
                        <p className="text-gray-400 font-medium">No products found.</p>
                        <p className="text-gray-600 text-xs">Upload your first catalog or add products individually.</p>
                        <button onClick={() => setShowSingleAdd(true)} className="mt-4 px-6 py-2 bg-[#E8B84B] text-black rounded-xl font-bold uppercase tracking-widest text-xs">
                          Add Product
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentData.map((prod) => (
                    <tr key={prod.id} className="hover:bg-[#E8B84B]/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.includes(prod.id)}
                            onChange={() => toggleSelect(prod.id)}
                            className="w-4 h-4 rounded border-[#2A2A2A] bg-[#1A1A1A] accent-[#E8B84B] focus:ring-[#E8B84B]"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] overflow-hidden flex-shrink-0">
                            <ProductImage images={prod.images} name={prod.name} />
                          </div>
                          <div>
                            <p className="text-white font-bold leading-tight line-clamp-1">{prod.name}</p>
                            <p className="text-gray-500 text-xs mt-0.5">{prod.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2.5 py-1 bg-[#1A1A1A] border border-[#2A2A2A] text-gray-300 text-[10px] uppercase tracking-widest font-bold rounded-full">
                          {prod.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white font-medium">Rs.{prod.hvrsBasePrice}</td>
                      <td className="px-6 py-4 text-white font-black group-hover:text-[#00C9A7]">Rs.{prod.suggestedRetailPrice}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 text-[10px] uppercase tracking-widest font-black rounded-full ${prod.isActive ? 'bg-[#00C9A7]/10 text-[#00C9A7]' : 'bg-gray-800 text-gray-400'}`}>
                          {prod.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 relative text-center">
                        <button onClick={() => setActionMenuOpen(actionMenuOpen === prod.id ? null : prod.id)} className="p-2 hover:bg-[#1A1A1A] rounded-lg text-gray-400 transition-colors">
                          <MoreVertical size={16} />
                        </button>
                        {actionMenuOpen === prod.id && (
                          <div className="absolute right-6 top-10 w-40 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-2xl z-20 overflow-hidden text-left py-1">
                            <button onClick={() => openEditModal(prod)} className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#2A2A2A] flex items-center gap-2"><Edit2 size={14}/> Edit product</button>
                            <button onClick={() => toggleActiveStatus(prod)} className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#2A2A2A] flex items-center gap-2"><FilterIcon size={14}/> Make {prod.isActive ? 'Inactive' : 'Active'}</button>
                            <button onClick={() => deleteProductItem(prod.id)} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-[#2A2A2A] flex items-center gap-2"><Trash2 size={14}/> Delete</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {!loading && filteredProducts.length > 0 && (
            <div className="p-4 border-t border-[#2A2A2A] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0A0A0A]">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} products
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white disabled:opacity-50 hover:bg-[#2A2A2A]"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({length: totalPages}).filter((_, i) => i === 0 || i === totalPages - 1 || Math.abs(i + 1 - currentPage) <= 1).map((_, i, arr) => {
                  const pageNum = i === 0 ? 1 : i === arr.length - 1 ? totalPages : (arr[i-1] as number) + 1 === arr[i] ? arr[i] : null; // simplified pagination display
                  return (
                    <button 
                      key={i} 
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-1 bg-[#1A1A1A] border ${currentPage === i + 1 ? 'border-[#E8B84B] text-[#E8B84B]' : 'border-[#2A2A2A] text-gray-400 hover:text-white'} rounded-lg text-sm font-bold`}
                    >
                      {i + 1}
                    </button>
                  )
                })}
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white disabled:opacity-50 hover:bg-[#2A2A2A]"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Overlay Base */}
      {(showBulkUpload || showSingleAdd) && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          {showBulkUpload ? (
            <div className="w-full max-w-[500px] bg-[#1A1A1A] border border-[#2A2A2A] rounded-[12px] p-8 shadow-[0_12px_40px_rgba(0,0,0,0.6)] relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => {setShowBulkUpload(false); resetModal();}} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
              
              <h2 className="text-[20px] font-bold text-white mb-6">Bulk Add Products</h2>
              <div className="h-[1px] w-full bg-[#2A2A2A] mb-6"></div>

              {/* Step 1 */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-white font-bold text-[15px]">1. Download template</h3>
                  <p className="text-gray-400 text-[13px] mt-1 pr-4">Download the .XLSX template and fill in your product details</p>
                </div>
                <button onClick={downloadTemplate} className="flex items-center gap-1 text-[#E8B84B] hover:text-[#F5CA66] text-[14px] font-medium whitespace-nowrap mt-1 group">
                  <span className="underline underline-offset-4 decoration-[#E8B84B]/30 group-hover:decoration-[#E8B84B]">Download</span>
                  <DownloadCloud size={16} />
                </button>
              </div>

              <div className="h-[1px] w-full bg-[#2A2A2A] mb-6"></div>

              {/* Step 2 */}
              <div className="mb-4">
                <h3 className="text-white font-bold text-[15px]">2. Upload the file</h3>
                <p className="text-gray-400 text-[13px] mt-1">Upload the completed catalog file below<br/>(Upto 500 items per upload recommended)</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={handleFileChange}
              />

              {!selectedFile ? (
                <div
                  onDragEnter={handleDragOver}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg h-[120px] flex flex-col items-center justify-center cursor-pointer transition-all ${
                    isDragging ? 'border-[#E8B84B] bg-[#E8B84B]/5' : 'border-[#2A2A2A] bg-[#111111] hover:border-[#E8B84B]'
                  }`}
                >
                  <Upload className="text-gray-500 mb-2" size={32} />
                  <div className="flex items-center gap-1">
                    <span className="text-white font-medium border border-white/20 px-2 py-0.5 rounded text-sm bg-[#1A1A1A]">Choose file</span>
                    <span className="text-gray-500 text-sm">or drag file here</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileSpreadsheet className="text-blue-400 flex-shrink-0" size={20} />
                      <span className="text-white text-sm font-medium truncate">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                    </div>
                    <button onClick={resetModal} className="text-gray-500 hover:text-white p-1">
                      <X size={16} />
                    </button>
                  </div>

                  {detectedFormat && (
                    <div className="mb-4">
                      <div className="inline-block px-3 py-1 bg-teal-500/20 text-teal-400 font-bold text-xs rounded-full border border-teal-500/30">
                        📊 Detected Format: {detectedFormat}
                      </div>

                      {Object.keys(columnMapping).length > 0 && (
                        <details className="mt-2 text-xs">
                          <summary className="text-gray-400 cursor-pointer hover:text-white transition-colors">Show detected columns ▼</summary>
                          <div className="mt-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded p-2">
                            <table className="w-full text-left">
                              <tbody>
                                {Object.entries(columnMapping).map(([k, v]) => (
                                  <tr key={k} className="border-b border-[#2A2A2A] last:border-0">
                                    <td className="py-1 text-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</td>
                                    <td className="py-1 text-gray-300">» {String(v)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </details>
                      )}
                    </div>
                  )}

                  {validProducts.length > 0 && validationErrors.length === 0 && (
                    <div className="bg-[#00C9A7]/10 border border-[#00C9A7]/20 rounded-lg p-4">
                      <p className="text-[#00C9A7] font-bold text-sm flex items-center gap-2">
                        <Check size={16} /> ✅ {validProducts.length} products ready to upload
                      </p>
                      <p className="text-xs text-[#00C9A7]/70 mt-1">Format: {detectedFormat}</p>
                    </div>
                  )}

                  {validProducts.length > 0 && validationErrors.length > 0 && (
                    <div className="border border-[#2A2A2A] rounded-lg overflow-hidden">
                      <div className="bg-[#00C9A7]/10 p-4 border-b border-[#2A2A2A]">
                        <p className="text-[#00C9A7] font-bold text-sm flex items-center gap-2">
                          <Check size={16} /> ✅ {validProducts.length} products ready to upload
                        </p>
                      </div>
                      <div className="bg-[#E8B84B]/10 p-4">
                        <p className="text-[#E8B84B] font-bold text-sm flex items-center gap-2 mb-2">
                          <AlertTriangle size={16} /> ⚠️ {validationErrors.length} rows have errors
                        </p>
                        <ul className="space-y-1 max-h-[100px] overflow-y-auto">
                          {validationErrors.map((err, i) => (
                            <li key={i} className="text-[#E8B84B]/80 text-[13px]">
                              <span className="font-bold">Row {err.row}:</span> {err.errors.join(', ')}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {validProducts.length === 0 && validationErrors.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <p className="text-red-500 font-bold text-sm flex items-center gap-2 mb-2">
                        ❌ No valid products found
                      </p>
                      <p className="text-red-400 text-xs mb-3">
                        This file may be empty or in an unsupported format. Try downloading and using the WorkPlex template.
                      </p>
                    </div>
                  )}

                  {skippedRows.length > 0 && (
                    <p className="text-[11px] text-gray-500 mt-2">
                      {skippedRows.length} empty rows ignored automatically
                    </p>
                  )}

                  {uploading && (
                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between text-xs text-gray-400 font-bold">
                        <span>Uploading {Math.ceil((uploadProgress / 100) * validProducts.length)} of {validProducts.length} products...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-[#1A1A1A] rounded-full h-2 overflow-hidden border border-[#2A2A2A]">
                        <div className="bg-[#E8B84B] h-full transition-all duration-300" style={{width: `${uploadProgress}%`}}></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 flex gap-3">
                <button onClick={() => {setShowBulkUpload(false); resetModal();}} className="flex-1 py-3 text-gray-400 font-medium text-sm hover:text-white transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={uploadProducts}
                  disabled={uploading || !selectedFile || validProducts.length === 0}
                  className={`flex-[2] py-3 rounded-lg text-sm font-bold transition-all ${
                    !selectedFile || validProducts.length === 0 || uploading
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-[#E8B84B] text-black hover:bg-[#F5CA66]'
                  }`}
                >
                  {uploading ? 'Uploading...' : validationErrors.length > 0 && validProducts.length > 0 ? 'Upload Valid Rows Only' : 'Continue'}
                </button>
              </div>
            </div>
          ) : showSingleAdd ? (
            <div className="w-full max-w-[600px] bg-[#1A1A1A] border border-[#2A2A2A] rounded-[12px] p-8 shadow-[0_12px_40px_rgba(0,0,0,0.6)] relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowSingleAdd(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
              
              <h2 className="text-[20px] font-bold text-white mb-6">{productForm.id ? 'Edit Product' : 'Add Single Product'}</h2>
              
              <form onSubmit={handleSingleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Product Name</label>
                    <input required value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} type="text" className="w-full bg-[#111111] border border-[#2A2A2A] text-white px-4 py-2.5 rounded-lg text-sm outline-none focus:border-[#E8B84B]" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">SKU</label>
                    <input required value={productForm.sku} onChange={e => setProductForm({...productForm, sku: e.target.value})} type="text" className="w-full bg-[#111111] border border-[#2A2A2A] text-white px-4 py-2.5 rounded-lg text-sm outline-none focus:border-[#E8B84B]" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Category</label>
                  <select required value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} className="w-full bg-[#111111] border border-[#2A2A2A] text-white px-4 py-2.5 rounded-lg text-sm outline-none focus:border-[#E8B84B]">
                    <option value="">Select Category</option>
                    {activeCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Base Price (Rs.)</label>
                    <input required value={productForm.hvrsBasePrice} onChange={e => setProductForm({...productForm, hvrsBasePrice: e.target.value})} type="number" step="0.01" className="w-full bg-[#111111] border border-[#2A2A2A] text-white px-4 py-2.5 rounded-lg text-sm outline-none focus:border-[#E8B84B]" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Suggested Price (Rs.)</label>
                    <input required value={productForm.suggestedRetailPrice} onChange={e => setProductForm({...productForm, suggestedRetailPrice: e.target.value})} type="number" step="0.01" className="w-full bg-[#111111] border border-[#2A2A2A] text-white px-4 py-2.5 rounded-lg text-sm outline-none focus:border-[#E8B84B]" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Description</label>
                  <textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} rows={3} className="w-full bg-[#111111] border border-[#2A2A2A] text-white px-4 py-2.5 rounded-lg text-sm outline-none focus:border-[#E8B84B] resize-none" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Image URL 1</label>
                    <input value={productForm.image1} onChange={e => setProductForm({...productForm, image1: e.target.value})} type="url" className="w-full bg-[#111111] border border-[#2A2A2A] text-white px-4 py-2.5 rounded-lg text-sm outline-none focus:border-[#E8B84B]" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Image URL 2</label>
                    <input value={productForm.image2} onChange={e => setProductForm({...productForm, image2: e.target.value})} type="url" className="w-full bg-[#111111] border border-[#2A2A2A] text-white px-4 py-2.5 rounded-lg text-sm outline-none focus:border-[#E8B84B]" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Image URL 3</label>
                    <input value={productForm.image3} onChange={e => setProductForm({...productForm, image3: e.target.value})} type="url" className="w-full bg-[#111111] border border-[#2A2A2A] text-white px-4 py-2.5 rounded-lg text-sm outline-none focus:border-[#E8B84B]" />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Tags (comma separated)</label>
                  <input value={productForm.tags} onChange={e => setProductForm({...productForm, tags: e.target.value})} type="text" className="w-full bg-[#111111] border border-[#2A2A2A] text-white px-4 py-2.5 rounded-lg text-sm outline-none focus:border-[#E8B84B]" />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <span className="text-sm text-gray-400 font-bold">Status:</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={productForm.isActive} onChange={e => setProductForm({...productForm, isActive: e.target.checked})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00C9A7]"></div>
                    <span className="ml-3 text-sm font-black text-white">{productForm.isActive ? 'Active' : 'Inactive'}</span>
                  </label>
                </div>
                
                <div className="mt-8 flex gap-3 pt-4 border-t border-[#2A2A2A]">
                  <button type="button" onClick={() => setShowSingleAdd(false)} className="flex-1 py-3 text-gray-400 font-medium text-sm hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={uploading} className="flex-[2] py-3 rounded-lg text-sm font-bold bg-[#E8B84B] text-black hover:bg-[#F5CA66] disabled:opacity-50">
                    {uploading ? 'Saving...' : productForm.id ? 'Save Changes' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
