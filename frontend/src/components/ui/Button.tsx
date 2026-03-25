import React from 'react';
import styles from './Button.module.scss';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children, variant = 'primary', size = 'md', loading = false,
  icon, iconPosition = 'left', fullWidth = false,
  className = '', disabled, ...props
}) => (
  <button
    className={[
      styles.btn,
      styles[`btn--${variant}`],
      styles[`btn--${size}`],
      fullWidth ? styles['btn--full'] : '',
      loading ? styles['btn--loading'] : '',
      className,
    ].filter(Boolean).join(' ')}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? (
      <span className={styles.spinner} aria-hidden />
    ) : (
      <>
        {icon && iconPosition === 'left' && <span className={styles.icon}>{icon}</span>}
        {children && <span>{children}</span>}
        {icon && iconPosition === 'right' && <span className={styles.icon}>{icon}</span>}
      </>
    )}
  </button>
);

export default Button;
