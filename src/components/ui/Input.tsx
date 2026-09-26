import React, { forwardRef } from 'react';

const fieldBase = `
  w-full rounded-lg transition-all duration-100 text-sm text-cream-100
  bg-bg-800 border border-bg-650
  placeholder:text-cream-700
  hover:border-bg-500 hover:bg-bg-800
  focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 focus:bg-bg-750
  disabled:bg-bg-700 disabled:cursor-not-allowed disabled:text-cream-600 disabled:opacity-60
`;

const fieldError = `
  border-copper-500 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20
`;

/* ── Input ── */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      fullWidth = true,
      className = '',
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[11px] font-semibold text-cream-500 uppercase tracking-widest mb-1.5"
          >
            {label}
            {required && (
              <span className="text-copper-400 ml-1" aria-hidden="true">*</span>
            )}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cream-600">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            className={`
              ${fieldBase}
              ${leftIcon ? 'pl-10' : 'pl-3.5'}
              ${rightIcon ? 'pr-10' : 'pr-3.5'}
              py-2.5
              ${error ? fieldError : ''}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-cream-600">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-[11px] font-medium text-copper-300 flex items-center gap-1"
            role="alert"
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-[11px] text-cream-600">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

/* ── Textarea ── */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      fullWidth = true,
      className = '',
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-[11px] font-semibold text-cream-500 uppercase tracking-widest mb-1.5"
          >
            {label}
            {required && (
              <span className="text-copper-400 ml-1" aria-hidden="true">*</span>
            )}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined
          }
          className={`
            ${fieldBase}
            px-3.5 py-2.5 resize-y min-h-[100px]
            ${error ? fieldError : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p
            id={`${textareaId}-error`}
            className="mt-1.5 text-[11px] font-medium text-copper-300"
            role="alert"
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${textareaId}-hint`} className="mt-1.5 text-[11px] text-cream-600">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';