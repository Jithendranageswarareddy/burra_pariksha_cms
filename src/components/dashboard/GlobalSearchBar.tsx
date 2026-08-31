import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, FileQuestion, Video, ArrowRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/api-client';
import { GlobalSearchResult } from '../../types';

export const GlobalSearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.globalSearch(query);
        setResults(res);
        setIsOpen(true);
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Global search across Question ID, Video ID, Telugu text, topics..."
          className="w-full pl-9 pr-9 py-2 bg-white text-xs text-slate-900 placeholder:text-slate-400 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
        />
        {isLoading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-600 animate-spin" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.trim() && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-slate-200 shadow-lg z-50 max-h-80 overflow-y-auto p-2 space-y-1">
          {results.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-xs">
              No matching questions or videos found for "{query}".
            </div>
          ) : (
            results.map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                to={item.url}
                onClick={() => setIsOpen(false)}
                className="p-2.5 rounded-lg hover:bg-indigo-50/60 transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="p-1.5 bg-slate-100 group-hover:bg-indigo-100 text-slate-600 group-hover:text-indigo-600 rounded-md shrink-0">
                    {item.type === 'VIDEO' ? (
                      <Video className="w-3.5 h-3.5" />
                    ) : (
                      <FileQuestion className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-900">
                        {item.id}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {item.category} • {item.topic}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800 truncate group-hover:text-indigo-700">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-slate-400">{item.subtitle}</div>
                  </div>
                </div>

                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
};
