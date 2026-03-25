import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './SetupAdmin.module.scss';

const SetupAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', bootstrapSecret: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handle = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.name || !form.email || !form.password || !form.bootstrapSecret) {
      setError('Todos los campos son requeridos'); return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/bootstrap-admin`,
        form,
        { withCredentials: true }
      );
      setSuccess(res.data.message + ' — Redirigiendo al login…');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <ShieldCheck size={32} />
        </div>
        <h1>Configuración inicial</h1>
        <p>Crea la cuenta de <strong>administrador</strong> para gestionar MediConnect.<br />
          Esta ruta solo funciona cuando no existe ningún admin y tienes el <code>BOOTSTRAP_SECRET</code> en tu <code>.env</code>.
        </p>

        {error   && <div className={styles.alert + ' ' + styles['alert--error']}>{error}</div>}
        {success && <div className={styles.alert + ' ' + styles['alert--success']}>{success}</div>}

        <form onSubmit={submit} className={styles.form}>
          <div className={styles.field}>
            <label>Nombre</label>
            <input name="name" placeholder="Administrador" value={form.name} onChange={handle} autoComplete="off" />
          </div>
          <div className={styles.field}>
            <label>Correo electrónico</label>
            <input name="email" type="email" placeholder="admin@mediconnect.com" value={form.email} onChange={handle} />
          </div>
          <div className={styles.field}>
            <label>Contraseña</label>
            <div className={styles.passWrap}>
              <input
                name="password"
                type={showPass ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={form.password}
                onChange={handle}
              />
              <button type="button" onClick={() => setShowPass(p => !p)} className={styles.eyeBtn}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className={styles.field}>
            <label>Bootstrap Secret</label>
            <input
              name="bootstrapSecret"
              type="password"
              placeholder="Valor de BOOTSTRAP_SECRET en tu .env"
              value={form.bootstrapSecret}
              onChange={handle}
            />
            <span className={styles.hint}>Definido en <code>backend/.env</code> → <code>BOOTSTRAP_SECRET=…</code></span>
          </div>

          <button type="submit" disabled={loading} className={styles.btn}>
            {loading ? 'Creando…' : '🛡️ Crear administrador'}
          </button>
        </form>

        <div className={styles.altMethod}>
          <p>¿Prefieres usar el script de CLI?</p>
          <code>cd backend && npx ts-node src/scripts/createAdmin.ts</code>
        </div>
      </div>
    </div>
  );
};

export default SetupAdminPage;