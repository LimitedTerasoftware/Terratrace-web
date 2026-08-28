import React from 'react';
import Select, { SingleValue, GroupBase, StylesConfig } from 'react-select';

export interface SearchableSelectOption {
  value: string;
  label: string;
  isDisabled?: boolean;
}

type RawOption = SearchableSelectOption | string | number;

interface SearchableSelectProps {
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  options: RawOption[];
  placeholder?: string;
  disabled?: boolean;
  isClearable?: boolean;
  className?: string;
  name?: string;
  id?: string;
  required?: boolean;
}

const normalizeOptions = (options: RawOption[]): SearchableSelectOption[] =>
  options.map((opt) =>
    typeof opt === 'object'
      ? opt
      : { value: String(opt), label: String(opt) },
  );

const customStyles: StylesConfig<
  SearchableSelectOption,
  false,
  GroupBase<SearchableSelectOption>
> = {
  control: (base, state) => ({
    ...base,
    minHeight: '1.75rem',
    borderRadius: '0.375rem',
    borderColor: state.isFocused ? '#3c50e0' : '#e2e8f0',
    boxShadow: 'none',
    backgroundColor: '#fff',
    '&:hover': {
      borderColor: state.isFocused ? '#3c50e0' : '#e2e8f0',
    },
  }),
  menu: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#3c50e0'
      : state.isFocused
        ? '#f1f5f9'
        : 'transparent',
    color: state.isSelected ? '#fff' : '#1c2434',
    cursor: 'pointer',
  }),
  singleValue: (base) => ({
    ...base,
    color: 'inherit',
  }),
  placeholder: (base) => ({
    ...base,
    color: '#8a99af',
  }),
  input: (base) => ({
    ...base,
    color: 'inherit',
  }),
};

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  isClearable = true,
  className = '',
  name,
  id,
  required,
}) => {
  const normalized = normalizeOptions(options);
  const selected =
    value === null || value === undefined || value === ''
      ? null
      : (normalized.find((opt) => opt.value === String(value)) ?? null);

  const handleChange = (option: SingleValue<SearchableSelectOption>) => {
    onChange(option ? option.value : '');
  };

  return (
    <Select<SearchableSelectOption, false>
      inputId={id}
      name={name}
      className={`searchable-select-container ${className}`}
      classNamePrefix="searchable-select"
      value={selected}
      onChange={handleChange}
      options={normalized}
      placeholder={placeholder}
      isDisabled={disabled}
      isClearable={isClearable}
      isSearchable
      required={required}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
      styles={customStyles}
    />
  );
};

export default SearchableSelect;
