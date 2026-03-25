import React, { useEffect, useRef, useState } from 'react';
import { Bell, Calendar, MessageSquare, CheckCircle, X } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthStore } from '../../store/authStore';
import styles from './NotificationBell.module.scss';

interface Notification {
  id: string;
  type: 'appointment:new' | 'appointment:statusUpdate' | 'chat:message' | 'generic';
  title: string;
  body: string;
  time: Date;
  read: boolean;
}


const NotificationBell: React.FC = () => {
  const { user } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [notifs, setNotifs]     = useState<Notification[]>([]);
  const [open, setOpen]         = useState(false);
  const panelRef                = useRef<HTMLDivElement>(null);

  const unread = notifs.filter(n => !n.read).length;

  useEffect(() => {
    if (!user?._id) return;
    if (socketRef.current?.connected) return;
    const s = io(
      (import.meta.env.VITE_WS_URL as string) || 'http://localhost:5000',
      { withCredentials: true, reconnection: true, reconnectionAttempts: 5 }
    );
    socketRef.current = s;
    s.on('connect', () => { s.emit('join:user', user._id); });

    // New appointment (for doctors)
    s.on('appointment:new', (data: any) => {
      addNotif({
        type: 'appointment:new',
        title: 'Nueva cita solicitada',
        body: `${data.patient?.name || 'Un paciente'} quiere agendar contigo`,
      });
    });

    // Appointment status change
    s.on('appointment:statusUpdate', (data: any) => {
      const labels: Record<string, string> = {
        confirmed: 'Cita confirmada ✅',
        cancelled: 'Cita cancelada ❌',
        completed: 'Consulta completada',
        in_progress: 'Tu consulta ha comenzado',
      };
      addNotif({
        type: 'appointment:statusUpdate',
        title: labels[data.status] || 'Cita actualizada',
        body: `Estado cambiado a: ${data.status}`,
      });
    });

    // New chat message
    s.on('chat:message', (data: any) => {
      const senderName = data.senderId?.name || 'Alguien';
      if (data.senderId?._id === user._id) return; // ignore own messages
      addNotif({
        type: 'chat:message',
        title: `Mensaje de ${senderName}`,
        body: data.content?.slice(0, 60) + (data.content?.length > 60 ? '…' : ''),
      });
    });

    return () => { s.off(); s.disconnect(); socketRef.current = null; };
  }, [user?._id]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addNotif = (partial: Omit<Notification, 'id' | 'time' | 'read'>) => {
    const n: Notification = { ...partial, id: crypto.randomUUID(), time: new Date(), read: false };
    setNotifs(prev => [n, ...prev].slice(0, 20)); // keep last 20
  };

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const dismiss = (id: string) => setNotifs(prev => prev.filter(n => n.id !== id));
  const clearAll = () => setNotifs([]);

  const iconFor = (type: Notification['type']) => {
    if (type === 'appointment:new' || type === 'appointment:statusUpdate') return <Calendar size={14}/>;
    if (type === 'chat:message') return <MessageSquare size={14}/>;
    return <CheckCircle size={14}/>;
  };

  return (
    <div className={styles.wrap} ref={panelRef}>
      <button
        className={[styles.bell, unread > 0 ? styles['bell--active'] : ''].join(' ')}
        onClick={() => { setOpen(p => !p); if (unread > 0 && !open) markAllRead(); }}
        aria-label="Notificaciones"
      >
        <Bell size={20}/>
        {unread > 0 && (
          <span className={styles.badge}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span>Notificaciones</span>
            {notifs.length > 0 && (
              <button className={styles.clearBtn} onClick={clearAll}>Limpiar todo</button>
            )}
          </div>

          {notifs.length === 0 ? (
            <div className={styles.empty}>
              <Bell size={32}/>
              <p>Sin notificaciones</p>
            </div>
          ) : (
            <ul className={styles.list}>
              {notifs.map(n => (
                <li key={n.id} className={[styles.item, !n.read ? styles['item--unread'] : ''].join(' ')}>
                  <div className={styles.itemIcon} data-type={n.type}>
                    {iconFor(n.type)}
                  </div>
                  <div className={styles.itemContent}>
                    <strong>{n.title}</strong>
                    <span>{n.body}</span>
                    <time>{format(n.time, "HH:mm · d 'de' MMM", { locale: es })}</time>
                  </div>
                  <button className={styles.dismissBtn} onClick={() => dismiss(n.id)}>
                    <X size={12}/>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
