import React, { useEffect, useState } from 'react';
import { CheckCircle, Star, Zap, Shield, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { paymentApi } from '../../api';
import styles from './SubscriptionPage.module.scss';

interface SubStatus { isSubscribed: boolean; isFeatured: boolean; subscriptionExpiresAt?: string; }

const FEATURES_FREE = [
  'Perfil básico en el directorio',
  'Hasta 20 citas por mes',
  'Chat con pacientes',
  'Calendario de disponibilidad',
];

const FEATURES_PRO = [
  'Todo lo del plan gratuito',
  'Perfil destacado en búsquedas ⭐',
  'Citas ilimitadas',
  'Videollamadas HD con pacientes',
  'Mayor almacenamiento para expedientes',
  'Estadísticas avanzadas',
  'Soporte prioritario',
];

const SubscriptionPage: React.FC = () => {
  const [status, setStatus] = useState<SubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    paymentApi.getStatus()
      .then(r => setStatus(r.data.doctor))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async () => {
    setCheckingOut(true);
    try {
      const res = await paymentApi.createCheckout();
      window.location.href = res.data.url;
    } catch {
      toast.error('Error al iniciar el pago');
      setCheckingOut(false);
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[...Array(2)].map((_, i) => <div key={i} className="skeleton" style={{ height: 300, borderRadius: 16 }} />)}
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1>Suscripción</h1>
          <p>Lleva tu práctica médica al siguiente nivel</p>
        </div>

        {/* Current status */}
        {status?.isSubscribed && (
          <div className={styles.activeAlert}>
            <CheckCircle size={20} />
            <div>
              <strong>Plan Pro Activo ✨</strong>
              <p>Tu suscripción está activa
                {status.subscriptionExpiresAt && ` hasta el ${format(parseISO(status.subscriptionExpiresAt), "d 'de' MMMM yyyy", { locale: es })}`}.
              </p>
            </div>
          </div>
        )}

        {/* Plans */}
        <div className={styles.plans}>
          {/* Free plan */}
          <Card padding="lg" className={styles.planCard}>
            <div className={styles.planHeader}>
              <div className={styles.planIconWrap} data-color="gray"><Shield size={24} /></div>
              <h2>Plan Gratuito</h2>
              <div className={styles.price}><span className={styles.priceAmount}>$0</span><span className={styles.pricePer}>/mes</span></div>
              {!status?.isSubscribed && (
                <div className={styles.currentBadge}>Plan actual</div>
              )}
            </div>
            <ul className={styles.features}>
              {FEATURES_FREE.map(f => (
                <li key={f}><CheckCircle size={15} /> {f}</li>
              ))}
            </ul>
          </Card>

          {/* Pro plan */}
          <Card padding="lg" className={[styles.planCard, styles['planCard--pro']].join(' ')}>
            <div className={styles.proBadge}><Star size={13} /> Recomendado</div>
            <div className={styles.planHeader}>
              <div className={styles.planIconWrap} data-color="green"><Zap size={24} /></div>
              <h2>Plan Pro</h2>
              <div className={styles.price}>
                <span className={styles.priceAmount}>$299</span>
                <span className={styles.pricePer}>/mes MXN</span>
              </div>
            </div>
            <ul className={styles.features}>
              {FEATURES_PRO.map(f => (
                <li key={f} className={styles['features--pro']}><CheckCircle size={15} /> {f}</li>
              ))}
            </ul>
            {status?.isSubscribed ? (
              <div className={styles.activeCheck}><CheckCircle size={18} /> Activo</div>
            ) : (
              <Button fullWidth size="lg" loading={checkingOut} icon={<TrendingUp size={16} />} onClick={handleSubscribe}>
                Suscribirse ahora
              </Button>
            )}
          </Card>
        </div>

        {/* Benefits breakdown */}
        <Card>
          <h3 className={styles.benefitsTitle}>¿Por qué suscribirse?</h3>
          <div className={styles.benefitsGrid}>
            {[
              { icon: '⭐', title: 'Destacado en búsquedas', desc: 'Tu perfil aparece primero cuando los pacientes buscan tu especialidad.' },
              { icon: '📈', title: 'Más pacientes', desc: 'Los médicos con plan Pro reciben en promedio 3x más consultas.' },
              { icon: '📹', title: 'Videollamadas HD', desc: 'Atiende a tus pacientes donde sea con videollamadas de alta calidad.' },
              { icon: '🗄️', title: 'Más almacenamiento', desc: 'Guarda ilimitados expedientes, recetas y estudios de tus pacientes.' },
            ].map(b => (
              <div key={b.title} className={styles.benefit}>
                <span className={styles.benefitIcon}>{b.icon}</span>
                <div>
                  <strong>{b.title}</strong>
                  <p>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SubscriptionPage;