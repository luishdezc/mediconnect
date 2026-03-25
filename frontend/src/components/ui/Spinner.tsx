import React from 'react';
import styles from './Spinner.module.scss';

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'full';
  label?: string;
}

const Spinner: React.FC<Props> = ({ size = 'md', label }) => {
  if (size === 'full') {
    return (
      <div className={styles.fullPage}>
        <div className={styles.logo}>🏥</div>
        <div className={styles.spinner} data-size="lg"/>
        {label && <p className={styles.label}>{label}</p>}
      </div>
    );
  }

  return (
    <div className={styles.inline}>
      <div className={styles.spinner} data-size={size}/>
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
};

export default Spinner;
