import React from 'react';
import { ValidationResult } from '../../../hooks/admin/useExcelParser';
import { CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  parsedRows: ValidationResult[];
}

export default function ValidationReport({ parsedRows }: Props) {
  if (!parsedRows.length) return null;

  const validCount = parsedRows.filter(r => r.isValid).length;
  const errorCount = parsedRows.filter(r => !r.isValid).length;

  return (
    <div className="mt-6 border border-[#2A2A2A] rounded-xl overflow-hidden bg-black/50">
      <div className="p-4 bg-[#1A1A1A] border-b border-[#2A2A2A] flex justify-between items-center">
        <h4 className="text-sm font-black text-white uppercase tracking-widest">Validation Report</h4>
        <div className="flex gap-4 text-xs font-bold">
          <span className="text-[#00C9A7] flex items-center gap-1"><CheckCircle2 size={12} /> {validCount} Valid</span>
          <span className="text-red-500 flex items-center gap-1"><XCircle size={12} /> {errorCount} Errors</span>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#111111] sticky top-0 border-b border-[#2A2A2A]">
            <tr>
              <th className="p-3 text-[10px] font-black uppercase text-gray-500">Row</th>
              <th className="p-3 text-[10px] font-black uppercase text-gray-500">SKU</th>
              <th className="p-3 text-[10px] font-black uppercase text-gray-500">Analysis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2A2A]">
            {parsedRows.map((result, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors">
                <td className="p-3 text-gray-400 font-mono text-xs">{result.rowIndex}</td>
                <td className="p-3 text-white font-bold">{result.row.SKU || '<Missing>'}</td>
                <td className="p-3">
                  {result.isValid ? (
                    <span className="text-[#00C9A7] text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 size={14} /> Ready to import
                    </span>
                  ) : (
                    <ul className="list-disc pl-4 text-red-400 text-xs space-y-1">
                      {result.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
