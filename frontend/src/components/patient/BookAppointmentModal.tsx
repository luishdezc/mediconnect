import React, { useEffect, useRef, useState } from 'react';
import { resolveAvatar } from '../../utils/avatar';
import { format, getDay, parseISO, isToday, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, Video, Building2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../ui/Card';
import Button from '../ui/Button';
import { appointmentApi, doctorApi } from '../../api';
import { socketService } from '../../services/socketService';
import type { Doctor, TimeSlot, Availability } from '../../types';
import styles from './BookAppointmentModal.module.scss';

interface Props {
  doctor: Doctor;
  onClose: () => void;
  onSuccess: () => void;
}

const DAY_NAMES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const BookAppointmentModal: React.FC<Props> = ({ doctor, onClose, onSuccess }) => {
  const docUser = doctor.userId as any;
  const [availability, setAvailability]   = useState<Availability[]>([]);
  const [calendarDate, setCalendarDate]   = useState(new Date());     // month being viewed
  const [selectedDate, setSelectedDate]   = useState<Date | null>(null);
  const [slots, setSlots]                 = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot]   = useState<string>('');
  const [type, setType]                   = useState<'in_person' | 'video'>('in_person');
  const [reason, setReason]               = useState('');
  const [loading, setLoading]             = useState(false);
  const [loadingSlots, setLoadingSlots]   = useState(false);
  const [loadingAvail, setLoadingAvail]   = useState(true);
  // Ticks every 30s so slots whose time has passed get marked as taken
  // without a server round-trip.
  const [now, setNow]                     = useState<Date>(new Date());

  // Keep the latest selected slot in a ref so the socket handler can read it
  // without re-subscribing on every state change.
  const selectedSlotRef = useRef(selectedSlot);
  useEffect(() => { selectedSlotRef.current = selectedSlot; }, [selectedSlot]);

  // When WE just successfully booked, the backend also broadcasts a
  // slots:invalidate that we receive back. Without this guard, our own
  // booking would trigger the "your slot got taken" toast simultaneously
  // with the success toast. We track our own bookings here and skip the
  // matching invalidation.
  const ownBookingsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    doctorApi.getById(doctor._id)
      .then(r => setAvailability(r.data.availability || []))
      .catch(() => {})
      .finally(() => setLoadingAvail(false));
  }, [doctor._id]);

  const activeDays = new Set(availability.filter(a => a.isActive).map(a => a.dayOfWeek));

  // Re-fetch slots — extracted so we can call it both on date-change and
  // on socket invalidations.
  const fetchSlots = (silent = false) => {
    if (!selectedDate) return;
    if (!silent) setLoadingSlots(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    appointmentApi.getSlots(doctor._id, dateStr)
      .then(r => {
        const fresh: TimeSlot[] = r.data.data;
        setSlots(fresh);
        // If the user had a slot selected and it's no longer available,
        // clear the selection and let them know.
        const stillSelected = selectedSlotRef.current;
        if (stillSelected) {
          const match = fresh.find(s => s.time === stillSelected);
          if (match && !match.available) {
            setSelectedSlot('');
            toast.error('El horario que habías elegido ya fue ocupado. Elige otro.');
          }
        }
      })
      .catch(() => { if (!silent) setSlots([]); })
      .finally(() => { if (!silent) setLoadingSlots(false); });
  };

  useEffect(() => {
    if (!selectedDate) return;
    setSelectedSlot('');
    setSlots([]);
    fetchSlots(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, doctor._id]);

  // Tick the clock every 30s so past-time slots gray out live, without
  // hitting the server.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  // Subscribe to slot invalidations for this doctor. When anyone books or
  // cancels an appointment with this doctor, the backend emits
  // `slots:invalidate` and we silently refetch.
  useEffect(() => {
    socketService.emit('join:doctor-slots', doctor._id);

    const handleInvalidate = (data: { doctorId: string; appointmentDate?: string }) => {
      if (data?.doctorId !== doctor._id) return;
      if (!selectedDate) return;

      // Skip echoes of our own bookings — the success path already handles
      // the UI update via onSuccess().
      if (data.appointmentDate && ownBookingsRef.current.has(data.appointmentDate)) {
        ownBookingsRef.current.delete(data.appointmentDate);
        return;
      }

      fetchSlots(true);
    };

    socketService.on('slots:invalidate', handleInvalidate);

    return () => {
      socketService.off('slots:invalidate', handleInvalidate);
      socketService.emit('leave:doctor-slots', doctor._id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctor._id, selectedDate]);

  const prevMonth = () => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const buildGrid = () => {
    const year  = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const first = new Date(year, month, 1);
    const last  = new Date(year, month + 1, 0);
    const startDow = first.getDay(); 
    const days: (Date | null)[] = Array(startDow).fill(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
    while (days.length % 7 !== 0) days.push(null);
    return days;
  };

  const grid = buildGrid();

  const isDayAvailable = (d: Date) => {
    if (isPast(d) && !isToday(d)) return false;
    return activeDays.has(getDay(d));
  };

  const isSelectedDay = (d: Date) =>
    selectedDate && format(d, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');

  type EffectiveSlot = TimeSlot & { effectiveReason: 'available' | 'taken' | 'past' };

  const effectiveSlots: EffectiveSlot[] = slots.map(s => {
    const slotTime = new Date(s.time).getTime();
    const isInPast = slotTime < now.getTime() + 5 * 60 * 1000;

    // Past always wins — even if backend hadn't realized yet.
    if (isInPast) {
      return { ...s, available: false, effectiveReason: 'past' };
    }

    if (!s.available) {
      // Backend may not send `reason` on older builds; default to 'taken'
      // for any non-past unavailable slot.
      const reason = s.reason === 'past' ? 'past' : 'taken';
      return { ...s, available: false, effectiveReason: reason };
    }

    return { ...s, available: true, effectiveReason: 'available' };
  });

  const availableSlots = effectiveSlots.filter(s => s.available);
  const takenSlots     = effectiveSlots.filter(s => s.effectiveReason === 'taken');
  const pastSlots      = effectiveSlots.filter(s => s.effectiveReason === 'past');

  const handleBook = async () => {
    if (!selectedSlot) { toast.error('Selecciona un horario'); return; }

    // Last-second client-side guard: the slot might have ticked into the past
    // since the user picked it.
    const localDate = new Date(selectedSlot);
    if (localDate.getTime() < Date.now() + 5 * 60 * 1000) {
      toast.error('Esa hora ya pasó. Elige otra.');
      setSelectedSlot('');
      fetchSlots(true);
      return;
    }

    setLoading(true);
    try {
      const appointmentDateISO = localDate.toISOString();

      // Tell the socket handler to ignore the invalidate event that will come
      // back as an echo of our own booking. Otherwise we'd show the success
      // toast AND the "your slot was taken" toast at the same time.
      ownBookingsRef.current.add(appointmentDateISO);

      await appointmentApi.create({
        doctorId: doctor._id,
        appointmentDate: appointmentDateISO,
        type,
        reason: reason.trim() || undefined,
      });
      toast.success('¡Cita agendada! Recibirás un correo de confirmación.');
      onSuccess();
    } catch (err: any) {
      // The booking failed — clear the guard so future invalidations are
      // handled normally.
      ownBookingsRef.current.delete(localDate.toISOString());

      // 409 = the slot was taken between us showing it as free and the
      // user clicking Confirmar. Refresh so the UI catches up.
      if (err.response?.status === 409) {
        toast.error('Ese horario fue tomado mientras lo seleccionabas. Elige otro.');
        setSelectedSlot('');
        fetchSlots(true);
      } else {
        toast.error(err.response?.data?.message || 'Error al agendar cita');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Agendar Cita" size="lg">
      <div className={styles.wrap}>

        {}
        <div className={styles.docBanner}>
          <div className={styles.docAvatar}>
            {docUser?.avatar ? <img src={resolveAvatar(docUser.avatar)} alt="" /> : <span>{docUser?.name?.[0]}</span>}
          </div>
          <div className={styles.docMeta}>
            <strong>{docUser?.name}</strong>
            <span>{doctor.specialization}</span>
            {doctor.hourlyRate && <span className={styles.rate}>💰 ${doctor.hourlyRate} MXN / consulta</span>}
          </div>
          {loadingAvail ? (
            <div className={styles.daysLoading}>Cargando horarios…</div>
          ) : activeDays.size === 0 ? (
            <div className={styles.noAvail}>Sin horarios configurados</div>
          ) : (
            <div className={styles.activeDaysPills}>
              {[1,2,3,4,5,6,0].map(dow => (
                <span
                  key={dow}
                  className={[styles.dayPill, activeDays.has(dow) ? styles['dayPill--on'] : ''].join(' ')}
                >
                  {DAY_NAMES[dow]}
                </span>
              ))}
            </div>
          )}
        </div>

        {}
        <div className={styles.typeRow}>
          <label className={styles.fieldLabel}>Tipo de consulta</label>
          <div className={styles.typeSelector}>
            {([['in_person', <Building2 size={16}/>, 'Presencial'],
               ['video',     <Video size={16}/>,     'Videollamada']] as const).map(([val, icon, lbl]) => (
              <button
                key={val}
                type="button"
                className={[styles.typeBtn, type === val ? styles['typeBtn--active'] : ''].join(' ')}
                onClick={() => setType(val)}
              >
                {icon} {lbl}
              </button>
            ))}
          </div>
        </div>

        {}
        <div className={styles.calSlotGrid}>

          {}
          <div className={styles.calendarWrap}>
            <div className={styles.calHeader}>
              <button className={styles.navBtn} onClick={prevMonth}><ChevronLeft size={16}/></button>
              <span className={styles.calTitle}>
                {MONTH_NAMES[calendarDate.getMonth()]} {calendarDate.getFullYear()}
              </span>
              <button className={styles.navBtn} onClick={nextMonth}><ChevronRight size={16}/></button>
            </div>

            {}
            <div className={styles.calGrid}>
              {DAY_NAMES.map(d => (
                <div key={d} className={styles.calDowHeader}>{d}</div>
              ))}
              {grid.map((d, i) => {
                if (!d) return <div key={i} className={styles.calEmpty}/>;
                const available = isDayAvailable(d);
                const selected  = isSelectedDay(d);
                const past      = isPast(d) && !isToday(d);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={!available}
                    className={[
                      styles.calDay,
                      selected   ? styles['calDay--selected']  : '',
                      available && !selected ? styles['calDay--available'] : '',
                      isToday(d) && !selected ? styles['calDay--today'] : '',
                      past       ? styles['calDay--past']      : '',
                      !available && !past ? styles['calDay--off'] : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => setSelectedDate(d)}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            <div className={styles.calLegend}>
              <span><span className={styles.legendDot} data-type="available"/>Disponible</span>
              <span><span className={styles.legendDot} data-type="off"/>Sin consulta</span>
              <span><span className={styles.legendDot} data-type="selected"/>Seleccionado</span>
            </div>
          </div>

          {}
          <div className={styles.slotsPanel}>
            {!selectedDate ? (
              <div className={styles.noDateMsg}>
                <Calendar size={32}/>
                <p>Selecciona un día en el calendario</p>
              </div>
            ) : loadingSlots ? (
              <div className={styles.slotsLoading}>
                <div className={styles.spinnerSmall}/>
                <span>Cargando horarios…</span>
              </div>
            ) : slots.length === 0 ? (
              <div className={styles.noSlotsMsg}>
                <Clock size={28}/>
                <p>No hay horarios disponibles para este día.</p>
              </div>
            ) : (
              <>
                <div className={styles.slotsPanelHeader}>
                  <strong>{format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}</strong>
                  <span>
                    {availableSlots.length} disponibles
                    {takenSlots.length > 0 && <> · {takenSlots.length} ocupados</>}
                    {pastSlots.length > 0 && <> · {pastSlots.length} ya pasaron</>}
                  </span>
                </div>
                {availableSlots.length === 0 && (
                  <div className={styles.allBookedMsg}>
                    No quedan horarios disponibles para este día.
                  </div>
                )}
                <div className={styles.slotsGrid}>
                  {effectiveSlots.map(slot => {
                    const isSelected = selectedSlot === slot.time;
                    const reasonClass =
                      slot.effectiveReason === 'taken' ? styles['slot--taken'] :
                      slot.effectiveReason === 'past'  ? styles['slot--past']  : '';
                    const title =
                      slot.effectiveReason === 'taken' ? 'Este horario ya fue reservado' :
                      slot.effectiveReason === 'past'  ? 'Esta hora ya pasó' : '';
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        className={[
                          styles.slot,
                          reasonClass,
                          isSelected ? styles['slot--selected'] : '',
                        ].filter(Boolean).join(' ')}
                        onClick={() => slot.available && setSelectedSlot(slot.time)}
                        title={title}
                      >
                        <span className={styles.slotTime}>
                          {format(parseISO(slot.time), 'HH:mm')}
                        </span>
                        {slot.effectiveReason === 'taken' && (
                          <span className={styles.slotBadge}>
                            <X size={10} /> Ocupado
                          </span>
                        )}
                        {slot.effectiveReason === 'past' && (
                          <span className={styles.slotBadge}>Pasó</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {}
        <div>
          <label className={styles.fieldLabel}>
            <span>Motivo de consulta</span>
            <span className={styles.optional}>(opcional)</span>
          </label>
          <textarea
            className={styles.textarea}
            rows={2}
            placeholder="Describe brevemente el motivo de tu consulta…"
            value={reason}
            onChange={e => setReason(e.target.value)}
            maxLength={300}
          />
          <span className={styles.charCount}>{reason.length}/300</span>
        </div>

        {}
        {selectedSlot && (
          <div className={styles.summary}>
            <span>📅</span>
            <div>
              <strong>Cita seleccionada:</strong>
              <span>
                {format(parseISO(selectedSlot), "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })}
                {' · '}{type === 'video' ? '📹 Videollamada' : '🏥 Presencial'}
              </span>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleBook}
            loading={loading}
            disabled={!selectedSlot}
            icon={<Calendar size={15}/>}
          >
            Confirmar Cita
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BookAppointmentModal;