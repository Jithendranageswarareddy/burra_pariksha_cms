import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '../../design-system/components/Input';

interface SearchInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  id = 'search-input',
  value,
  onChange,
  placeholder = 'Search by keyword, topic, ID...',
  className = '',
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        leftIcon={Search}
        rightIcon={value ? X : undefined}
        onRightIconClick={value ? () => onChange('') : undefined}
      />
    </div>
  );
};
