import React, { useState } from 'react';
import { resolveAvatar } from '../../utils/avatar';
import { Plus, X, Upload } from 'lucide-react';
import { Modal } from '../ui/Card';
import Button from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { recordApi } from '../../api';
import type { Appointment } from '../../types';
import styles from './MedicalRecordModal.module.scss';

interface Props {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: () => void;
}

const MedicalRecordModal: React.FC<Props> = ({ appointment, onClose, onSuccess }) => {
  const patUser = (appointment.patientId?.userId as any);
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [treatment, setTreatment] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const addSymptom = () => {
    const s = symptomInput.trim();
    if (s && !symptoms.includes(s)) {
      setSymptoms(prev => [...prev, s]);
      setSymptomInput('');
    }
  };

  const removeSymptom = (s: string) => setSymptoms(prev => prev.filter(x => x !== s));

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
  };

  const handleSubmit = async () => {
    if (!diagnosis.trim()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('appointmentId', appointment._id);
      fd.append('diagnosis', diagnosis);
      fd.append('symptoms', JSON.stringify(symptoms));
      fd.append('treatment', treatment);
      fd.append('prescription', prescription);
      fd.append('notes', notes);
      if (followUpDate) fd.append('followUpDate', followUpDate);
      files.forEach(f => fd.append('files', f));
      await recordApi.create(fd);
      onSuccess();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error al guardar expediente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Crear Expediente Médico" size="lg">
      <div className={styles.wrap}>
        {/* Patient info */}
        <div className={styles.patBanner}>
          <div className={styles.patAvatar}>
            {patUser?.avatar ? <img src={resolveAvatar(patUser.avatar)} alt="" /> : <span>{patUser?.name?.[0]}</span>}
          </div>
          <div>
            <strong>{patUser?.name}</strong>
            <span>{patUser?.email}</span>
          </div>
          <span className={styles.dateTag}>
            {new Date(appointment.appointmentDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className={styles.grid}>
          {/* Diagnosis */}
          <div className={styles.fullCol}>
            <Input
              label="Diagnóstico *"
              placeholder="Ej. Hipertensión arterial leve"
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
            />
          </div>

          {/* Symptoms */}
          <div className={styles.fullCol}>
            <label className={styles.fieldLabel}>Síntomas</label>
            <div className={styles.symptomRow}>
              <input
                className={styles.symptomInput}
                placeholder="Agregar síntoma y presionar Enter"
                value={symptomInput}
                onChange={e => setSymptomInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSymptom(); } }}
              />
              <button className={styles.addBtn} type="button" onClick={addSymptom}><Plus size={16} /></button>
            </div>
            {symptoms.length > 0 && (
              <div className={styles.tags}>
                {symptoms.map(s => (
                  <span key={s} className={styles.tag}>
                    {s}
                    <button onClick={() => removeSymptom(s)} type="button"><X size={11} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Treatment */}
          <Textarea
            label="Tratamiento"
            placeholder="Describe el tratamiento indicado…"
            rows={3}
            value={treatment}
            onChange={e => setTreatment(e.target.value)}
          />

          {/* Prescription - structured for patient medication search */}
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:'#4a5568', marginBottom:6, display:'block' }}>
              Receta médica
              <span style={{ fontSize:11, fontWeight:400, color:'#a0aec0', marginLeft:8 }}>
                (los medicamentos serán buscables por el paciente)
              </span>
            </label>
            <Textarea
              placeholder={"Ej:\nAmoxicilina 500mg — 1 cápsula cada 8h por 7 días\nIbuprofeno 400mg — 1 tableta cada 6h con alimentos\n\nPuedes incluir dosis, frecuencia e instrucciones."}
              rows={4}
              value={prescription}
              onChange={e => setPrescription(e.target.value)}
            />
            <p style={{ fontSize:11, color:'#a0aec0', marginTop:4 }}>
              💡 Escribe un medicamento por línea. El paciente podrá buscar precios desde su sección de Medicamentos.
            </p>
          </div>

          {/* Notes */}
          <div className={styles.fullCol}>
            <Textarea
              label="Notas adicionales"
              placeholder="Observaciones, recomendaciones…"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Follow-up */}
          <div>
            <Input
              label="Fecha de seguimiento (opcional)"
              type="date"
              value={followUpDate}
              onChange={e => setFollowUpDate(e.target.value)}
            />
          </div>
        </div>

        {/* File attachments */}
        <div className={styles.uploadSection}>
          <label className={styles.fieldLabel}>📎 Archivos adjuntos</label>
          <label className={styles.uploadZone}>
            <input type="file" multiple onChange={handleFiles} accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" hidden />
            <Upload size={24} />
            <span>Arrastra archivos o haz clic para seleccionar</span>
            <span className={styles.uploadHint}>PDF, imágenes, documentos — máx 10MB c/u</span>
          </label>
          {files.length > 0 && (
            <div className={styles.fileList}>
              {files.map((f, i) => (
                <div key={i} className={styles.fileItem}>
                  <span>📄 {f.name}</span>
                  <span className={styles.fileSize}>{(f.size / 1024).toFixed(0)} KB</span>
                  <button type="button" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}><X size={13} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} loading={loading} disabled={!diagnosis.trim()}>
            Guardar Expediente
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default MedicalRecordModal;