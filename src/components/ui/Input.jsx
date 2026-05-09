import { forwardRef } from 'react';

const Input = forwardRef(function Input({
  label,
  error,
  prefix,
  suffix,
  className = '',
  ...props
}, ref) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-gray-500 text-sm select-none">{prefix}</span>
        )}
        <input
          ref={ref}
          className={`input-field ${prefix ? 'pl-16' : ''} ${suffix ? 'pr-12' : ''} ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''} ${className}`}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 text-gray-500 text-sm">{suffix}</span>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
});

export default Input;
