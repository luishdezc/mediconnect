import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './Card.module.scss';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  hover?: boolean;
  onClick?: () => void;
}
export const Card: React.FC<CardProps> = ({ children, className = '', padding = 'md', hover, onClick }) => (
  <div
    className={[
      styles.card,
      styles[`card--p-${padding}`],
      hover ? styles['card--hover'] : '',
      onClick ? styles['card--clickable'] : '',
      className
    ].filter(Boolean).join(' ')}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
  >
    {children}
  </div>
);

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) { document.addEventListener('keydown', handler); document.body.style.overflow = 'hidden'; }
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal>
      <div
        className={[styles.modal, styles[`modal--${size}`]].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
            <button className={styles.close} onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
          </div>
        )}
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'green' | 'blue' | 'amber' | 'rose';
  trend?: { value: number; label: string };
}
export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = 'green', trend }) => (
  <div className={[styles.statCard, styles[`statCard--${color}`]].join(' ')}>
    <div className={styles.statIcon}>{icon}</div>
    <div className={styles.statBody}>
      <span className={styles.statTitle}>{title}</span>
      <span className={styles.statValue}>{value}</span>
      {trend && (
        <span className={[styles.statTrend, trend.value >= 0 ? styles['statTrend--up'] : styles['statTrend--down']].join(' ')}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
        </span>
      )}
    </div>
  </div>
);

export default Card;
