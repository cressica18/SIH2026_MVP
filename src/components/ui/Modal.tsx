import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      modalRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && closeOnEscape) onClose();
        if (e.key === 'Tab') {
          const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable && focusable.length > 0) {
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault(); last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault(); first.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm:   'max-w-sm',
    md:   'max-w-md',
    lg:   'max-w-lg',
    xl:   'max-w-xl',
    full: 'max-w-4xl',
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: 'rgba(3 7 4 / 0.82)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      {/* Backdrop blur */}
      <div
        className="absolute inset-0"
        style={{ backdropFilter: 'blur(8px)' }}
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`
          relative w-full ${sizeStyles[size]}
          flex flex-col max-h-[90vh]
          rounded-2xl overflow-hidden
          focus:outline-none
          animate-scale-in
        `}
        style={{
          background: 'linear-gradient(160deg, var(--color-bg-800) 0%, var(--color-bg-850) 100%)',
          border: '1px solid var(--color-bg-650)',
          boxShadow: '0 32px 80px -12px rgb(1 5 3 / 0.85), 0 8px 20px -4px rgb(1 5 3 / 0.5), inset 0 1px 0 0 rgb(255 255 255 / 0.04)',
        }}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            className="flex items-start justify-between px-5 py-4 border-b shrink-0"
            style={{
              borderColor: 'var(--color-bg-700)',
              background: 'linear-gradient(to bottom, var(--color-bg-800), transparent)',
            }}
          >
            <div className="flex-1 pr-4">
              {title && (
                <h2
                  id="modal-title"
                  className="font-display text-base font-semibold text-cream-100 tracking-tight"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-description" className="text-xs text-cream-400 mt-0.5 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="
                  p-1.5 rounded-lg text-cream-500
                  hover:text-cream-200 hover:bg-bg-750
                  active:bg-bg-700 active:scale-95
                  transition-all duration-100 cursor-pointer
                  focus:outline-none focus-ring
                "
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-5 py-5 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};