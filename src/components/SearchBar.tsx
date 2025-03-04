import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useSearch } from '../context/SearchContext';
import { TokenSearchResult } from '../types/token';

export function SearchBar() {
  const navigate = useNavigate();
  const { state, search, clearSearch } = useSearch();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (inputValue.trim()) {
        search(inputValue);
      }
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [inputValue, search]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setIsOpen(true);
  };

  const handleClear = () => {
    setInputValue('');
    clearSearch();
    setIsOpen(false);
  };

  const handleResultClick = (result: TokenSearchResult) => {
    navigate(`/token/${result.address}`);
    handleClear();
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="flex items-center gap-2 p-2 bg-black/30 rounded border border-[#00ff00]/20">
        <Search size={18} className="text-[#00ff00] opacity-70" />
        <input
          type="text"
          placeholder="Search by name, ticker or address..."
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="flex-1 bg-transparent border-none outline-none text-[#00ff00] placeholder-[#00ff00]/50"
        />
        {inputValue && (
          <button
            onClick={handleClear}
            className="terminal-button px-2 py-1 text-xs"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && inputValue && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black/90 border border-[#00ff00]/20 rounded-lg z-50 max-h-[400px] overflow-y-auto custom-scrollbar">
          {state.isLoading ? (
            <div className="p-4 text-center">
              <span className="text-[#00ff00] opacity-70">Searching...</span>
            </div>
          ) : state.error ? (
            <div className="p-4 text-center text-red-400">
              {state.error}
            </div>
          ) : state.results.length > 0 ? (
            <div className="divide-y divide-[#00ff00]/10">
              {state.results.map(result => (
                <div
                  key={result.address}
                  className="p-4 hover:bg-[#00ff00]/10 cursor-pointer transition-colors"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#00ff00]">{result.name}</span>
                      <span className="text-sm opacity-70">({result.symbol})</span>
                    </div>
                    <div className="mt-1">
                      <code className="text-xs font-mono opacity-50">{result.address}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center opacity-70">
              No results found for "{inputValue}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}