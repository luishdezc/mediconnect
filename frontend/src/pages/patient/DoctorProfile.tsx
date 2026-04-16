import React, { useEffect, useState } from 'react';
import { resolveAvatar } from '../../utils/avatar';
import { useParams, useNavigate , Link } from 'react-router-dom';
import {
  MapPin, Star, Clock, Globe, Phone, ArrowLeft,
  Calendar, Video, Building2, BadgeCheck, MessageCircle, MessageSquare,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { doctorApi, reviewApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import type { Doctor, Availability } from '../../types';
import BookAppointmentModal from '../../components/patient/BookAppointmentModal';
import Pagination from '../../components/ui/Pagination';
import StarRating from '../../components/ui/StarRating';
import styles from './DoctorProfile.module.scss';

const DAY_NAMES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

const DoctorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [doctor, setDoctor]           = useState<Doctor | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading]         = useState(true);
  const [booking, setBooking]         = useState(false);
  const [reviews, setReviews]           = useState<any[]>([]);
  const [reviewsPag, setReviewsPag]     = useState<any>(null);
  const [reviewsPage, setReviewsPage]   = useState(1);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    if (!id) return;
    doctorApi.getById(id)
      .then(r => {
        setDoctor(r.data.doctor);
        setAvailability(r.data.availability);
      })
      .catch(() => navigate(-1))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoadingReviews(true);
    reviewApi.getForDoctor(id, reviewsPage)
      .then(r => { setReviews(r.data.data); setReviewsPag(r.data.pagination); })
      .catch(() => {})
      .finally(() => setLoadingReviews(false));
  }, [id, reviewsPage]);

  if (loading) return (
    <DashboardLayout>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {[...Array(3)].map((_,i) => <div key={i} className="skeleton" style={{ height:140, borderRadius:12 }} />)}
      </div>
    </DashboardLayout>
  );

  if (!doctor) return null;
  const docUser = doctor.userId as any;
  const activeDays = availability.filter(a => a.isActive).sort((a,b) => a.dayOfWeek - b.dayOfWeek);

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={16}/> Regresar
        </button>

        {}
        <Card padding="none">
          <div className={styles.hero}>
            <div className={styles.heroLeft}>
              <div className={styles.avatar}>
                {docUser?.avatar
                  ? <img src={resolveAvatar(docUser.avatar)} alt={docUser.name}/>
                  : <span>{docUser?.name?.[0]?.toUpperCase()}</span>}
                {doctor.isVerified && (
                  <div className={styles.verifiedBadge} title="Doctor verificado">
                    <BadgeCheck size={14}/>
                  </div>
                )}
              </div>
              <div className={styles.heroInfo}>
                <div className={styles.nameRow}>
                  <h1>{docUser?.name}</h1>
                  {doctor.isFeatured && <span className={styles.featuredTag}>⭐ Destacado</span>}
                </div>
                <p className={styles.spec}>{doctor.specialization}</p>
                <div className={styles.metaRow}>
                  {doctor.experience && (
                    <span><Clock size={13}/> {doctor.experience} años de experiencia</span>
                  )}
                  {doctor.locationAddress && (
                    <span><MapPin size={13}/> {doctor.locationAddress}</span>
                  )}
                  {doctor.phone && (
                    <span><Phone size={13}/> {doctor.phone}</span>
                  )}
                </div>
                <div className={styles.ratingRow}>
                  {[1,2,3,4,5].map(s => (
                    <Star
                      key={s}
                      size={16}
                      fill={s <= Math.round(doctor.rating || 0) ? '#f0b96a' : 'none'}
                      stroke="#f0b96a"
                    />
                  ))}
                  <span className={styles.ratingNum}>{(doctor.rating || 0).toFixed(1)}</span>
                  <span className={styles.ratingCount}>({doctor.totalReviews || 0} reseñas)</span>
                </div>
              </div>
            </div>
            {user?.role === 'patient' && (
              <div className={styles.heroActions}>
                {doctor.hourlyRate && (
                  <p className={styles.price}>💰 ${doctor.hourlyRate} <span>MXN / consulta</span></p>
                )}
                <Button size="lg" icon={<Calendar size={16}/>} onClick={() => setBooking(true)} fullWidth>
                  Agendar Cita
                </Button>
                <Link to={`/patient/chat?doctorId=${doctor._id}`} style={{ display:'block' }}>
                  <Button size="md" variant="secondary" icon={<MessageSquare size={16}/>} fullWidth>
                    Enviar mensaje
                  </Button>
                </Link>
                <div className={styles.modeTags}>
                  <span><Building2 size={13}/> Presencial</span>
                  <span><Video size={13}/> Videollamada</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className={styles.grid}>
          {}
          <div className={styles.leftCol}>
            {}
            {doctor.bio && (
              <Card>
                <h3 className={styles.cardTitle}>Acerca del doctor</h3>
                <p className={styles.bio}>{doctor.bio}</p>
              </Card>
            )}

            {}
            {(doctor.languages?.length ?? 0) > 0 && (
              <Card>
                <h3 className={styles.cardTitle}><Globe size={15}/> Idiomas</h3>
                <div className={styles.tagCloud}>
                  {doctor.languages!.map(l => (
                    <span key={l} className={styles.tag}>{l}</span>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {}
          <div className={styles.rightCol}>
            {}
            <Card>
              <h3 className={styles.cardTitle}><Calendar size={15}/> Horario de atención</h3>
              {activeDays.length === 0 ? (
                <p className={styles.noSchedule}>Sin horarios configurados aún.</p>
              ) : (
                <div className={styles.scheduleList}>
                  {activeDays.map(av => (
                    <div key={av._id} className={styles.scheduleRow}>
                      <span className={styles.scheduleDay}>{DAY_NAMES[av.dayOfWeek]}</span>
                      <span className={styles.scheduleTime}>{av.startTime} – {av.endTime}</span>
                      <span className={styles.scheduleDur}>
                        {Math.floor((
                          (parseInt(av.endTime.split(':')[0])*60 + parseInt(av.endTime.split(':')[1])) -
                          (parseInt(av.startTime.split(':')[0])*60 + parseInt(av.startTime.split(':')[1]))
                        ) / av.slotDuration)} citas disponibles
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

  
          {}
          <Card>
            <h3 className={styles.cardTitle}><MessageCircle size={15}/> Reseñas de pacientes</h3>
            {loadingReviews ? (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[...Array(3)].map((_,i) => <div key={i} className="skeleton" style={{ height:80, borderRadius:10 }} />)}
              </div>
            ) : reviews.length === 0 ? (
              <p className={styles.noSchedule}>Sin reseñas todavía. ¡Sé el primero!</p>
            ) : (
              <div className={styles.reviewsList}>
                {reviews.map((r: any) => {
                  const patUser = r.patientId?.userId;
                  return (
                    <div key={r._id} className={styles.reviewItem}>
                      <div className={styles.reviewHeader}>
                        <div className={styles.reviewAvatar}>
                          {patUser?.name?.[0]?.toUpperCase()}
                        </div>
                        <div className={styles.reviewMeta}>
                          <strong>{patUser?.name || 'Paciente'}</strong>
                          <StarRating value={r.rating} readonly size={14} />
                        </div>
                        <span className={styles.reviewDate}>
                          {new Date(r.createdAt).toLocaleDateString('es-MX', { day:'numeric', month:'short', year:'numeric' })}
                        </span>
                      </div>
                      {r.comment && <p className={styles.reviewComment}>{r.comment}</p>}
                    </div>
                  );
                })}
              </div>
            )}
            {reviewsPag && reviewsPag.totalPages > 1 && (
              <div style={{ marginTop:16 }}>
                <Pagination pagination={{ ...reviewsPag, page: reviewsPage }} onPageChange={setReviewsPage} />
              </div>
            )}
          </Card>

          {}
            {doctor.locationLat && doctor.locationLng && (
              <Card>
                <h3 className={styles.cardTitle}><MapPin size={15}/> Ubicación</h3>
                <a
                  href={`https://maps.google.com/?q=${doctor.locationLat},${doctor.locationLng}`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.mapLink}
                >
                  <div className={styles.mapPreview}>
                    🗺️ Ver en Google Maps
                    <span>{doctor.locationAddress}</span>
                  </div>
                </a>
              </Card>
            )}
          </div>
        </div>
      </div>

      {booking && doctor && (
        <BookAppointmentModal
          doctor={doctor}
          onClose={() => setBooking(false)}
          onSuccess={() => { setBooking(false); navigate('/patient/appointments'); }}
        />
      )}
    </DashboardLayout>
  );
};

export default DoctorProfile;