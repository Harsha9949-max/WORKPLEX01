import React, { useRef } from 'react';
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

  const { uploads, isUploading: isImageUploading, startUpload } = useImageUpload();
  const { parsedRows, isParsing, parseAndValidate, clearParsedRows } = useExcelParser();
  const { products, loading: productsLoading, batchUpload, toggleActive, deleteProduct } = useCatalogProducts(currentUser?.uid || 'admin');

  const handleExcelSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      parseAndValidate(e.target.files[0]);
    }
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: Image Upload */}
        <ImageUploadZone 
          startUpload={startUpload} 
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
              accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
              className="hidden" 
              ref={excelInputRef}
              onChange={handleExcelSelect}
            />
            
            {!parsedRows.length ? (
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    const file = e.dataTransfer.files[0];
                    if (
                      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                      file.name.endsWith('.xlsx')
                    ) {
                      parseAndValidate(file);
                    } else {
                      toast.error('Please upload a valid .xlsx file');
                    }
                  }
                }}
                onClick={() => !isParsing && excelInputRef.current?.click()}
                className={`w-full bg-[#00C9A7]/10 hover:bg-[#00C9A7]/20 text-[#00C9A7] border border-[#00C9A7]/30 py-6 pr-4 pl-4 text-center rounded-xl font-black uppercase tracking-widest transition-colors flex flex-col items-center gap-2 cursor-pointer ${isParsing ? 'opacity-50 pointer-events-none' : ''}`}
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
