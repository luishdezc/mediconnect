import React, { useEffect, useState } from 'react';
import { resolveAvatar } from '../../utils/avatar';
import { format, getDay, parseISO, isToday, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, Video, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../ui/Card';
import Button from '../ui/Button';
import { appointmentApi, doctorApi } from '../../api';
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

  useEffect(() => {
    doctorApi.getById(doctor._id)
      .then(r => setAvailability(r.data.availability || []))
      .catch(() => {})
      .finally(() => setLoadingAvail(false));
  }, [doctor._id]);

  const activeDays = new Set(availability.filter(a => a.isActive).map(a => a.dayOfWeek));

  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setSelectedSlot('');
    setSlots([]);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    appointmentApi.getSlots(doctor._id, dateStr)
      .then(r => setSlots(r.data.data))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, doctor._id]);

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

  const availableSlots = slots.filter(s => s.available);
  const takenSlots     = slots.filter(s => !s.available);

  const handleBook = async () => {
    if (!selectedSlot) { toast.error('Selecciona un horario'); return; }
    setLoading(true);
    try {
      await appointmentApi.create({
        doctorId: doctor._id,
        appointmentDate: selectedSlot,
        type,
        reason: reason.trim() || undefined,
      });
      toast.success('¡Cita agendada! Recibirás un correo de confirmación.');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al agendar cita');
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
                  <span>{availableSlots.length} disponibles · {takenSlots.length} ocupados</span>
                </div>
                <div className={styles.slotsGrid}>
                  {slots.map(slot => {
                    const isSelected = selectedSlot === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        className={[
                          styles.slot,
                          !slot.available ? styles['slot--taken']    : '',
                          isSelected      ? styles['slot--selected'] : '',
                        ].filter(Boolean).join(' ')}
                        onClick={() => slot.available && setSelectedSlot(slot.time)}
                        title={!slot.available ? 'Horario ocupado' : ''}
                      >
                        {format(parseISO(slot.time), 'HH:mm')}
                        {!slot.available && <span className={styles.slotTakenDot}/>}
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
