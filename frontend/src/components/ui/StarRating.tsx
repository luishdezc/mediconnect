import React, { useState } from 'react';
import { Star } from 'lucide-react';
import styles from './StarRating.module.scss';

interface Props {
  value: number;
  onChange?: (val: number) => void;
  readonly?: boolean;
  size?: number;
  showNumber?: boolean;
  total?: number;
}

const StarRating: React.FC<Props> = ({
  value, onChange, readonly = false, size = 20, showNumber = false, total,
}) => {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div className={[styles.stars, readonly ? styles['stars--readonly'] : ''].join(' ')}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={styles.star}
          disabled={readonly}
          onClick={() => !readonly && onChange?.(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(0)}
          aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
        >
          <Star
            size={size}
            fill={n <= display ? '#f0b96a' : 'none'}
            stroke={n <= display ? '#f0b96a' : '#cbd5e0'}
            strokeWidth={1.5}
            style={{ transition: 'all 0.12s ease' }}
          />
        </button>
      ))}
      {showNumber && (
        <span className={styles.num}>
          {value.toFixed(1)}
          {total !== undefined && <span className={styles.total}> ({total})</span>}
        </span>
      )}
    </div>
  );
};

export default StarRating;
