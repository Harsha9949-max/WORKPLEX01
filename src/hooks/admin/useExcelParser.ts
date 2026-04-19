import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';

export interface CatalogRow {
  SKU: string;
  Name: string;
  Category: string;
  Description: string;
  Base_Price: number;
  Suggested_Price: number;
  Image_URL_1: string;
  Image_URL_2?: string;
  Image_URL_3?: string;
  Tags?: string;
  Is_Active?: string | boolean;
}

export interface ValidationResult {
  row: CatalogRow;
  rowIndex: number;
  isValid: boolean;
  errors: string[];
}

const CATEGORIES = ['Fashion', 'Electronics', 'Beauty', 'Home', 'Sports', 'Food'];
const IMAGE_URL_REGEX = /^https:\/\/.+\.(jpg|jpeg|png|webp|gif).*$/i;

export function useExcelParser() {
  const [parsedRows, setParsedRows] = useState<ValidationResult[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  const parseAndValidate = useCallback((file: File) => {
    setIsParsing(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { 
          defval: '', 
          raw: false, 
          blankrows: false 
        }) as Record<string, any>[];

        const results: ValidationResult[] = rawRows.map((row, index) => {
          const errors: string[] = [];
          
          const sku = String(row['SKU'] || '').trim();
          if (!sku) errors.push('SKU is required');
          else if (!/^[a-zA-Z0-9_\-]+$/.test(sku)) errors.push('SKU must be alphanumeric');
          
          const name = String(row['Name'] || '').trim();
          if (!name || name.length < 3 || name.length > 100) errors.push('Name must be 3-100 characters');

          const category = String(row['Category'] || '').trim();
          if (!CATEGORIES.includes(category)) errors.push(`Category must be one of: ${CATEGORIES.join(', ')}`);

          const description = String(row['Description'] || '').trim();
          if (!description || description.length < 20 || description.length > 500) errors.push('Description must be 20-500 characters');

          const basePrice = Number(row['Base_Price']);
          if (isNaN(basePrice) || basePrice < 1 || basePrice > 100000) errors.push('Base_Price must be a number between 1 and 100,000');

          const suggestedPrice = Number(row['Suggested_Price']);
          if (isNaN(suggestedPrice) || suggestedPrice <= basePrice) errors.push('Suggested_Price must be greater than Base_Price');

          const img1 = String(row['Image_URL_1'] || '').trim();
          if (!img1 || !img1.startsWith('https://')) errors.push('Image_URL_1 is required and must start with https://');
          if (img1 && !IMAGE_URL_REGEX.test(img1)) errors.push('Image_URL_1 must be a valid image URL');

          const img2 = String(row['Image_URL_2'] || '').trim();
          if (img2 && (!img2.startsWith('https://') || !IMAGE_URL_REGEX.test(img2))) errors.push('Image_URL_2 must be a valid image URL');

          const img3 = String(row['Image_URL_3'] || '').trim();
          if (img3 && (!img3.startsWith('https://') || !IMAGE_URL_REGEX.test(img3))) errors.push('Image_URL_3 must be a valid image URL');

          // Check SKU uniqueness in file
          const duplicates = rawRows.filter(r => String(r.SKU || '').trim() === sku);
          if (duplicates.length > 1) errors.push('Duplicate SKU in file');

          return {
            row: row as CatalogRow,
            rowIndex: index + 2, // +2 because 0-indexed and header row
            isValid: errors.length === 0,
            errors
          };
        });

        setParsedRows(results);
      } catch (err: any) {
        console.error(err);
      } finally {
        setIsParsing(false);
      }
    };

    if (file) {
       reader.readAsBinaryString(file);
    } else {
       setIsParsing(false);
    }
  }, []);

  const clearParsedRows = useCallback(() => {
    setParsedRows([]);
  }, []);

  return { parsedRows, isParsing, parseAndValidate, clearParsedRows };
}
