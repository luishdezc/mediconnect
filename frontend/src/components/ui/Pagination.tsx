import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { Pagination as PaginationType } from '../../types';
import styles from './Pagination.module.scss';

interface Props {
  pagination: PaginationType;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<Props> = ({ pagination, onPageChange }) => {
  const { page, totalPages, total, limit } = pagination;
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const getPages = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    const delta = 2;
    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);

    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  return (
    <div className={styles.wrapper}>
      <span className={styles.info}>
        Mostrando <strong>{from}–{to}</strong> de <strong>{total}</strong> registros
      </span>

      <div className={styles.controls}>
        <button
          className={styles.btn}
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          title="Primera página"
        >
          <ChevronsLeft size={15} />
        </button>
        <button
          className={styles.btn}
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          title="Página anterior"
        >
          <ChevronLeft size={15} />
        </button>

        {getPages().map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className={styles.ellipsis}>…</span>
          ) : (
            <button
              key={p}
              className={[styles.btn, p === page ? styles['btn--active'] : ''].join(' ')}
              onClick={() => onPageChange(p as number)}
            >
              {p}
            </button>
          )
        )}

        <button
          className={styles.btn}
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          title="Página siguiente"
        >
          <ChevronRight size={15} />
        </button>
        <button
          className={styles.btn}
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          title="Última página"
        >
          <ChevronsRight size={15} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
