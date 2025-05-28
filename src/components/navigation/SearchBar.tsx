
import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  isMobile: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ isMobile }) => {
  const [isSearchActive, setIsSearchActive] = useState(false);

  if (isMobile) {
    return isSearchActive ? (
      <div className="absolute right-0 top-0 flex items-center">
        <input 
          type="text" 
          id="mobile-search"
          name="search"
          placeholder="Search" 
          className="pl-2 pr-8 py-1 bg-transparent border-b border-bookish-maroon/50 focus:outline-none focus:border-bookish-maroon text-sm w-full" 
          autoFocus
          onBlur={() => setIsSearchActive(false)}
        />
        <X 
          className="absolute right-2 h-4 w-4 text-bookish-maroon/70 cursor-pointer" 
          onClick={() => setIsSearchActive(false)}
        />
      </div>
    ) : (
      <Search 
        className="h-5 w-5 text-bookish-maroon/70 cursor-pointer" 
        onClick={() => setIsSearchActive(true)}
      />
    );
  }

  return (
    <div className="relative">
      <input 
        type="text" 
        id="desktop-search"
        name="search"
        placeholder="Search" 
        className="pl-2 pr-8 py-1 bg-transparent border-b border-bookish-maroon/50 focus:outline-none focus:border-bookish-maroon text-sm" 
      />
      <Search className="absolute right-0 top-1/2 transform -translate-y-1/2 h-4 w-4 text-bookish-maroon/70" />
    </div>
  );
};

export default SearchBar;
