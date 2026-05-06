import React, { useState, useEffect, useMemo } from 'react';
import { Pill, Clock, Calendar, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { differenceInDays, parseISO, addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { recordApi } from '../../api';
import styles from './MedicationsPage.module.scss';

interface ActiveMed {
  recordId: string;
  recordDate: string;
  doctorName: string;
  diagnosis: string;
  name: string;
  doseLabel: string;
  pillsPerDay: number;
  frequencyHours: number;
  durationDays: number;
  startDate: string;
  endDate: Date;
  daysLeft: number;
  totalDays: number;
  progressPct: number;   
  expired: boolean;
}

const frequencyLabel = (h: number): string => {
  if (h === 24) return 'Una vez al día';
  if (h === 12) return 'Cada 12h (dos veces)';
  if (h === 8)  return 'Cada 8h (tres veces)';
  if (h === 6)  return 'Cada 6h (cuatro veces)';
  return `Cada ${h} horas`;
};

const MedicationsPage: React.FC = () => {
  const [allMeds,  setAllMeds]  = useState<ActiveMed[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showDone, setShowDone] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const pages = await Promise.all([
          recordApi.getMy(1).catch(() => null),
          recordApi.getMy(2).catch(() => null),
          recordApi.getMy(3).catch(() => null),
        ]);

        const records: any[] = [];
        pages.forEach(p => { if (p?.data?.data) records.push(...p.data.data); });

        const today = new Date();
        const extracted: ActiveMed[] = [];

        records.forEach((rec: any) => {
          if (!rec.medications || rec.medications.length === 0) return;

          const doctorName = rec.doctorId?.userId?.name || 'Tu doctor';
          const recDate    = rec.createdAt;
          const diagnosis  = rec.diagnosis || '';

          rec.medications.forEach((m: any) => {
            const startDate = m.startDate ? parseISO(m.startDate) : parseISO(recDate);
            const endDate   = addDays(startDate, m.durationDays);
            const daysLeft  = Math.max(0, differenceInDays(endDate, today));
            const elapsed   = m.durationDays - daysLeft;
            const progressPct = Math.min(100, Math.round((elapsed / m.durationDays) * 100));
            const expired   = today > endDate;

            extracted.push({
              recordId:      rec._id,
              recordDate:    recDate,
              doctorName,
              diagnosis,
              name:          m.name,
              doseLabel:     m.doseLabel,
              pillsPerDay:   m.pillsPerDay,
              frequencyHours:m.frequencyHours,
              durationDays:  m.durationDays,
              startDate:     startDate.toISOString(),
              endDate,
              daysLeft,
              totalDays:     m.durationDays,
              progressPct,
              expired,
            });
          });
        });

        extracted.sort((a, b) => {
          if (a.expired !== b.expired) return a.expired ? 1 : -1;
          return a.daysLeft - b.daysLeft;
        });

        setAllMeds(extracted);
      } catch (err) {
        console.error('Error loading medications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const activeMeds  = useMemo(() => allMeds.filter(m => !m.expired), [allMeds]);
  const expiredMeds = useMemo(() => allMeds.filter(m => m.expired),  [allMeds]);

  const MedCard = ({ med }: { med: ActiveMed }) => {
    const urgency = med.daysLeft <= 1 ? 'urgent' : med.daysLeft <= 3 ? 'warning' : 'normal';

    return (
      <div className={[styles.medCard, styles[`medCard--${urgency}`], med.expired ? styles['medCard--expired'] : ''].join(' ')}>
        {/* Header */}
        <div className={styles.medHeader}>
          <div className={styles.medIcon}>
            <Pill size={20} />
          </div>
          <div className={styles.medInfo}>
            <h3 className={styles.medName}>{med.name}</h3>
            <span className={styles.medDose}>{med.doseLabel}</span>
          </div>
          {med.expired ? (
            <span className={styles.expiredBadge}><CheckCircle size={14} /> Completado</span>
          ) : med.daysLeft === 0 ? (
            <span className={styles.todayBadge}><AlertCircle size={14} /> Último día</span>
          ) : med.daysLeft <= 3 ? (
            <span className={styles.urgentBadge}><AlertCircle size={14} /> {med.daysLeft} día{med.daysLeft > 1 ? 's' : ''}</span>
          ) : (
            <span className={styles.daysLeftBadge}><Calendar size={14} /> {med.daysLeft} días</span>
          )}
        </div>

        {/* Details grid */}
        <div className={styles.medDetails}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Pastillas al día</span>
            <span className={styles.detailValue}>{med.pillsPerDay}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Frecuencia</span>
            <span className={styles.detailValue}>{frequencyLabel(med.frequencyHours)}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Duración total</span>
            <span className={styles.detailValue}>{med.totalDays} días</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Fecha fin</span>
            <span className={styles.detailValue}>
              {format(med.endDate, "d 'de' MMMM", { locale: es })}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        {!med.expired && (
          <div className={styles.progressWrap}>
            <div className={styles.progressTrack}>
              <div
                className={[styles.progressFill, styles[`progressFill--${urgency}`]].join(' ')}
                style={{ width: `${med.progressPct}%` }}
              />
            </div>
            <span className={styles.progressLabel}>
              {med.progressPct}% completado · {med.daysLeft} día{med.daysLeft !== 1 ? 's' : ''} restante{med.daysLeft !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Next dose hint */}
        {!med.expired && (
          <div className={styles.nextDose}>
            <Clock size={13} />
            <span>
              Tomar {med.pillsPerDay} pastilla{med.pillsPerDay > 1 ? 's' : ''} · {frequencyLabel(med.frequencyHours).toLowerCase()}
            </span>
          </div>
        )}

        {/* Meta */}
        <div className={styles.medMeta}>
          <span>Recetado por <strong>{med.doctorName}</strong></span>
          {med.diagnosis && <span>Dx: {med.diagnosis}</span>}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className={styles.page}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1>Mis Medicamentos</h1>
            <p>Seguimiento de tu tratamiento activo con días restantes actualizados</p>
          </div>
          {activeMeds.length > 0 && (
            <div className={styles.summaryBadge}>
              <Pill size={16} />
              <span>{activeMeds.length} activo{activeMeds.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {loading ? (
          <Spinner size="md" label="Cargando medicamentos…" />
        ) : allMeds.length === 0 ? (
          /* Empty state — no records with medications */
          <Card>
            <div className={styles.empty}>
              <Pill size={48} strokeWidth={1} />
              <h3>Sin medicamentos recetados</h3>
              <p>
                Cuando tu doctor cree un expediente médico con tu receta,
                tus medicamentos aparecerán aquí con días restantes y frecuencia.
              </p>
              <Link to="/patient/records" className={styles.recordsLink}>
                <FileText size={14} /> Ver historial médico
              </Link>
            </div>
          </Card>
        ) : (
          <>
            {/* Active medications */}
            {activeMeds.length > 0 ? (
              <section>
                <h2 className={styles.sectionTitle}>
                  💊 Tratamiento activo
                  <span className={styles.sectionCount}>{activeMeds.length}</span>
                </h2>
                <div className={styles.grid}>
                  {activeMeds.map((m, i) => <MedCard key={`${m.recordId}-${i}`} med={m} />)}
                </div>
              </section>
            ) : (
              <Card>
                <div className={styles.noActive}>
                  <CheckCircle size={32} />
                  <p>No tienes tratamientos activos en este momento.</p>
                </div>
              </Card>
            )}

            {/* Expired / completed */}
            {expiredMeds.length > 0 && (
              <section>
                <button
                  className={styles.showDoneBtn}
                  onClick={() => setShowDone(p => !p)}
                >
                  {showDone ? '▲' : '▼'} Tratamientos completados ({expiredMeds.length})
                </button>
                {showDone && (
                  <div className={styles.grid}>
                    {expiredMeds.map((m, i) => <MedCard key={`${m.recordId}-done-${i}`} med={m} />)}
                  </div>
                )}
              </section>
            )}

            {/* Disclaimer */}
            <div className={styles.disclaimer}>
              <AlertCircle size={14} />
              <span>
                <strong>Aviso médico:</strong> No suspendas ni modifiques tu tratamiento
                sin consultar a tu médico. Esta pantalla es solo informativa.
              </span>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MedicationsPage;
