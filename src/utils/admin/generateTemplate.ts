import * as XLSX from 'xlsx';

export function generateCatalogTemplate() {
  const headers = [
    'SKU', 'Name', 'Category', 'Description', 'Base_Price', 'Suggested_Price', 
    'Image_URL_1', 'Image_URL_2', 'Image_URL_3', 'Tags', 'Is_Active'
  ];
  
  const sampleRow = [
    'FASH-001', 
    'Sample Graphic T-Shirt', 
    'Fashion', 
    'A high-quality cotton graphic t-shirt perfect for casual wear. Comfortable and stylish. This is a great product for the summer.', 
    '450', 
    '799', 
    'https://firebasestorage.googleapis.com/v0/b/example/o/placeholder1.jpg?alt=media',
    'https://firebasestorage.googleapis.com/v0/b/example/o/placeholder2.jpg?alt=media',
    '',
    'tshirt, fashion, casual',
    'true'
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
  
  const wscols = headers.map(() => ({ wch: 20 }));
  ws['!cols'] = wscols;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "WorkPlex Catalog");
  
  XLSX.writeFile(wb, "WorkPlex_Catalog_Template.xlsx");
}
