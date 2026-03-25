import React, { useEffect, useState } from 'react';
import { resolveAvatar } from '../../utils/avatar';
import { Link } from 'react-router-dom';
import {
  Calendar, Shield, MessageSquare, Video,
  MapPin, Star, ArrowRight, CheckCircle,
} from 'lucide-react';
import { doctorApi } from '../../api';
import type { Doctor } from '../../types';
import styles from './LandingPage.module.scss';

const FEATURES = [
  { icon: <Calendar size={28}/>, title: 'Citas en minutos', desc: 'Agenda tu consulta en pocos clics, sin llamadas ni esperas.' },
  { icon: <Shield size={28}/>, title: 'Doctores verificados', desc: 'Cada médico es verificado con su cédula profesional.' },
  { icon: <MessageSquare size={28}/>, title: 'Chat directo', desc: 'Comunícate con tu doctor antes y después de la consulta.' },
  { icon: <Video size={28}/>, title: 'Videollamadas HD', desc: 'Atiende tu consulta desde cualquier lugar con video de alta calidad.' },
  { icon: <MapPin size={28}/>, title: 'Busca por ubicación', desc: 'Encuentra especialistas cerca de ti usando el mapa interactivo.' },
  { icon: <Star size={28}/>, title: 'Historial digital', desc: 'Accede a tus expedientes, recetas y estudios en un solo lugar.' },
];

const STEPS = [
  { n: '01', title: 'Crea tu cuenta', desc: 'Regístrate gratis como paciente en menos de 2 minutos.' },
  { n: '02', title: 'Elige tu doctor', desc: 'Busca por especialidad, ubicación o nombre.' },
  { n: '03', title: 'Agenda tu cita', desc: 'Selecciona fecha, hora y modalidad (presencial o video).' },
  { n: '04', title: '¡Listo!', desc: 'Recibe confirmación por correo y acude a tu consulta.' },
];

const LandingPage: React.FC = () => {
  const [featuredDoctors, setFeaturedDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    doctorApi.getAll({ page: 1 })
      .then(r => setFeaturedDoctors(r.data.data.filter((d: Doctor) => d.isFeatured).slice(0, 3)))
      .catch(() => {});
  }, []);

  return (
    <div className={styles.page}>
      {}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.navBrand}>
            <span>🏥</span>
            <strong>MediConnect</strong>
          </div>
          <div className={styles.navLinks}>
            <a href="#features">Funciones</a>
            <a href="#how">¿Cómo funciona?</a>
            <a href="#doctors">Doctores</a>
          </div>
          <div className={styles.navActions}>
            <Link to="/login" className={styles.loginBtn}>Iniciar sesión</Link>
            <Link to="/register" className={styles.registerBtn}>Crear cuenta</Link>
          </div>
        </div>
      </nav>

      {}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>🚀 Plataforma gratuita para pacientes</div>
          <h1>Tu salud,<br/>organizada<br/><span>digitalmente.</span></h1>
          <p>
            Conecta con médicos verificados, agenda citas en línea y lleva un
            seguimiento completo de tu historial médico — todo desde un solo lugar.
          </p>
          <div className={styles.heroCtas}>
            <Link to="/register" className={styles.ctaPrimary}>
              Comenzar gratis <ArrowRight size={16}/>
            </Link>
            <Link to="/login" className={styles.ctaSecondary}>
              ¿Eres doctor? <span>Únete aquí</span>
            </Link>
          </div>
          <div className={styles.heroStats}>
            <div><strong>500+</strong><span>Doctores</span></div>
            <div className={styles.statDiv}/>
            <div><strong>10K+</strong><span>Pacientes</span></div>
            <div className={styles.statDiv}/>
            <div><strong>98%</strong><span>Satisfacción</span></div>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroCard}>
            <div className={styles.heroCardTop}>
              <div className={styles.heroAvatar}>👨‍⚕️</div>
              <div>
                <strong>Dr. Martínez</strong>
                <span>Cardiología · ⭐ 4.9</span>
              </div>
              <span className={styles.heroVerified}><CheckCircle size={14}/> Verificado</span>
            </div>
            <div className={styles.heroSlots}>
              {['09:00','09:30','10:00','10:30','11:00'].map((t, i) => (
                <div key={t} className={[styles.heroSlot, i === 2 ? styles['heroSlot--selected'] : ''].join(' ')}>{t}</div>
              ))}
            </div>
            <div className={styles.heroBookBtn}>Confirmar cita →</div>
          </div>
          <div className={styles.heroFloatCard1}>
            <CheckCircle size={16}/> Cita confirmada
            <span>Hoy a las 10:00 AM</span>
          </div>
          <div className={styles.heroFloatCard2}>
            💬 Nuevo mensaje de tu doctor
          </div>
        </div>
      </section>

      {}
      <section className={styles.features} id="features">
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>Funcionalidades</div>
          <h2>Todo lo que necesitas<br/>para tu salud</h2>
          <div className={styles.featuresGrid}>
            {FEATURES.map(f => (
              <div key={f.title} className={styles.featureCard}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className={styles.howSection} id="how">
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>¿Cómo funciona?</div>
          <h2>En 4 simples pasos</h2>
          <div className={styles.stepsGrid}>
            {STEPS.map((s, i) => (
              <div key={s.n} className={styles.step}>
                <div className={styles.stepNum}>{s.n}</div>
                {i < STEPS.length - 1 && <div className={styles.stepLine}/>}
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {}
      {featuredDoctors.length > 0 && (
        <section className={styles.doctorsSection} id="doctors">
          <div className={styles.sectionInner}>
            <div className={styles.sectionLabel}>Especialistas destacados</div>
            <h2>Doctores recomendados</h2>
            <div className={styles.doctorsGrid}>
              {featuredDoctors.map(doc => {
                const u = doc.userId as any;
                return (
                  <div key={doc._id} className={styles.docCard}>
                    <div className={styles.docAvatar}>
                      {u?.avatar ? <img src={resolveAvatar(u.avatar)} alt={u.name}/> : <span>{u?.name?.[0]}</span>}
                    </div>
                    <h3>{u?.name}</h3>
                    <span className={styles.docSpec}>{doc.specialization}</span>
                    <div className={styles.docRating}>
                      <Star size={13} fill="#f0b96a" stroke="#f0b96a"/>
                      {(doc.rating || 0).toFixed(1)}
                      <span>({doc.totalReviews || 0})</span>
                    </div>
                    {doc.locationAddress && (
                      <span className={styles.docLocation}><MapPin size={12}/> {doc.locationAddress}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className={styles.doctorsCta}>
              <Link to="/register" className={styles.ctaPrimary}>
                Ver todos los doctores <ArrowRight size={16}/>
              </Link>
            </div>
          </div>
        </section>
      )}

      {}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaBannerInner}>
          <h2>¿Listo para cuidar tu salud?</h2>
          <p>Únete a miles de pacientes que ya gestionan sus citas digitalmente.</p>
          <Link to="/register" className={styles.ctaPrimaryLg}>
            Crear cuenta gratuita <ArrowRight size={18}/>
          </Link>
        </div>
      </section>

      {}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span>🏥</span><strong>MediConnect</strong>
            <p>Plataforma de gestión de citas médicas.</p>
          </div>
          <div className={styles.footerLinks}>
            <Link to="/login">Iniciar sesión</Link>
            <Link to="/register">Registrarse</Link>
            <Link to="/setup-admin">Configurar admin</Link>
          </div>
        </div>
        <div className={styles.footerCopy}>
          © {new Date().getFullYear()} MediConnect. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
