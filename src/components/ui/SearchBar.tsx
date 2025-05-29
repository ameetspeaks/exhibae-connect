import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from './button';

interface SearchBarProps {
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ className }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <form 
      onSubmit={handleSearch}
      className={`flex items-center gap-2 bg-white rounded-lg shadow-sm ${className}`}
    >
      <div className="flex-1 flex items-center">
        <Search className="w-5 h-5 text-gray-400 ml-3" />
        <input
          type="text"
          placeholder="Search exhibitions"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 text-sm focus:outline-none rounded-l-lg"
        />
      </div>
      <Button 
        type="submit"
        className="m-1 bg-[#4B1E25] hover:bg-[#4B1E25]/90"
      >
        Search
      </Button>
    </form>
  );
}; 