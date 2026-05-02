import React, { useEffect, useState } from 'react';
import {
  User, Lock, Bell, Stethoscope, Camera, Save, Eye, EyeOff,
  MapPin, DollarSign, BookOpen, Globe, Phone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import api, { doctorApi } from '../../api';
import type { Doctor } from '../../types';
import styles from './SettingsPage.module.scss';

type Tab = 'profile' | 'security' | 'doctor' | 'notifications';

const SPECIALIZATIONS = [
  'Medicina General','Cardiología','Dermatología','Endocrinología','Gastroenterología',
  'Ginecología','Neurología','Oftalmología','Oncología','Ortopedia','Otorrinolaringología',
  'Pediatría','Psiquiatría','Radiología','Urología','Otro',
].map(s => ({ value: s, label: s }));

const LANGUAGES = ['Español','Inglés','Francés','Portugués','Alemán','Otro'];

const SettingsPage: React.FC = () => {
  const { user, profile, fetchMe } = useAuthStore();
  const [tab, setTab] = useState<Tab>('profile');
  const [saving, setSaving] = useState(false);


  const [name,   setName]   = useState(user?.name || '');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');


  const [oldPass,  setOldPass]  = useState('');
  const [newPass,  setNewPass]  = useState('');
  const [confPass, setConfPass] = useState('');
  const [showOld,  setShowOld]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);


  const [docProfile, setDocProfile] = useState<Partial<Doctor>>({});
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);


  const [notifs, setNotifs] = useState({
    emailAppointmentConfirm:  true,
    emailAppointmentReminder: true,
    emailNewMessage:          true,
    emailMarketing:           false,
  });

  useEffect(() => {
    if (user) setName(user.name);
    if (user?.avatar) setAvatarPreview(user.avatar);
    if (profile && user?.role === 'doctor') {
      setDocProfile({
        specialization:  profile.specialization  || '',
        bio:             profile.bio             || '',
        hourlyRate:      profile.hourlyRate      || '',
        phone:           profile.phone           || '',
        locationAddress: profile.locationAddress || '',
        locationLat:     profile.locationLat     || '',
        locationLng:     profile.locationLng     || '',
        experience:      profile.experience      || '',
      });
      setSelectedLangs(profile.languages || []);
    }
  }, [user, profile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('La imagen debe ser menor a 2MB'); return; }
    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const saveProfile = async () => {
    if (!name.trim()) { toast.error('El nombre es requerido'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      if (avatar) fd.append('avatar', avatar);
      await api.put('/users/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await fetchMe();
      toast.success('Perfil actualizado');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const savePassword = async () => {
    if (!oldPass || !newPass || !confPass) { toast.error('Completa todos los campos'); return; }
    if (newPass.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return; }
    if (newPass !== confPass) { toast.error('Las contraseñas no coinciden'); return; }
    setSaving(true);
    try {
      await api.put('/users/password', { currentPassword: oldPass, newPassword: newPass });
      toast.success('Contraseña actualizada');
      setOldPass(''); setNewPass(''); setConfPass('');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Contraseña actual incorrecta');
    } finally { setSaving(false); }
  };

  const saveDoctorProfile = async () => {
    setSaving(true);
    try {
      await doctorApi.updateProfile({ ...docProfile, languages: selectedLangs });
      await fetchMe();
      toast.success('Perfil médico actualizado');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const toggleLang = (lang: string) => {
    setSelectedLangs(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const TABS = [
    { id: 'profile',       label: 'Perfil',          icon: <User size={16}/>,        show: true },
    { id: 'security',      label: 'Seguridad',        icon: <Lock size={16}/>,        show: true },
    { id: 'doctor',        label: 'Perfil Médico',    icon: <Stethoscope size={16}/>, show: user?.role === 'doctor' },
    { id: 'notifications', label: 'Notificaciones',   icon: <Bell size={16}/>,        show: true },
  ].filter(t => t.show);

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1>Configuración</h1>
          <p>Gestiona tu cuenta y preferencias</p>
        </div>

        <div className={styles.layout}>
          {/* Sidebar tabs */}
          <nav className={styles.tabs}>
            {TABS.map(t => (
              <button
                key={t.id}
                className={[styles.tabBtn, tab === t.id ? styles['tabBtn--active'] : ''].join(' ')}
                onClick={() => setTab(t.id as Tab)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className={styles.content}>

            {/* ── Profile ─────────────────────────────── */}
            {tab === 'profile' && (
              <Card>
                <h2 className={styles.sectionTitle}>Información personal</h2>
                <div className={styles.avatarSection}>
                  <div className={styles.avatarWrap}>
                    {avatarPreview
                      ? <img src={avatarPreview} alt="Avatar" className={styles.avatarImg}/>
                      : <div className={styles.avatarPlaceholder}>{user?.name?.[0]?.toUpperCase()}</div>
                    }
                    <label className={styles.avatarOverlay} htmlFor="avatar-upload">
                      <Camera size={18}/>
                      <input
                        id="avatar-upload" type="file" accept="image/*" hidden
                        onChange={handleAvatarChange}
                      />
                    </label>
                  </div>
                  <div className={styles.avatarInfo}>
                    <strong>Foto de perfil</strong>
                    <span>JPG, PNG o WebP · Máx 2MB</span>
                    <label htmlFor="avatar-upload" className={styles.changeLink}>Cambiar foto</label>
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <Input
                    label="Nombre completo"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    icon={<User size={15}/>}
                  />
                  <Input
                    label="Correo electrónico"
                    value={user?.email || ''}
                    disabled
                    hint="El correo no puede modificarse"
                  />
                </div>

                <div className={styles.roleInfo}>
                  <span className={styles.rolePill} data-role={user?.role}>
                    {user?.role === 'patient' ? 'Paciente' : user?.role === 'doctor' ? 'Doctor' : 'Admin'}
                  </span>
                  <span className={styles.authPill}>
                    {user?.authType === 'google' ? 'Google' : 'Cuenta local'}
                  </span>
                </div>

                <div className={styles.formActions}>
                  <Button icon={<Save size={15}/>} loading={saving} onClick={saveProfile}>
                    Guardar cambios
                  </Button>
                </div>
              </Card>
            )}

            {/* ── Security ──────────────────────────────── */}
            {tab === 'security' && (
              <Card>
                <h2 className={styles.sectionTitle}>Cambiar contraseña</h2>
                {user?.authType === 'google' ? (
                  <div className={styles.googleMsg}>
                    <span>🔵</span>
                    <div>
                      <strong>Cuenta de Google</strong>
                      <p>Tu cuenta usa autenticación de Google. Cambia tu contraseña desde la configuración de tu cuenta Google.</p>
                    </div>
                  </div>
                ) : (
                  <div className={styles.formGrid}>
                    <div className={styles.fullCol}>
                      <Input
                        label="Contraseña actual"
                        type={showOld ? 'text' : 'password'}
                        value={oldPass}
                        onChange={e => setOldPass(e.target.value)}
                        icon={<Lock size={15}/>}
                        rightIcon={
                          <button type="button" onClick={() => setShowOld(p=>!p)} style={{background:'none',border:'none',cursor:'pointer',display:'flex'}}>
                            {showOld ? <EyeOff size={15}/> : <Eye size={15}/>}
                          </button>
                        }
                      />
                    </div>
                    <Input
                      label="Nueva contraseña"
                      type={showNew ? 'text' : 'password'}
                      value={newPass}
                      onChange={e => setNewPass(e.target.value)}
                      icon={<Lock size={15}/>}
                      rightIcon={
                        <button type="button" onClick={() => setShowNew(p=>!p)} style={{background:'none',border:'none',cursor:'pointer',display:'flex'}}>
                          {showNew ? <EyeOff size={15}/> : <Eye size={15}/>}
                        </button>
                      }
                      hint="Mínimo 6 caracteres"
                    />
                    <Input
                      label="Confirmar nueva contraseña"
                      type="password"
                      value={confPass}
                      onChange={e => setConfPass(e.target.value)}
                      icon={<Lock size={15}/>}
                      error={confPass && confPass !== newPass ? 'Las contraseñas no coinciden' : undefined}
                    />
                    {/* Password strength */}
                    {newPass && (
                      <div className={styles.fullCol}>
                        <PasswordStrength password={newPass}/>
                      </div>
                    )}
                    <div className={styles.fullCol}>
                      <Button icon={<Save size={15}/>} loading={saving} onClick={savePassword}>
                        Actualizar contraseña
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* ── Doctor profile ────────────────────────── */}
            {tab === 'doctor' && user?.role === 'doctor' && (
              <Card>
                <h2 className={styles.sectionTitle}>Perfil médico</h2>
                <div className={styles.formGrid}>
                  <Select
                    label="Especialidad"
                    options={SPECIALIZATIONS}
                    value={(docProfile.specialization as string) || ''}
                    onChange={e => setDocProfile(p => ({ ...p, specialization: e.target.value }))}
                  />
                  <Input
                    label="Teléfono de consultorio"
                    value={(docProfile.phone as string) || ''}
                    onChange={e => setDocProfile(p => ({ ...p, phone: e.target.value }))}
                    icon={<Phone size={15}/>}
                    placeholder="+52 55 1234 5678"
                  />
                  <Input
                    label="Años de experiencia"
                    type="number"
                    min={0} max={60}
                    value={String(docProfile.experience ?? '')}
                    onChange={e => setDocProfile(p => ({ ...p, experience: e.target.value as any }))}
                    icon={<BookOpen size={15}/>}
                  />
                  <Input
                    label="Tarifa por consulta (MXN)"
                    type="number"
                    min={0}
                    value={String(docProfile.hourlyRate ?? '')}
                    onChange={e => setDocProfile(p => ({ ...p, hourlyRate: e.target.value as any }))}
                    icon={<DollarSign size={15}/>}
                    placeholder="500"
                  />
                  <div className={styles.fullCol}>
                    <Textarea
                      label="Biografía profesional"
                      value={(docProfile.bio as string) || ''}
                      onChange={e => setDocProfile(p => ({ ...p, bio: e.target.value }))}
                      rows={4}
                      placeholder="Describe tu experiencia, formación y áreas de especialidad…"
                    />
                  </div>
                  <div className={styles.fullCol}>
                    <Input
                      label="Dirección del consultorio"
                      value={(docProfile.locationAddress as string) || ''}
                      onChange={e => setDocProfile(p => ({ ...p, locationAddress: e.target.value }))}
                      icon={<MapPin size={15}/>}
                      placeholder="Calle, Colonia, Ciudad"
                    />
                  </div>
                  <Input
                    label="Latitud"
                    type="number"
                    step="any"
                    value={String(docProfile.locationLat ?? '')}
                    onChange={e => setDocProfile(p => ({ ...p, locationLat: e.target.value as any }))}
                    icon={<Globe size={15}/>}
                    placeholder="19.4326"
                  />
                  <Input
                    label="Longitud"
                    type="number"
                    step="any"
                    value={String(docProfile.locationLng ?? '')}
                    onChange={e => setDocProfile(p => ({ ...p, locationLng: e.target.value as any }))}
                    icon={<Globe size={15}/>}
                    placeholder="-99.1332"
                  />
                  <div className={styles.fullCol}>
                    <label className={styles.fieldLabel}>Idiomas de atención</label>
                    <div className={styles.langPills}>
                      {LANGUAGES.map(lang => (
                        <button
                          key={lang}
                          type="button"
                          className={[styles.langPill, selectedLangs.includes(lang) ? styles['langPill--active'] : ''].join(' ')}
                          onClick={() => toggleLang(lang)}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className={styles.formActions}>
                  <Button icon={<Save size={15}/>} loading={saving} onClick={saveDoctorProfile}>
                    Guardar perfil médico
                  </Button>
                </div>
              </Card>
            )}

            {/* ── Notifications ─────────────────────────── */}
            {tab === 'notifications' && (
              <Card>
                <h2 className={styles.sectionTitle}>Preferencias de notificaciones</h2>
                <div className={styles.notifList}>
                  {([
                    ['emailAppointmentConfirm',  '📅', 'Confirmación de citas',      'Recibe un correo cuando se confirme una cita'],
                    ['emailAppointmentReminder', '🔔', 'Recordatorios de citas',     'Recibe un correo 24h antes de tu cita'],
                    ['emailNewMessage',          '💬', 'Nuevos mensajes',            'Recibe una notificación cuando te escriban'],
                    ['emailMarketing',           '📢', 'Novedades de MediConnect',   'Actualizaciones, funciones nuevas y ofertas'],
                  ] as const).map(([key, icon, title, desc]) => (
                    <div key={key} className={styles.notifRow}>
                      <span className={styles.notifIcon}>{icon}</span>
                      <div className={styles.notifInfo}>
                        <strong>{title}</strong>
                        <span>{desc}</span>
                      </div>
                      <button
                        className={[styles.toggle, notifs[key] ? styles['toggle--on'] : ''].join(' ')}
                        onClick={() => setNotifs(p => ({ ...p, [key]: !p[key] }))}
                      >
                        <span className={styles.toggleKnob}/>
                      </button>
                    </div>
                  ))}
                </div>
                <div className={styles.formActions}>
                  <Button
                    icon={<Save size={15}/>}
                    loading={saving}
                    onClick={async () => {
                      setSaving(true);
                      await new Promise(r => setTimeout(r, 600));
                      toast.success('Preferencias guardadas');
                      setSaving(false);
                    }}
                  >
                    Guardar preferencias
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};


function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Mínimo 6 caracteres', ok: password.length >= 6 },
    { label: 'Letra mayúscula',     ok: /[A-Z]/.test(password) },
    { label: 'Número',              ok: /[0-9]/.test(password) },
    { label: 'Carácter especial',   ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['#e53e3e','#e53e3e','#f0b96a','#1a6b5c'];
  const labels = ['Muy débil','Débil','Moderada','Fuerte'];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{ display:'flex', gap:4 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            flex:1, height:4, borderRadius:2,
            background: i < score ? colors[score-1] : '#e2e8f0',
            transition: 'background 0.3s',
          }}/>
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {checks.map(c => (
            <span key={c.label} style={{ fontSize:12, color: c.ok ? '#1a6b5c' : '#a0aec0' }}>
              {c.ok ? '✓' : '○'} {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span style={{ fontSize:12, fontWeight:700, color: colors[score-1] }}>
            {labels[score-1]}
          </span>
        )}
      </div>
    </div>
  );
}

export default SettingsPage;