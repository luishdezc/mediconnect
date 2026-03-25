import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import styles from './Auth.module.scss';

interface LoginForm { email: string; password: string; }

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      setUser(res.data.user);
      toast.success('¡Bienvenido!');
      const role = res.data.user.role;
      navigate(role === 'admin' ? '/admin/dashboard' : role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>🏥</span>
          <span className={styles.brandName}>MediConnect</span>
        </div>
        <div className={styles.hero}>
          <h1>Tu salud,<br />organizada.</h1>
          <p>Agenda citas con los mejores especialistas, recibe recordatorios y accede a tu historial médico desde cualquier lugar.</p>
        </div>
        <div className={styles.features}>
          {['📅 Citas en minutos', '🔔 Recordatorios automáticos', '💬 Chat con tu médico', '📋 Historial digital'].map(f => (
            <div key={f} className={styles.feature}>{f}</div>
          ))}
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2>Iniciar Sesión</h2>
            <p>¿No tienes cuenta? <Link to="/register">Regístrate gratis</Link></p>
          </div>

          <a href={`${import.meta.env.VITE_API_URL}/auth/google`} className={styles.googleBtn}>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </a>

          <div className={styles.divider}><span>o con correo</span></div>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tu@correo.com"
              icon={<Mail size={16} />}
              error={errors.email?.message}
              {...register('email', { required: 'El correo es requerido' })}
            />
            <Input
              label="Contraseña"
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              icon={<Lock size={16} />}
              rightIcon={
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              error={errors.password?.message}
              {...register('password', { required: 'La contraseña es requerida' })}
            />
            <Button type="submit" loading={loading} fullWidth size="lg">
              Iniciar Sesión
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
