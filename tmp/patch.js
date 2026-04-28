const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/AdminCatalogManager.tsx', 'utf8');

const helpers = `
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
    const normalizedHeader = header.toString().toLowerCase().trim().replace(/\\s+/g, ' ');
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
    const num = parseFloat(val.replace(/[₹,\\s]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const images = [getValue('image1'), getValue('image2'), getValue('image3'), getValue('image4'), getValue('image5')]
    .filter(url => url && url.startsWith('http') && url.length > 10);

  const name = getValue('name');
  const sku = getValue('sku') || \`AUTO-\${Date.now()}-\${Math.random().toString(36).substr(2, 5).toUpperCase()}\`;
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
// ----------------------------
`;

content = content.replace("export default function AdminCatalogManager() {", helpers + "\nexport default function AdminCatalogManager() {");

content = content.replace("const [validProducts, setValidProducts] = useState([]);\n  const [validationErrors, setValidationErrors] = useState([]);", 
"const [validProducts, setValidProducts] = useState([]);\n  const [validationErrors, setValidationErrors] = useState([]);\n  const [skippedRows, setSkippedRows] = useState([]);\n  const [columnMapping, setColumnMapping] = useState({});\n  const [detectedFormat, setDetectedFormat] = useState('');\n  const [parsingStatus, setParsingStatus] = useState('idle');");

const processFileMethod = `const processFile = (file) => {
    setSelectedFile(file);
    setParsingStatus('parsing');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const targetSheet = findDataSheet(workbook);
        const sheet = workbook.Sheets[targetSheet];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false, blankrows: false });

        if (rawRows.length === 0) {
          toast.error('No data found in file. Please check your Excel file.');
          setParsingStatus('error');
          return;
        }

        const headers = Object.keys(rawRows[0]);
        const columnMapping = {};
        for (const [field, variants] of Object.entries(COLUMN_MAP)) {
          const found = findColumn(headers, variants);
          if (found) { columnMapping[field] = found; }
        }

        const detectedFormat = detectFormat(headers);
        setDetectedFormat(detectedFormat);

        const valid = [];
        const errors = [];
        const skipped = [];

        rawRows.forEach((row, index) => {
          const rowNum = index + 2;
          const parsed = parseRowWithMapping(row, columnMapping);

          if (!parsed.name && !parsed.sku) {
            skipped.push(rowNum);
            return;
          }

          const rowErrors = [];
          if (!parsed.name) {
            const possibleName = row['Product Name'] || row['Title'] || row['Item'] || Object.values(row).find(v => v && String(v).length > 3 && String(v).length < 200);
            if (possibleName) {
              parsed.name = String(possibleName).trim();
            } else {
              rowErrors.push('Product name not found');
            }
          }

          if (parsed.basePrice > 0 && parsed.suggestedPrice === 0) parsed.suggestedPrice = parsed.basePrice;
          if (parsed.basePrice === 0 && parsed.suggestedPrice > 0) parsed.basePrice = Math.round(parsed.suggestedPrice * 0.8);
          
          if (parsed.basePrice === 0 && parsed.suggestedPrice === 0) {
            const anyPrice = Object.values(row).find(v => { const n = parseFloat(String(v)); return !isNaN(n) && n > 0 && n < 1000000; });
            if (anyPrice) {
              parsed.basePrice = parseFloat(String(anyPrice));
              parsed.suggestedPrice = parsed.basePrice;
            }
          }

          if (rowErrors.length > 0) {
            errors.push({ row: rowNum, errors: rowErrors, data: parsed });
          } else {
            valid.push({ ...parsed, venture: activeTab });
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
    reader.onerror = () => { toast.error('File read failed.'); setParsingStatus('error'); };
    reader.readAsArrayBuffer(file);
  };`;

const oldProcessFileRegex = /const processFile = \(file\) => \{[\s\S]*?validateAndSetProducts\(rows\);\s*\} catch \(err\) \{\s*toast\.error[^}]*\}\s*};\s*reader\.readAsArrayBuffer\(file\);\s*};\s*const validateAndSetProducts = \(rows\) => \{[\s\S]*?setValidationErrors\(errors\);\s*};/;

content = content.replace(oldProcessFileRegex, processFileMethod);

const resetModalMethod = `const resetModal = () => {
    setSelectedFile(null);
    setValidProducts([]);
    setValidationErrors([]);
    setSkippedRows([]);
    setColumnMapping({});
    setDetectedFormat('');
    setParsingStatus('idle');
    setUploading(false);
    setUploadProgress(0);
  };`;

content = content.replace(/const resetModal = \(\) => \{[\s\S]*?setUploadProgress\(0\);\s*};/, resetModalMethod);

const uploadProductsMethod = `const uploadProducts = async () => {
    setUploading(true);
    setUploadProgress(0);
    try {
      // Check for existing SKUs
      const existingSkus = new Set();
      const existingQuery = await getDocs(query(collection(db, 'catalogProducts'), where('venture', '==', activeTab)));
      existingQuery.forEach(doc => { existingSkus.add(doc.data().sku); });
      
      const newProducts = validProducts.filter(p => !existingSkus.has(p.sku));
      const duplicates = validProducts.filter(p => existingSkus.has(p.sku));
      
      if (newProducts.length === 0) {
        toast.error('All products already exist in catalog. No duplicates added.');
        setUploading(false);
        return;
      }
      
      if (duplicates.length > 0) {
        toast('⚠️ ' + duplicates.length + ' duplicate products skipped. Uploading ' + newProducts.length + ' new.', { icon: '⚠️' });
      }

      const chunks = [];
      for (let i = 0; i < newProducts.length; i += 20) { chunks.push(newProducts.slice(i, i+20)); }
      
      let uploaded = 0;
      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(product => {
          const ref = doc(collection(db, 'catalogProducts'));
          batch.set(ref, {
            sku: product.sku,
            name: product.name,
            category: product.category,
            description: product.description || '',
            hvrsBasePrice: product.basePrice,
            suggestedRetailPrice: product.suggestedPrice || product.basePrice,
            images: product.images || [],
            tags: product.tags || [],
            isActive: true,
            venture: activeTab,
            importedFrom: detectedFormat,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            uploadedBy: auth?.currentUser?.uid || 'admin'
          });
        });
        await batch.commit();
        uploaded += chunk.length;
        setUploadProgress(Math.round(uploaded / newProducts.length * 100));
      }
      
      toast.success('✅ ' + uploaded + ' products added to ' + activeTab + ' catalog!');
      setShowBulkUpload(false);
      resetModal();
      fetchProducts();
    } catch (err) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };`;

content = content.replace(/const uploadProducts = async \(\) => \{[\s\S]*?finally \{\s*setUploading\(false\);\s*\}\s*};/, uploadProductsMethod);


// Add getDocs import
content = content.replace(/import \{ collection, doc, query, where, writeBatch, serverTimestamp, deleteDoc, updateDoc, onSnapshot \} from 'firebase\/firestore';/, "import { collection, doc, query, where, writeBatch, serverTimestamp, deleteDoc, updateDoc, onSnapshot, getDocs } from 'firebase/firestore';");

// Update UI: "products ready to upload" and errors block
const oldValidationUI = `{validationErrors.length > 0 && \\(
\\s*<div className="bg-red-500\/10 border border-red-500\/20 rounded-lg p-4 max-h-\\[160px\\] overflow-y-auto">
\\s*<p className="text-red-500 font-bold text-sm mb-2">\\{validationErrors\\.length\\} rows have errors:</p>
\\s*<ul className="space-y-1">
\\s*\\{validationErrors\\.map\\(\\(err, i\\) => \\(
\\s*<li key=\\{i\\} className="text-red-400\/80 text-\\[13px\\]">
\\s*<span className="font-bold text-red-400">Row \\{err\\.row\\}:<\\/span> \\{err\\.errors\\.join\\(', '\\)\\}
\\s*<\\/li>
\\s*\\)\\)\\}
\\s*<\\/ul>
\\s*<\\/div>
\\s*\\)}

\\s*\\{validProducts\\.length > 0 && \\(
\\s*<div className="bg-\\[#00C9A7\\]\/10 border border-\\[#00C9A7\\]\/20 rounded-lg p-4">
\\s*<p className="text-\\[#00C9A7\\] font-bold text-sm flex items-center gap-2">
\\s*<Check size=\\{16\\} \/> \\{validProducts\\.length\\} products ready to upload
\\s*<\\/p>
\\s*<\\/div>
\\s*\\)}`;


const newValidationUI = `
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
`;
const regexValid = /\{validationErrors\.length > 0 && \([\s\S]*?\{validProducts\.length > 0 && \([\s\S]*?<\/div>[\s\S]*?\)\}/;
content = content.replace(regexValid, newValidationUI);


// Replace `img` tag logic with `ProductImage` in table
const imgRegex = /\{prod\.images\?\.\[0\] \? \([\s\S]*?<img src=\{prod\.images\[0\]\} alt=\{prod\.name\} className="w-full h-full object-cover" \/>[\s\S]*?\) : \([\s\S]*?<ImageIcon className="w-full h-full p-2 text-gray-600" \/>[\s\S]*?\)\}/;
content = content.replace(imgRegex, "<ProductImage images={prod.images} name={prod.name} />");

// Replace {uploading && -> uploading logic width / 100 
const progressRegex = /Uploading \{Math\.ceil\(\(uploadProgress \/ 100\) \* validProducts\.length\)\} of \{validProducts\.length\} products.../;
content = content.replace(progressRegex, "Uploading {Math.ceil((uploadProgress / 100) * validProducts.length)} of {validProducts.length} products...");

fs.writeFileSync('src/pages/admin/AdminCatalogManager.tsx', content);
`;
