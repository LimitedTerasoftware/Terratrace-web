import React, { useState } from 'react';
import SearchableSelect from '../SearchableSelect';

const SelectGroupOne: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isOptionSelected, setIsOptionSelected] = useState<boolean>(false);

  const changeTextColor = () => {
    setIsOptionSelected(true);
  };

  return (
    <div className="mb-4.5">
      <label className="mb-2.5 block text-black dark:text-white">
        {' '}
        Subject{' '}
      </label>

      <div className="relative z-20 bg-transparent dark:bg-form-input">
        <SearchableSelect
          value={selectedOption}
          onChange={(value) => {
            setSelectedOption(value);
            changeTextColor();
          }}
          options={['USA', 'UK', 'Canada']}
          placeholder="Select your subject"
          className={isOptionSelected ? 'text-black dark:text-white' : ''}
        />
      </div>
    </div>
  );
};

export default SelectGroupOne;
