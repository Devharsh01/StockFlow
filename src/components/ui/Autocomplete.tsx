'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Plus, Sparkles } from 'lucide-react';
import { Input } from './Input';
import { cn } from '@/lib/utils';

export type Option = {
  id: string; // The underlying value
  label: string; // The primary display text
  subLabel?: string; // E.g., SKU
  [key: string]: any; // Allow arbitrary extra properties
};

interface AutocompleteProps {
  id?: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
  value?: string; // External/controlled display value

  // Async fetch function
  fetchOptions: (query: string) => Promise<Option[]>;

  // What happens when selected (or typed if custom allowed)
  onChange?: (value: string, option: Option | null) => void;

  // If true, the user can just type whatever they want and we pass that raw string.
  // If false, they MUST select an option from the list.
  allowCustomValue?: boolean;

  debounceMs?: number;

  // Optional Create New action trigger
  onCreateNew?: (currentQuery: string) => void;
  createNewText?: string | ((currentQuery: string) => string);

  // Whether to show price badge in dropdown
  showPrice?: boolean;
}

export function Autocomplete({
  id,
  name,
  placeholder,
  required,
  value,
  fetchOptions,
  onChange,
  allowCustomValue = false,
  debounceMs = 300,
  onCreateNew,
  createNewText,
  showPrice = false,
}: AutocompleteProps) {
  const [query, setQuery] = useState(value || '');
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Selected state: if null, we just use the raw query text
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Sync external value when changed
  useEffect(() => {
    if (value !== undefined && value !== query) {
      setQuery(value);
    }
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const executeSearch = useCallback(
    async (searchQuery: string) => {
      setLoading(true);
      try {
        const results = await fetchOptions(searchQuery);
        setOptions(results || []);
        setIsOpen(true);
      } catch (err) {
        console.error('Autocomplete fetch error:', err);
      } finally {
        setLoading(false);
      }
    },
    [fetchOptions]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedOption(null); // Clear strict selection on type

    // Fire onChange with raw text if custom allowed
    if (onChange) onChange(allowCustomValue ? val : '', null);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      executeSearch(val);
    }, debounceMs);
  };

  const handleSelect = (option: Option) => {
    setQuery(option.label);
    setSelectedOption(option);
    setIsOpen(false);
    if (onChange) onChange(option.id, option);
  };

  const handleTriggerCreate = () => {
    setIsOpen(false);
    if (onCreateNew) {
      onCreateNew(query.trim());
    }
  };

  const resolvedCreateText =
    typeof createNewText === 'function'
      ? createNewText(query.trim())
      : createNewText || (query.trim() ? `Create "${query.trim()}" as new product` : '+ Create new product');

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Input
          type="text"
          id={id}
          placeholder={placeholder}
          required={required && !selectedOption && !allowCustomValue}
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            executeSearch(query);
          }}
          className="pr-10"
        />
        {/* Hidden input to hold the actual selected ID for form submissions */}
        <input
          type="hidden"
          name={name}
          value={selectedOption ? selectedOption.id : allowCustomValue ? query : ''}
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[var(--color-app-muted)]">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[var(--color-brand-600)]" />
          ) : (
            <Search className="w-4 h-4 opacity-50" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (options.length > 0 || (query.trim().length > 0 && !loading && onCreateNew)) && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1.5 bg-white rounded-xl shadow-lg border border-[var(--color-app-border)] overflow-hidden max-h-64 overflow-y-auto"
          >
            {options.length > 0 ? (
              <div>
                <ul className="py-1 divide-y divide-gray-100">
                  {options.map((option, idx) => (
                    <li
                      key={option.id || `opt-${idx}-${option.label}`}
                      className="px-3.5 py-2 hover:bg-[var(--color-brand-50)] cursor-pointer flex flex-col transition-colors"
                      onClick={() => handleSelect(option)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-[var(--color-app-text)]">{option.label}</span>
                        {showPrice && option.sellingPrice !== undefined && (
                          <span className="font-mono text-xs font-bold text-gray-700">
                            ₹{Number(option.sellingPrice).toFixed(2)}
                          </span>
                        )}
                      </div>
                      {option.subLabel && (
                        <span className="text-[11px] text-[var(--color-app-muted)]">{option.subLabel}</span>
                      )}
                    </li>
                  ))}
                </ul>

                {onCreateNew && (
                  <div className="p-2 border-t border-gray-100 bg-gray-50/70">
                    <button
                      type="button"
                      onClick={handleTriggerCreate}
                      className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-[var(--color-brand-600)] hover:bg-[var(--color-brand-50)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {resolvedCreateText}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 text-center">
                <p className="text-xs text-gray-500 mb-2">
                  No product found matching <span className="font-semibold text-gray-800">&ldquo;{query.trim()}&rdquo;</span>
                </p>
                {onCreateNew && (
                  <button
                    type="button"
                    onClick={handleTriggerCreate}
                    className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-emerald-600" />
                    {resolvedCreateText}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

