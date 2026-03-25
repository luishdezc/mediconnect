import React from 'react';
import styles from './Input.module.scss';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
export const Input: React.FC<InputProps> = ({ label, error, hint, icon, rightIcon, className = '', id, ...props }) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={[styles.field, error ? styles['field--error'] : ''].join(' ')}>
      {label && <label htmlFor={inputId} className={styles.label}>{label}</label>}
      <div className={styles.wrap}>
        {icon && <span className={styles.iconLeft}>{icon}</span>}
        <input
          id={inputId}
          className={[styles.input, icon ? styles['input--icon-left'] : '', rightIcon ? styles['input--icon-right'] : '', className].join(' ')}
          {...props}
        />
        {rightIcon && <span className={styles.iconRight}>{rightIcon}</span>}
      </div>
      {error && <span className={styles.error}>{error}</span>}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}
export const Select: React.FC<SelectProps> = ({ label, error, options, placeholder, id, className = '', ...props }) => {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={[styles.field, error ? styles['field--error'] : ''].join(' ')}>
      {label && <label htmlFor={selectId} className={styles.label}>{label}</label>}
      <select id={selectId} className={[styles.input, styles.select, className].join(' ')} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}
export const Textarea: React.FC<TextareaProps> = ({ label, error, hint, id, className = '', ...props }) => {
  const areaId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={[styles.field, error ? styles['field--error'] : ''].join(' ')}>
      {label && <label htmlFor={areaId} className={styles.label}>{label}</label>}
      <textarea id={areaId} className={[styles.input, styles.textarea, className].join(' ')} {...props} />
      {error && <span className={styles.error}>{error}</span>}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
    </div>
  );
};
