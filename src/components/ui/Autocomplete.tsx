'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';
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
  
  // Async fetch function
  fetchOptions: (query: string) => Promise<Option[]>;
  
  // What happens when selected (or typed if custom allowed)
  onChange?: (value: string, option: Option | null) => void;
  
  // If true, the user can just type whatever they want and we pass that raw string.
  // If false, they MUST select an option from the list.
  allowCustomValue?: boolean;
  
  debounceMs?: number;
}

export function Autocomplete({
  id,
  name,
  placeholder,
  required,
  fetchOptions,
  onChange,
  allowCustomValue = false,
  debounceMs = 300,
}: AutocompleteProps) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // Selected state: if null, we just use the raw query text
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

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

  const executeSearch = useCallback(async (searchQuery: string) => {
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
  }, [fetchOptions]);

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
          value={selectedOption ? selectedOption.id : (allowCustomValue ? query : '')} 
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[var(--color-app-muted)]">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5 opacity-50" />}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && options.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-[var(--shadow-premium)] border border-[var(--color-app-border)] overflow-hidden max-h-60 overflow-y-auto"
          >
            <ul className="py-1">
              {options.map((option, idx) => (
                <li
                  key={option.id || `opt-${idx}-${option.label}`}
                  className="px-4 py-2 hover:bg-[var(--color-brand-50)] cursor-pointer flex flex-col transition-colors"
                  onClick={() => handleSelect(option)}
                >
                  <span className="font-medium text-[var(--color-app-text)]">{option.label}</span>
                  {option.subLabel && (
                    <span className="text-xs text-[var(--color-app-muted)]">{option.subLabel}</span>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
