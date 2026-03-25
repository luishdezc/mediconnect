import React from 'react';
import Sidebar from './Sidebar';
import styles from './DashboardLayout.module.scss';

interface Props { children: React.ReactNode; }

const DashboardLayout: React.FC<Props> = ({ children }) => (
  <div className={styles.layout}>
    <Sidebar />
    <main className={styles.main}>
      <div className={styles.content}>{children}</div>
    </main>
  </div>
);

export default DashboardLayout;
