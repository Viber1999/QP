import React from 'react';

interface ToggleSwitchProps<T extends string> {
  option1: T;
  option2: T;
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

export const ToggleSwitch = <T extends string>({
  option1,
  option2,
  value,
  onChange,
  disabled = false,
}: ToggleSwitchProps<T>) => {
  const isOption1 = value === option1;

  return (
    <div
      className={`relative w-full max-w-xs mx-auto flex items-center justify-center p-1 rounded-full bg-gray-800 border border-gray-700 shadow-inner ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      }`}
      onClick={() => !disabled && onChange(isOption1 ? option2 : option1)}
      role="radiogroup"
    >
      <span
        className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-indigo-600 rounded-full shadow-md transition-transform duration-300 ease-in-out transform ${
          isOption1 ? 'translateX(0)' : 'translateX(100%)'
        }`}
        aria-hidden="true"
      ></span>

      <button
        type="button"
        role="radio"
        aria-checked={isOption1}
        onClick={() => !disabled && onChange(option1)}
        className={`relative z-10 w-1/2 py-2 px-4 text-center text-sm font-bold transition-colors duration-300 rounded-full ${
          isOption1 ? 'text-white' : 'text-gray-400 hover:text-white'
        }`}
        disabled={disabled}
      >
        {option1}
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={!isOption1}
        onClick={() => !disabled && onChange(option2)}
        className={`relative z-10 w-1/2 py-2 px-4 text-center text-sm font-bold transition-colors duration-300 rounded-full ${
          !isOption1 ? 'text-white' : 'text-gray-400 hover:text-white'
        }`}
        disabled={disabled}
      >
        {option2}
      </button>
    </div>
  );
};