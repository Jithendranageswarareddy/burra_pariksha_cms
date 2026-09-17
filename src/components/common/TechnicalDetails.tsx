import React, { useState } from 'react';
import { ChevronDown, Code } from 'lucide-react';

export interface TechnicalDetailsProps {
  id?: string;
  technicalId?: string;
  contentMasterId?: string;
  status?: string;
  rawObject?: Record<string, any>;
  title?: string;
  className?: string;
  defaultOpen?: boolean;
}

export const TechnicalDetails: React.FC<TechnicalDetailsProps> = ({
  id,
  technicalId,
  contentMasterId,
  status,
  rawObject,
  title = 'Details',
  className = '',
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border border-slate-200 rounded-lg bg-slate-50/60 overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100/80 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <Code className="w-3.5 h-3.5 text-slate-500" />
          <span>{title}</span>
          <span className="text-[10px] font-normal text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">
            Technical Information
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="p-3.5 border-t border-slate-200 bg-white text-xs space-y-2 font-mono">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            {id && (
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200">
                <span className="text-slate-500 font-sans">Database Entity ID:</span>
                <span className="font-bold text-slate-800">{id}</span>
              </div>
            )}
            {technicalId && (
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200">
                <span className="text-slate-500 font-sans">Technical Identifier:</span>
                <span className="font-bold text-indigo-700">{technicalId}</span>
              </div>
            )}
            {contentMasterId && (
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200">
                <span className="text-slate-500 font-sans">Content Entity Ref:</span>
                <span className="font-bold text-purple-700">{contentMasterId}</span>
              </div>
            )}
            {status && (
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200">
                <span className="text-slate-500 font-sans">Backend Status Code:</span>
                <span className="font-bold text-amber-700">{status}</span>
              </div>
            )}
          </div>

          {rawObject && (
            <div className="pt-2">
              <span className="text-[10px] font-sans font-semibold text-slate-500 block mb-1">
                Raw Metadata Payload:
              </span>
              <pre className="bg-slate-900 text-slate-200 p-2.5 rounded text-[10px] overflow-x-auto max-h-40">
                {JSON.stringify(rawObject, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
