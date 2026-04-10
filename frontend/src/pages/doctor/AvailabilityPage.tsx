import React, { useEffect, useState } from 'react';
import { Save, Plus, Trash2, Clock, CheckCircle, Info, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { doctorApi } from '../../api';
import type { Availability } from '../../types';
import styles from './AvailabilityPage.module.scss';

const DAYS = [
  { idx: 1, label: 'Lunes',     short: 'Lun' },
  { idx: 2, label: 'Martes',    short: 'Mar' },
  { idx: 3, label: 'Miércoles', short: 'Mié' },
  { idx: 4, label: 'Jueves',    short: 'Jue' },
  { idx: 5, label: 'Viernes',   short: 'Vie' },
  { idx: 6, label: 'Sábado',    short: 'Sáb' },
  { idx: 0, label: 'Domingo',   short: 'Dom' },
];

const DURATIONS = [
  { value: 15, label: '15 min' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hora' },
];

const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 22; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 22) TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`);
}

interface TimeRange {
  id: string;
  startTime: string;
  endTime: string;
}

interface DayConfig {
  dayOfWeek: number;
  enabled: boolean;
  ranges: TimeRange[];
  slotDuration: number;
}

const countSlots = (ranges: TimeRange[], dur: number): number =>
  ranges.reduce((total, r) => {
    const [sh, sm] = r.startTime.split(':').map(Number);
    const [eh, em] = r.endTime.split(':').map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    return total + Math.max(0, Math.floor(mins / dur));
  }, 0);

const previewSlots = (ranges: TimeRange[], dur: number): string[] => {
  const all: string[] = [];
  ranges.forEach(r => {
    const [sh, sm] = r.startTime.split(':').map(Number);
    const [eh, em] = r.endTime.split(':').map(Number);
    for (let m = sh * 60 + sm; m < eh * 60 + em; m += dur) {
      all.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
    }
  });
  return all;
};

const newRange = (): TimeRange => ({
  id: `r-${Date.now()}-${Math.random()}`,
  startTime: '09:00',
  endTime: '13:00',
});

const defaultDay = (dayOfWeek: number): DayConfig => ({
  dayOfWeek,
  enabled: false,
  ranges: [newRange()],
  slotDuration: 30,
});

const AvailabilityPage: React.FC = () => {
  const [days, setDays]         = useState<DayConfig[]>(DAYS.map(d => defaultDay(d.idx)));
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [activeDay, setActiveDay] = useState<number | null>(1);

  useEffect(() => {
    doctorApi.getMyAvailability()
      .then(res => {
        const existing: Availability[] = res.data.data;
        if (existing.length === 0) return;

        const byDay = new Map<number, Availability[]>();
        existing.forEach(a => {
          if (!byDay.has(a.dayOfWeek)) byDay.set(a.dayOfWeek, []);
          byDay.get(a.dayOfWeek)!.push(a);
        });

        setDays(prev => prev.map(d => {
          const records = byDay.get(d.dayOfWeek);
          if (!records || records.length === 0) return d;
          return {
            dayOfWeek: d.dayOfWeek,
            enabled: records.some(r => r.isActive),
            slotDuration: records[0].slotDuration,
            ranges: records.map(r => ({
              id: `r-${r._id || Date.now()}`,
              startTime: r.startTime,
              endTime: r.endTime,
            })),
          };
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleDay = (dow: number) => {
    setDays(prev => prev.map(d =>
      d.dayOfWeek === dow ? { ...d, enabled: !d.enabled } : d
    ));
    setActiveDay(dow);
  };

  const updateRange = (dow: number, id: string, field: 'startTime' | 'endTime', val: string) => {
    setDays(prev => prev.map(d =>
      d.dayOfWeek !== dow ? d : {
        ...d,
        ranges: d.ranges.map(r => r.id === id ? { ...r, [field]: val } : r),
      }
    ));
  };

  const addRange = (dow: number) => {
    setDays(prev => prev.map(d =>
      d.dayOfWeek !== dow ? d : { ...d, ranges: [...d.ranges, newRange()] }
    ));
  };

  const removeRange = (dow: number, id: string) => {
    setDays(prev => prev.map(d =>
      d.dayOfWeek !== dow ? d : {
        ...d,
        ranges: d.ranges.length > 1 ? d.ranges.filter(r => r.id !== id) : d.ranges,
      }
    ));
  };

  const updateDuration = (dow: number, val: number) => {
    setDays(prev => prev.map(d =>
      d.dayOfWeek === dow ? { ...d, slotDuration: val } : d
    ));
  };

  const copyToAll = (sourceDow: number) => {
    const src = days.find(d => d.dayOfWeek === sourceDow);
    if (!src) return;
    setDays(prev => prev.map(d =>
      !d.enabled || d.dayOfWeek === sourceDow ? d : {
        ...d,
        slotDuration: src.slotDuration,
        ranges: src.ranges.map(r => ({ ...r, id: `r-${Date.now()}-${Math.random()}` })),
      }
    ));
    toast.success('Horario copiado a todos los días activos');
  };

  const handleSave = async () => {
    for (const d of days.filter(d => d.enabled)) {
      const label = DAYS.find(x => x.idx === d.dayOfWeek)?.label;
      for (const r of d.ranges) {
        const [sh, sm] = r.startTime.split(':').map(Number);
        const [eh, em] = r.endTime.split(':').map(Number);
        if (sh * 60 + sm >= eh * 60 + em) {
          toast.error(`${label}: la hora de fin debe ser después de la de inicio`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const slots = days
        .filter(d => d.enabled)
        .flatMap(d =>
          d.ranges.map(r => ({
            dayOfWeek:    d.dayOfWeek,
            startTime:    r.startTime,
            endTime:      r.endTime,
            slotDuration: d.slotDuration,
          }))
        );
      await doctorApi.setAvailability(slots);
      toast.success('✅ Disponibilidad guardada');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const activeDayData = days.find(d => d.dayOfWeek === activeDay);
  const enabledCount  = days.filter(d => d.enabled).length;

  if (loading) return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />
        ))}
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1>Disponibilidad</h1>
            <p>Define los días y rangos de horario en los que recibes pacientes</p>
          </div>
          <Button icon={<Save size={16} />} loading={saving} onClick={handleSave} size="lg">
            Guardar cambios
          </Button>
        </div>

        <div className={styles.info}>
          <Info size={15} />
          <span>Puedes agregar <strong>múltiples rangos por día</strong> (ej: 9:00–13:00 y 15:00–18:00) para manejar pausas del mediodía u otros descansos.</span>
        </div>

        <div className={styles.layout}>
          {/* Day list */}
          <div className={styles.dayList}>
            <div className={styles.dayListHeader}>
              <span>Días de atención</span>
              <span className={styles.enabledBadge}>{enabledCount} activos</span>
            </div>
            {DAYS.map(day => {
              const d = days.find(x => x.dayOfWeek === day.idx)!;
              const slots = d.enabled ? countSlots(d.ranges, d.slotDuration) : 0;
              const isActive = activeDay === day.idx;

              return (
                <div
                  key={day.idx}
                  className={[
                    styles.dayCard,
                    d.enabled  ? styles['dayCard--on']  : styles['dayCard--off'],
                    isActive   ? styles['dayCard--selected'] : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setActiveDay(day.idx)}
                >
                  <div className={styles.dayCardTop}>
                    <button
                      className={[styles.toggle, d.enabled ? styles['toggle--on'] : ''].join(' ')}
                      onClick={e => { e.stopPropagation(); toggleDay(day.idx); }}
                    >
                      <span className={styles.toggleKnob} />
                    </button>
                    <div className={styles.dayName}>
                      <strong>{day.label}</strong>
                      {d.enabled
                        ? <span>{d.ranges.length} rango{d.ranges.length > 1 ? 's' : ''} · {slots} slots</span>
                        : <span>No disponible</span>
                      }
                    </div>
                    {d.enabled && <CheckCircle size={14} className={styles.checkIcon} />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Editor */}
          <div className={styles.editor}>
            {!activeDayData ? (
              <Card>
                <div className={styles.noDay}><Clock size={40} /><p>Selecciona un día</p></div>
              </Card>
            ) : (
              <>
                <Card>
                  <div className={styles.editorHeader}>
                    <h3>{DAYS.find(d => d.idx === activeDay)?.label}</h3>
                    {activeDayData.enabled && (
                      <Button size="sm" variant="secondary" onClick={() => copyToAll(activeDay!)}>
                        <Copy size={13} /> Copiar a todos
                      </Button>
                    )}
                  </div>

                  {!activeDayData.enabled ? (
                    <div className={styles.disabledMsg}>
                      <p>Activa este día con el interruptor para configurarlo.</p>
                      <Button variant="secondary" icon={<Plus size={15} />} onClick={() => {
                        setDays(prev => prev.map(d => d.dayOfWeek === activeDay ? { ...d, enabled: true } : d));
                      }}>
                        Habilitar {DAYS.find(d => d.idx === activeDay)?.label}
                      </Button>
                    </div>
                  ) : (
                    <div className={styles.controls}>
                      {/* Duration selector */}
                      <div className={styles.durationField}>
                        <label>Duración por consulta</label>
                        <div className={styles.durationPills}>
                          {DURATIONS.map(dur => (
                            <button
                              key={dur.value}
                              type="button"
                              className={[
                                styles.durationPill,
                                activeDayData.slotDuration === dur.value ? styles['durationPill--active'] : '',
                              ].join(' ')}
                              onClick={() => updateDuration(activeDay!, dur.value)}
                            >
                              {dur.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Time ranges */}
                      <div className={styles.rangesSection}>
                        <div className={styles.rangesHeader}>
                          <label>Rangos de horario</label>
                          <Button size="sm" variant="secondary" icon={<Plus size={14} />}
                            onClick={() => addRange(activeDay!)}>
                            Agregar rango
                          </Button>
                        </div>

                        {activeDayData.ranges.map((range, idx) => {
                          const [sh, sm] = range.startTime.split(':').map(Number);
                          const [eh, em] = range.endTime.split(':').map(Number);
                          const valid = (eh * 60 + em) > (sh * 60 + sm);
                          const rangeSlots = valid
                            ? Math.floor(((eh * 60 + em) - (sh * 60 + sm)) / activeDayData.slotDuration)
                            : 0;

                          return (
                            <div key={range.id} className={styles.rangeRow}>
                              <div className={styles.rangeIndex}>{idx + 1}</div>

                              <div className={styles.timeField}>
                                <label>Inicio</label>
                                <select
                                  value={range.startTime}
                                  onChange={e => updateRange(activeDay!, range.id, 'startTime', e.target.value)}
                                  className={styles.timeSelect}
                                >
                                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </div>

                              <span className={styles.timeSep}>→</span>

                              <div className={styles.timeField}>
                                <label>Fin</label>
                                <select
                                  value={range.endTime}
                                  onChange={e => updateRange(activeDay!, range.id, 'endTime', e.target.value)}
                                  className={styles.timeSelect}
                                >
                                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </div>

                              <div className={styles.rangeInfo}>
                                {valid
                                  ? <span className={styles.rangeSlots}>{rangeSlots} slots</span>
                                  : <span className={styles.rangeError}>⚠ Inválido</span>
                                }
                              </div>

                              <button
                                className={styles.removeRange}
                                onClick={() => removeRange(activeDay!, range.id)}
                                disabled={activeDayData.ranges.length === 1}
                                title="Eliminar rango"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          );
                        })}

                        {activeDayData.ranges.length > 1 && (
                          <p className={styles.rangeHint}>
                            💡 Los rangos no deben sobreponerse. Los huecos entre rangos son los descansos.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </Card>

                {/* Slot preview */}
                {activeDayData.enabled && (
                  <Card>
                    <div className={styles.previewHeader}>
                      <h4>Vista previa de slots</h4>
                      <span className={styles.slotCount}>
                        {previewSlots(activeDayData.ranges, activeDayData.slotDuration).length} citas disponibles
                      </span>
                    </div>
                    <div className={styles.slotsGrid}>
                      {previewSlots(activeDayData.ranges, activeDayData.slotDuration).map(t => (
                        <div key={t} className={styles.slotChip}>{t}</div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>

        {/* Weekly summary */}
        <Card>
          <h3 className={styles.summaryTitle}>Resumen semanal</h3>
          <div className={styles.summaryGrid}>
            {DAYS.map(day => {
              const d = days.find(x => x.dayOfWeek === day.idx)!;
              const slots = d.enabled ? countSlots(d.ranges, d.slotDuration) : 0;
              return (
                <div
                  key={day.idx}
                  className={[styles.summaryDay, d.enabled ? styles['summaryDay--on'] : ''].join(' ')}
                  onClick={() => setActiveDay(day.idx)}
                >
                  <span className={styles.summaryShort}>{day.short}</span>
                  {d.enabled ? (
                    <>
                      {d.ranges.map((r, i) => (
                        <span key={i} className={styles.summaryRange}>{r.startTime}–{r.endTime}</span>
                      ))}
                      <span className={styles.summarySlots}>{slots} slots</span>
                    </>
                  ) : (
                    <span className={styles.summaryOff}>Cerrado</span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AvailabilityPage;