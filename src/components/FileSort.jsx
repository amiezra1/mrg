import React from 'react';
import { Button } from "./ui/button";
import { ArrowUpDown, Calendar, SortAsc, SortDesc } from 'lucide-react';

export default function FileSort({ currentSort, onSortChange }) {
  const sortOptions = [
    { id: 'name-asc', label: 'שם (א-ת)', icon: <SortAsc className="w-4 h-4" /> },
    { id: 'name-desc', label: 'שם (ת-א)', icon: <SortDesc className="w-4 h-4" /> },
    { id: 'date-desc', label: 'תאריך (חדש לישן)', icon: <Calendar className="w-4 h-4" /> },
    { id: 'date-asc', label: 'תאריך (ישן לחדש)', icon: <Calendar className="w-4 h-4 transform rotate-180" /> },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-400">מיון ע"פ:</span>
      <div className="flex">
        {sortOptions.map((option) => (
          <Button
            key={option.id}
            variant={currentSort === option.id ? "default" : "outline"}
            size="sm"
            onClick={() => onSortChange(option.id)}
            className="gap-1 all-button"
          >
            {option.icon}
            <span className="hidden md:inline">{option.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
