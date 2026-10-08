import React from 'react';
import FormLabel from '../FormLabel/FormLabel';
import FormError from '../FormError/FormError';
import styles from './FormField.module.css';

export function FormField({
  id,
  label,
  required = false,
  error,
  helpText,
  children,
  className = '',
}) {
  const errorId = error ? `${id}-error` : undefined;
  const helpId = helpText ? `${id}-help` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`${styles.formField} ${className}`}>
      {label && (
        <FormLabel htmlFor={id} required={required}>
          {label}
        </FormLabel>
      )}
      
      {/* Clone child input and pass aria-describedby & error flag */}
      {React.isValidElement(children)
        ? React.cloneElement(children, {
            id,
            required,
            ...(typeof children.type === 'string'
              ? { 'aria-invalid': !!error }
              : { hasError: !!error }),
            'aria-describedby': describedBy,
          })
        : children}

      {helpText && !error && (
        <p id={helpId} className={styles.helpText}>
          {helpText}
        </p>
      )}

      {error && <FormError id={errorId} message={error} />}
    </div>
  );
}

export default FormField;
