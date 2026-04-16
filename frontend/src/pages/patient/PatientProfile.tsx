import React, { useEffect, useState } from 'react';
import { User, Heart, Phone, MapPin, AlertTriangle, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import api from '../../api';
import styles from './PatientProfile.module.scss';

const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(v => ({ value: v, label: v }));
const GENDERS = [
  { value: 'male',   label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
  { value: 'other',  label: 'Otro' },
];

const PatientProfilePage: React.FC = () => {
  const { profile, fetchMe } = useAuthStore();
  const [saving, setSaving]     = useState(false);
  const [form, setForm] = useState({
    dateOfBirth: '',
    gender: '',
    phone: '',
    address: '',
    bloodType: '',
    allergies: '',
    medicalHistorySummary: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      dateOfBirth:           profile.dateOfBirth?.slice(0, 10) || '',
      gender:                profile.gender     || '',
      phone:                 profile.phone      || '',
      address:               profile.address    || '',
      bloodType:             profile.bloodType  || '',
      allergies:             (profile.allergies || []).join(', '),
      medicalHistorySummary: profile.medicalHistorySummary || '',
      emergencyName:         profile.emergencyContact?.name     || '',
      emergencyPhone:        profile.emergencyContact?.phone    || '',
      emergencyRelation:     profile.emergencyContact?.relation || '',
    });
  }, [profile]);

  const handle = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/patients/profile', {
        dateOfBirth:           form.dateOfBirth || undefined,
        gender:                form.gender      || undefined,
        phone:                 form.phone       || undefined,
        address:               form.address     || undefined,
        bloodType:             form.bloodType   || undefined,
        allergies:             form.allergies ? form.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        medicalHistorySummary: form.medicalHistorySummary || undefined,
        emergencyContact: (form.emergencyName || form.emergencyPhone) ? {
          name:     form.emergencyName,
          phone:    form.emergencyPhone,
          relation: form.emergencyRelation,
        } : undefined,
      });
      await fetchMe();
      toast.success('Perfil médico actualizado');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al guardar');
    } finally { setSaving(false); }
  };

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1>Mi Perfil Médico</h1>
          <p>Mantén tu información actualizada para recibir mejor atención</p>
        </div>

        <div className={styles.grid}>
          {/* Personal info */}
          <Card>
            <h3 className={styles.sectionTitle}><User size={16}/> Información personal</h3>
            <div className={styles.formGrid}>
              <Input
                label="Fecha de nacimiento"
                type="date"
                value={form.dateOfBirth}
                onChange={handle('dateOfBirth')}
              />
              <Select
                label="Género"
                options={GENDERS}
                placeholder="Seleccionar"
                value={form.gender}
                onChange={handle('gender') as any}
              />
              <Input
                label="Teléfono"
                value={form.phone}
                onChange={handle('phone')}
                icon={<Phone size={15}/>}
                placeholder="+52 55 1234 5678"
              />
              <Input
                label="Dirección"
                value={form.address}
                onChange={handle('address')}
                icon={<MapPin size={15}/>}
                placeholder="Calle, Colonia, Ciudad"
              />
            </div>
          </Card>

          {/* Medical info */}
          <Card>
            <h3 className={styles.sectionTitle}><Heart size={16}/> Información médica</h3>
            <div className={styles.formGrid}>
              <Select
                label="Tipo de sangre"
                options={BLOOD_TYPES}
                placeholder="Seleccionar"
                value={form.bloodType}
                onChange={handle('bloodType') as any}
              />
              <Input
                label="Alergias conocidas"
                value={form.allergies}
                onChange={handle('allergies')}
                placeholder="Penicilina, polvo, mariscos (separadas por coma)"
                hint="Separadas por comas"
              />
              <div className={styles.fullCol}>
                <Textarea
                  label="Resumen de historial médico"
                  value={form.medicalHistorySummary}
                  onChange={handle('medicalHistorySummary')}
                  rows={4}
                  placeholder="Condiciones crónicas, cirugías previas, medicamentos actuales…"
                />
              </div>
            </div>
          </Card>

          {/* Emergency contact */}
          <Card>
            <h3 className={styles.sectionTitle}><AlertTriangle size={16}/> Contacto de emergencia</h3>
            <div className={styles.formGrid}>
              <Input
                label="Nombre"
                value={form.emergencyName}
                onChange={handle('emergencyName')}
                placeholder="Nombre completo"
              />
              <Input
                label="Teléfono"
                value={form.emergencyPhone}
                onChange={handle('emergencyPhone')}
                icon={<Phone size={15}/>}
                placeholder="+52 55 1234 5678"
              />
              <Input
                label="Relación"
                value={form.emergencyRelation}
                onChange={handle('emergencyRelation')}
                placeholder="Mamá, Papá, Esposo/a, Hermano/a…"
              />
            </div>
          </Card>
        </div>

        <div className={styles.saveRow}>
          <Button icon={<Save size={15}/>} loading={saving} size="lg" onClick={save}>
            Guardar perfil médico
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientProfilePage;
