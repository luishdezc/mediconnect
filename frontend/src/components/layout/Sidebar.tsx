import React, { useState } from 'react';
import { resolveAvatar } from '../../utils/avatar';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, CalendarDays, Users, User, MessageSquare, FileText,
  Settings, LogOut, Video, CreditCard, UserCheck, ChevronLeft, Menu, Stethoscope, Clock, Pill,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import NotificationBell from './NotificationBell';
import styles from './Sidebar.module.scss';

const NAV_ITEMS = {
  patient: [
    { to: '/patient/dashboard',     label: 'Dashboard',        icon: <LayoutDashboard size={18} /> },
    { to: '/patient/doctors',        label: 'Buscar Doctores',  icon: <Stethoscope size={18} /> },
    { to: '/patient/appointments',   label: 'Mis Citas',        icon: <Calendar size={18} /> },
    { to: '/patient/profile',        label: 'Mi Perfil',        icon: <User size={18} /> },
    { to: '/patient/records',        label: 'Historial Médico', icon: <FileText size={18} /> },
    { to: '/patient/chat',           label: 'Mensajes',         icon: <MessageSquare size={18} /> },
    { to: '/patient/video',          label: 'Videollamadas',    icon: <Video size={18} /> },
    { to: '/patient/medications',     label: 'Medicamentos',     icon: <Pill size={18} /> },
  ],
  doctor: [
    { to: '/doctor/dashboard',       label: 'Dashboard',        icon: <LayoutDashboard size={18} /> },
    { to: '/doctor/appointments',    label: 'Citas',            icon: <Calendar size={18} /> },
    { to: '/doctor/calendar',         label: 'Calendario',       icon: <CalendarDays size={18} /> },
    { to: '/doctor/patients',        label: 'Mis Pacientes',    icon: <Users size={18} /> },
    { to: '/doctor/chat',            label: 'Mensajes',         icon: <MessageSquare size={18} /> },
    { to: '/doctor/availability',    label: 'Disponibilidad',   icon: <Clock size={18} /> },
    { to: '/doctor/video',           label: 'Videollamadas',    icon: <Video size={18} /> },
    { to: '/doctor/subscription',    label: 'Suscripción',      icon: <CreditCard size={18} /> },
  ],
  admin: [
    { to: '/admin/dashboard',        label: 'Dashboard',        icon: <LayoutDashboard size={18} /> },
    { to: '/admin/users',            label: 'Usuarios',         icon: <Users size={18} /> },
    { to: '/admin/doctors/pending',  label: 'Aprobaciones',     icon: <UserCheck size={18} /> },
  ],
};

const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = NAV_ITEMS[user?.role as keyof typeof NAV_ITEMS] || [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile toggle */}
      <button className={styles.mobileToggle} onClick={() => setMobileOpen(true)}>
        <Menu size={22} />
      </button>
      {mobileOpen && <div className={styles.overlay} onClick={() => setMobileOpen(false)} />}

      <aside className={[styles.sidebar, collapsed ? styles['sidebar--collapsed'] : '', mobileOpen ? styles['sidebar--open'] : ''].join(' ')}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🏥</span>
            {!collapsed && <span className={styles.logoText}>MediConnect</span>}
          </div>
          <div className={styles.brandRight}>
            {!collapsed && <NotificationBell />}
            <button className={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)}>
            <ChevronLeft size={16} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: '250ms' }} />
          </button>
          </div>
        </div>

        {/* User info */}
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {user?.avatar
              ? <img src={resolveAvatar(user.avatar)} alt={user.name} />
              : <span>{user?.name?.[0]?.toUpperCase()}</span>
            }
          </div>
          {!collapsed && (
            <div className={styles.userMeta}>
              <span className={styles.userName}>{user?.name}</span>
              <span className={styles.userRole}>
                {user?.role === 'patient' ? 'Paciente' : user?.role === 'doctor' ? 'Doctor' : 'Admin'}
              </span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [styles.navItem, isActive ? styles['navItem--active'] : ''].join(' ')
              }
              title={collapsed ? item.label : ''}
              onClick={() => setMobileOpen(false)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className={styles.bottom}>
          <NavLink to="/settings" className={({ isActive }) => [styles.navItem, isActive ? styles['navItem--active'] : ''].join(' ')} title={collapsed ? 'Configuración' : ''}>
            <span className={styles.navIcon}><Settings size={18} /></span>
            {!collapsed && <span className={styles.navLabel}>Configuración</span>}
          </NavLink>
          <button className={[styles.navItem, styles['navItem--logout']].join(' ')} onClick={handleLogout}>
            <span className={styles.navIcon}><LogOut size={18} /></span>
            {!collapsed && <span className={styles.navLabel}>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
