import React from 'react';
import { Input } from './ui/input';
import { Search } from 'lucide-react';

export default function FileSearch({ searchTerm, onSearchChange }) {
  return (
    <div className="relative">
      <Input
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="חיפוש..."
        className="pl-10 pr-4 bg-black/20 text-black"
      />
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
    </div>
  );
}