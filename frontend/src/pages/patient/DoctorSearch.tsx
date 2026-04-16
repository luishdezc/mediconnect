import React, { useEffect, useState, useCallback } from 'react';
import { resolveAvatar } from '../../utils/avatar';
import { Search, MapPin, Clock, ChevronRight, SlidersHorizontal, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Input';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import { doctorApi } from '../../api';
import type { Doctor, Pagination as Pag } from '../../types';
import BookAppointmentModal from '../../components/patient/BookAppointmentModal';
import StarRating from '../../components/ui/StarRating';
import DoctorMap from '../../components/patient/DoctorMap';
import styles from './DoctorSearch.module.scss';

const DoctorSearch: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specs, setSpecs] = useState<string[]>([]);
  const [pagination, setPagination] = useState<Pag | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode]         = useState<'list' | 'map'>('list');
  const [userLat,  setUserLat]          = useState<number | undefined>();
  const [userLng,  setUserLng]          = useState<number | undefined>();

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); },
      () => {}
    );
  }, []);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await doctorApi.getAll({ page, search: search || undefined, specialization: specialization || undefined });
      setDoctors(res.data.data);
      setPagination(res.data.pagination);
    } catch {}
    setLoading(false);
  }, [page, search, specialization]);

  useEffect(() => { doctorApi.getSpecializations().then(r => setSpecs(r.data.data)); }, []);
  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, specialization]);

  const specOptions = [{ value: '', label: 'Todas las especialidades' }, ...specs.map(s => ({ value: s, label: s }))];

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1>Buscar Doctores</h1>
            <p>Encuentra el especialista ideal para tu consulta</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Button
              variant={viewMode === 'map' ? 'primary' : 'secondary'}
              icon={<MapPin size={16}/>}
              onClick={() => setViewMode(v => v === 'map' ? 'list' : 'map')}
            >
              {viewMode === 'map' ? 'Ver lista' : 'Ver mapa'}
            </Button>
            <Button variant="secondary" icon={<SlidersHorizontal size={16} />} onClick={() => setShowFilters(!showFilters)}>
              Filtros
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card padding="sm">
          <div className={styles.filters}>
            <div className={styles.searchWrap}>
              <Input
                placeholder="Buscar por nombre o especialidad…"
                icon={<Search size={16} />}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select
              options={specOptions}
              value={specialization}
              onChange={e => setSpecialization(e.target.value)}
            />
            {(search || specialization) && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setSpecialization(''); }}>
                Limpiar
              </Button>
            )}
          </div>
        </Card>

        {}
        {}
        {viewMode === 'map' && (
          <div>
            <DoctorMap
              doctors={doctors}
              onSelect={setSelectedDoctor}
              selectedId={selectedDoctor?._id}
              userLat={userLat}
              userLng={userLng}
            />
            {selectedDoctor && (
              <div className={styles.mapSelectedInfo}>
                <span>Doctor seleccionado: <strong>{(selectedDoctor.userId as any)?.name}</strong></span>
                <Button size="sm" onClick={() => { setViewMode('list'); }}>Ver perfil</Button>
              </div>
            )}
          </div>
        )}

        {viewMode === 'list' && loading ? (
          <div className={styles.grid}>
            {[...Array(6)].map((_, i) => <div key={i} className={['skeleton', styles.skeletonCard].join(' ')} />)}
          </div>
        ) : viewMode === 'list' && doctors.length === 0 ? (
          <Card>
            <div className={styles.empty}>
              <span style={{ fontSize: 48 }}>🔍</span>
              <h3>Sin resultados</h3>
              <p>No encontramos doctores con esos criterios. Intenta con otra búsqueda.</p>
            </div>
          </Card>
        ) : (
          <>
            {viewMode === 'list' && <p className={styles.resultCount}>
              {pagination?.total} doctor{pagination?.total !== 1 ? 'es' : ''} encontrado{pagination?.total !== 1 ? 's' : ''}
            </p>}
            {viewMode === 'list' && <div className={styles.grid}>
              {doctors.map(doc => {
                const docUser = doc.userId as any;
                return (
                  <div key={doc._id} className={styles.card}>
                    {doc.isFeatured && <div className={styles.featuredBadge}>⭐ Destacado</div>}
                    <div className={styles.cardTop}>
                      <div className={styles.avatar}>
                        {docUser?.avatar
                          ? <img src={resolveAvatar(docUser.avatar)} alt={docUser?.name} />
                          : <span>{docUser?.name?.[0]?.toUpperCase()}</span>
                        }
                      </div>
                      <div className={styles.info}>
                        <h3>{docUser?.name}</h3>
                        <span className={styles.spec}>{doc.specialization}</span>
                        <StarRating value={doc.rating || 0} readonly size={14} showNumber total={doc.totalReviews} />
                      </div>
                    </div>

                    {doc.bio && <p className={styles.bio}>{doc.bio}</p>}

                    <div className={styles.meta}>
                      {doc.locationAddress && (
                        <span><MapPin size={13} /> {doc.locationAddress}</span>
                      )}
                      {doc.experience && (
                        <span><Clock size={13} /> {doc.experience} años de exp.</span>
                      )}
                      {doc.hourlyRate && (
                        <span>💰 ${doc.hourlyRate}/consulta</span>
                      )}
                    </div>

                    <div className={styles.cardActions}>
                      <Link to={`/patient/doctors/${doc._id}`} className={styles.viewLink}>
                        Ver perfil <ChevronRight size={14} />
                      </Link>
                      <div className={styles.btnGroup}>
                        <Link to={`/patient/chat?doctorId=${doc._id}`}>
                          <Button size="sm" variant="secondary" icon={<MessageSquare size={14}/>}>
                            Chat
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          onClick={() => setSelectedDoctor(doc)}
                        >
                          Agendar
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>}

            {viewMode === 'list' && pagination && (
              <Pagination pagination={pagination} onPageChange={setPage} />
            )}
          </>
        )}
      </div>

      {selectedDoctor && (
        <BookAppointmentModal
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          onSuccess={() => { setSelectedDoctor(null); }}
        />
      )}
    </DashboardLayout>
  );
};

export default DoctorSearch;
