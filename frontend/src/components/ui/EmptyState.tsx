import React from 'react';
import styles from './EmptyState.module.scss';
import Button from './Button';

interface Props {
  icon?: React.ReactNode;
  emoji?: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; icon?: React.ReactNode };
}

const EmptyState: React.FC<Props> = ({ icon, emoji, title, description, action }) => (
  <div className={styles.wrap}>
    {emoji ? (
      <span className={styles.emoji}>{emoji}</span>
    ) : icon ? (
      <div className={styles.icon}>{icon}</div>
    ) : null}
    <h3 className={styles.title}>{title}</h3>
    {description && <p className={styles.desc}>{description}</p>}
    {action && (
      <Button onClick={action.onClick} icon={action.icon} size="sm">
        {action.label}
      </Button>
    )}
  </div>
);

export default EmptyState;
