import React, { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useImageUpload } from '../../hooks/admin/useImageUpload';
import { useExcelParser } from '../../hooks/admin/useExcelParser';
import { useCatalogProducts } from '../../hooks/admin/useCatalogProducts';
import { generateCatalogTemplate } from '../../utils/admin/generateTemplate';
import ImageUploadZone from '../../components/admin/catalog/ImageUploadZone';
import ValidationReport from '../../components/admin/catalog/ValidationReport';
import CatalogTable from '../../components/admin/catalog/CatalogTable';
import { DownloadCloud, FileSpreadsheet, Upload, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCatalogManager() {
  const { currentUser } = useAuth();
  const excelInputRef = useRef<HTMLInputElement>(null);
  
  const [activeCatalog, setActiveCatalog] = useState<'BuyRix' | 'Vyuma'>('BuyRix');
  const [isDragging, setIsDragging] = useState(false);

  const { uploads, isUploading: isImageUploading, startUpload } = useImageUpload();
  const { parsedRows, isParsing, parseAndValidate, clearParsedRows } = useExcelParser();
  const { products, loading: productsLoading, batchUpload, toggleActive, deleteProduct } = useCatalogProducts(currentUser?.uid || 'admin', activeCatalog);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream'
    ];
    
    const isValidExtension = 
      file.name.endsWith('.xlsx') || 
      file.name.endsWith('.xls');
      
    const isValidType = 
      validTypes.includes(file.type) || 
      isValidExtension;
    
    if (!isValidType) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }
    
    parseAndValidate(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const isValidExtension = 
      file.name.endsWith('.xlsx') || 
      file.name.endsWith('.xls');
      
    if (!isValidExtension) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      e.target.value = '';
      return;
    }
    
    parseAndValidate(file);
  };

  const handleTemplateDownload = () => {
    try {
      generateCatalogTemplate();
      toast.success('Template downloaded successfully!');
    } catch (e) {
      toast.error('Failed to generate template');
    }
  };

  const handleUploadData = async () => {
    const validRows = parsedRows.filter(r => r.isValid).map(r => r.row);
    if (!validRows.length) {
      toast.error('No valid rows found to upload');
      return;
    }

    try {
      await batchUpload(validRows);
      clearParsedRows();
      if (excelInputRef.current) excelInputRef.current.value = '';
    } catch (e: any) {
      // Error handled in hook
    }
  };

  const hasErrors = parsedRows.some(r => !r.isValid);
  const totalValid = parsedRows.filter(r => r.isValid).length;

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Catalog Manager</h1>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Dual-Step Product Upload Pipeline</p>
      </div>

      <div className="flex bg-[#111111] border border-[#2A2A2A] rounded-2xl p-1.5 self-start w-fit">
        <button 
          onClick={() => setActiveCatalog('BuyRix')}
          className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeCatalog === 'BuyRix' ? 'bg-[#E8B84B] text-black shadow-lg shadow-[#E8B84B]/20' : 'text-gray-500 hover:text-white'
          }`}
        >
          BuyRix Catalog
        </button>
        <button 
          onClick={() => setActiveCatalog('Vyuma')}
          className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeCatalog === 'Vyuma' ? 'bg-[#E8B84B] text-black shadow-lg shadow-[#E8B84B]/20' : 'text-gray-500 hover:text-white'
          }`}
        >
          Vyuma Catalog
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: Image Upload */}
        <ImageUploadZone 
          startUpload={(files) => startUpload(files, activeCatalog)} 
          uploads={uploads} 
          isUploading={isImageUploading} 
        />

        {/* Step 2 & 3: Template & Excel Upload */}
        <div className="bg-[#111111] p-6 rounded-2xl border border-[#2A2A2A] flex flex-col gap-6">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="bg-[#E8B84B] text-black w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
              Step 2: Download & Fill Template
            </h3>
            <button 
              onClick={handleTemplateDownload}
              className="w-full bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#E8B84B] border border-white/5 py-4 rounded-xl flex items-center justify-center gap-2 font-bold uppercase tracking-widest transition-colors"
            >
              <DownloadCloud size={18} />
              Download Excel Template
            </button>
          </div>

          <div className="border-t border-[#2A2A2A] pt-6">
            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="bg-[#E8B84B] text-black w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
              Step 3: Upload Filled Excel
            </h3>
            
            <input 
              type="file" 
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" 
              className="hidden" 
              ref={excelInputRef}
              onChange={handleFileChange}
            />
            
            {!parsedRows.length ? (
              <div 
                onDragEnter={handleDragOver}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isParsing && excelInputRef.current?.click()}
                className={`w-full bg-[#00C9A7]/10 hover:bg-[#00C9A7]/20 text-[#00C9A7] border ${isDragging ? 'border-2 border-dashed border-[#00C9A7]' : 'border border-[#00C9A7]/30'} py-6 pr-4 pl-4 text-center rounded-xl font-black uppercase tracking-widest transition-colors flex flex-col items-center gap-2 cursor-pointer ${isParsing ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <FileSpreadsheet size={24} />
                {isParsing ? 'Parsing Excel File...' : 'Select or Drag Filled Excel File'}
              </div>
            ) : (
              <div className="space-y-4">
                <ValidationReport parsedRows={parsedRows} />
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      clearParsedRows();
                      if (excelInputRef.current) excelInputRef.current.value = '';
                    }}
                    className="flex-1 bg-transparent border border-gray-600 text-gray-400 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUploadData}
                    disabled={totalValid === 0}
                    className={`flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-transform ${
                      hasErrors 
                        ? 'bg-[#E8B84B]/20 text-[#E8B84B] hover:scale-105' 
                        : 'bg-[#E8B84B] text-black hover:scale-105'
                    } disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed`}
                  >
                    {hasErrors ? <AlertTriangle size={16} /> : <Upload size={16} />}
                    {hasErrors ? `Upload Valid Only (${totalValid})` : `Upload Catalog (${totalValid})`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step 4: Full Inventory Table */}
      <CatalogTable 
        products={products} 
        loading={productsLoading} 
        toggleActive={toggleActive}
        deleteProduct={deleteProduct}
      />
    </div>
  );
}
