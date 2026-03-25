import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Stethoscope, BadgeCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import styles from './Auth.module.scss';

interface RegisterForm {
  name: string; email: string; password: string; confirmPassword: string;
  specialization?: string; licenseNumber?: string;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const res = await authApi.register({ ...data, role });
      setUser(res.data.user);
      toast.success('¡Cuenta creada exitosamente!');
      navigate(role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al registrarse');
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
          <h1>Únete a la<br />plataforma.</h1>
          <p>Miles de pacientes y médicos ya gestionan sus citas de forma digital, segura y eficiente.</p>
        </div>
        <div className={styles.features}>
          {['🔒 Datos seguros y privados', '📱 Acceso desde cualquier dispositivo', '💊 Historial médico digital', '🌐 Doctores verificados'].map(f => (
            <div key={f} className={styles.feature}>{f}</div>
          ))}
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2>Crear Cuenta</h2>
            <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
          </div>

          {/* Role selector */}
          <div className={styles.roleSelector}>
            <label>¿Cómo deseas registrarte?</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {([['patient', '🧑‍⚕️', 'Paciente'], ['doctor', '👨‍⚕️', 'Doctor']] as const).map(([r, icon, label]) => (
                <div
                  key={r}
                  className={[styles.roleCard, role === r ? styles['roleCard--active'] : ''].join(' ')}
                  onClick={() => setRole(r)}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '20px' }} />

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <Input
              label="Nombre completo"
              placeholder="Dr. Juan Pérez"
              icon={<User size={16} />}
              error={errors.name?.message}
              {...register('name', { required: 'El nombre es requerido', minLength: { value: 3, message: 'Mínimo 3 caracteres' } })}
            />

            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tu@correo.com"
              icon={<Mail size={16} />}
              error={errors.email?.message}
              {...register('email', {
                required: 'El correo es requerido',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' },
              })}
            />

            <div className={styles.twoCol}>
              <Input
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={16} />}
                error={errors.password?.message}
                {...register('password', { required: 'La contraseña es requerida', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })}
              />
              <Input
                label="Confirmar contraseña"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={16} />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  required: 'Confirma tu contraseña',
                  validate: v => v === password || 'Las contraseñas no coinciden',
                })}
              />
            </div>

            {role === 'doctor' && (
              <div className={styles.doctorExtra}>
                <p style={{ fontSize: '13px', color: '#1a6b5c', fontWeight: 600, marginBottom: 0 }}>
                  📋 Información profesional — el admin verificará tu cédula antes de aprobar tu cuenta.
                </p>
                <Input
                  label="Especialidad"
                  placeholder="Ej. Cardiología, Pediatría…"
                  icon={<Stethoscope size={16} />}
                  error={errors.specialization?.message}
                  {...register('specialization', role === 'doctor' ? { required: 'La especialidad es requerida' } : {})}
                />
                <Input
                  label="Cédula profesional"
                  placeholder="Número de cédula"
                  icon={<BadgeCheck size={16} />}
                  error={errors.licenseNumber?.message}
                  {...register('licenseNumber', role === 'doctor' ? { required: 'La cédula es requerida' } : {})}
                />
              </div>
            )}

            <Button type="submit" loading={loading} fullWidth size="lg">
              Crear cuenta
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
