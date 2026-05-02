import React, { useState, useMemo } from 'react';
import { Plus, X, Upload, Search, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../ui/Card';
import Button from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { recordApi } from '../../api';
import type { Appointment } from '../../types';
import { resolveAvatar } from '../../utils/avatar';
import CATALOG, { CATEGORIES, type MedCatalogItem } from '../../data/medicationCatalog';
import styles from './MedicalRecordModal.module.scss';

interface PrescribedMed {
  catalogItem: MedCatalogItem;
  pillsPerDay: number;
  frequencyHours: number;
  durationDays: number;
}

interface Props {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: () => void;
}

const FREQUENCY_OPTIONS = [1, 2, 3, 4, 6, 8, 12, 24];

const MedicalRecordModal: React.FC<Props> = ({ appointment, onClose, onSuccess }) => {
  const patUser = (appointment.patientId?.userId as any);

  const [diagnosis,    setDiagnosis]   = useState('');
  const [symptoms,     setSymptoms]    = useState<string[]>([]);
  const [symptomInput, setSymptomInput]= useState('');
  const [treatment,    setTreatment]   = useState('');
  const [notes,        setNotes]       = useState('');
  const [followUpDate, setFollowUpDate]= useState('');
  const [files,        setFiles]       = useState<File[]>([]);
  const [loading,      setLoading]     = useState(false);

  const [meds,        setMeds]         = useState<PrescribedMed[]>([]);
  const [pickerOpen,  setPickerOpen]   = useState(false);
  const [search,      setSearch]       = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return CATALOG.filter(m => {
      const matchCat = activeCategory === 'Todos' || m.category === activeCategory;
      const matchQ   = !q || m.name.toLowerCase().includes(q) || m.generic.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [search, activeCategory]);

  const addMed = (item: MedCatalogItem) => {
    if (meds.some(m => m.catalogItem.id === item.id)) return;
    setMeds(prev => [...prev, {
      catalogItem:    item,
      pillsPerDay:    1,
      frequencyHours: 8,
      durationDays:   7,
    }]);
    setSearch('');
    setPickerOpen(false);
  };

  const removeMed = (id: string) =>
    setMeds(prev => prev.filter(m => m.catalogItem.id !== id));

  const updateMed = (id: string, field: 'pillsPerDay' | 'frequencyHours' | 'durationDays', val: number) =>
    setMeds(prev => prev.map(m =>
      m.catalogItem.id === id ? { ...m, [field]: val } : m
    ));

  const addSymptom = () => {
    const s = symptomInput.trim();
    if (s && !symptoms.includes(s)) { setSymptoms(p => [...p, s]); setSymptomInput(''); }
  };

  const handleSubmit = async () => {
    if (!diagnosis.trim()) { toast.error('El diagnóstico es obligatorio'); return; }
    // Validate each medication has valid numbers
    for (const m of meds) {
      if (m.pillsPerDay < 1 || m.frequencyHours < 1 || m.durationDays < 1) {
        toast.error(`Completa todos los campos de ${m.catalogItem.name}`);
        return;
      }
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('appointmentId', appointment._id);
      fd.append('diagnosis',  diagnosis.trim());
      fd.append('symptoms',   JSON.stringify(symptoms));
      fd.append('treatment',  treatment);
      fd.append('notes',      notes);
      if (followUpDate) fd.append('followUpDate', followUpDate);

      const serializedMeds = meds.map(m => ({
        name:           m.catalogItem.name,
        doseLabel:      m.catalogItem.doseLabel,
        pillsPerDay:    m.pillsPerDay,
        frequencyHours: m.frequencyHours,
        durationDays:   m.durationDays,
      }));
      fd.append('medications', JSON.stringify(serializedMeds));

      files.forEach(f => fd.append('files', f));
      await recordApi.create(fd);
      toast.success('Expediente guardado correctamente');
      onSuccess();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al guardar expediente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Crear Expediente Médico" size="lg">
      <div className={styles.wrap}>

        {/* Patient banner */}
        <div className={styles.patBanner}>
          <div className={styles.patAvatar}>
            {resolveAvatar(patUser?.avatar)
              ? <img src={resolveAvatar(patUser.avatar)} alt="" />
              : <span>{patUser?.name?.[0]}</span>
            }
          </div>
          <div>
            <strong>{patUser?.name}</strong>
            <span>{patUser?.email}</span>
          </div>
          <span className={styles.dateTag}>
            {new Date(appointment.appointmentDate).toLocaleDateString('es-MX', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
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
              <button className={styles.addBtn} type="button" onClick={addSymptom}>
                <Plus size={16} />
              </button>
            </div>
            {symptoms.length > 0 && (
              <div className={styles.tags}>
                {symptoms.map(s => (
                  <span key={s} className={styles.tag}>
                    {s}
                    <button onClick={() => setSymptoms(p => p.filter(x => x !== s))} type="button">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Treatment */}
          <div className={styles.fullCol}>
            <Textarea
              label="Tratamiento"
              placeholder="Describe el tratamiento indicado…"
              rows={2}
              value={treatment}
              onChange={e => setTreatment(e.target.value)}
            />
          </div>
        </div>

        {/* ── MEDICATIONS ──────────────────────────────────────────────────── */}
        <div className={styles.medsSection}>
          <div className={styles.medsSectionHeader}>
            <span className={styles.fieldLabel}>💊 Receta médica</span>
            <Button
              size="sm"
              variant="secondary"
              icon={<Plus size={14} />}
              onClick={() => setPickerOpen(p => !p)}
            >
              Agregar medicamento
            </Button>
          </div>

          {/* Picker panel */}
          {pickerOpen && (
            <div className={styles.picker}>
              <div className={styles.pickerSearch}>
                <Search size={14} />
                <input
                  autoFocus
                  placeholder="Buscar medicamento o principio activo…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <button onClick={() => setPickerOpen(false)} className={styles.pickerClose}>
                  <X size={16} />
                </button>
              </div>

              {/* Category tabs */}
              <div className={styles.pickerCats}>
                {['Todos', ...CATEGORIES].map(cat => (
                  <button
                    key={cat}
                    className={[styles.catChip, activeCategory === cat ? styles['catChip--on'] : ''].join(' ')}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Results */}
              <div className={styles.pickerList}>
                {filtered.length === 0 ? (
                  <div className={styles.pickerEmpty}>Sin resultados para &ldquo;{search}&rdquo;</div>
                ) : (
                  filtered.map(item => {
                    const already = meds.some(m => m.catalogItem.id === item.id);
                    return (
                      <button
                        key={item.id}
                        className={[styles.pickerItem, already ? styles['pickerItem--added'] : ''].join(' ')}
                        onClick={() => !already && addMed(item)}
                        disabled={already}
                      >
                        <div className={styles.pickerItemInfo}>
                          <span className={styles.pickerName}>{item.name}</span>
                          <span className={styles.pickerGeneric}>{item.generic} · {item.category}</span>
                        </div>
                        {already
                          ? <span className={styles.addedBadge}>✓ Agregado</span>
                          : <Plus size={15} className={styles.pickerPlus} />
                        }
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Selected medications — editable rows */}
          {meds.length === 0 && !pickerOpen && (
            <div className={styles.medsEmpty}>
              <AlertCircle size={16} />
              <span>No se han agregado medicamentos. Haz clic en &ldquo;Agregar medicamento&rdquo;.</span>
            </div>
          )}

          {meds.map(m => (
            <div key={m.catalogItem.id} className={styles.medRow}>
              <div className={styles.medRowHeader}>
                <div>
                  <strong>{m.catalogItem.name}</strong>
                  <span className={styles.medDoseLabel}>{m.catalogItem.doseLabel}</span>
                </div>
                <button className={styles.medRemove} onClick={() => removeMed(m.catalogItem.id)} title="Quitar">
                  <X size={15} />
                </button>
              </div>

              <div className={styles.medFields}>
                {/* Pills per day */}
                <div className={styles.medField}>
                  <label>Pastillas al día *</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={m.pillsPerDay}
                    onChange={e => updateMed(m.catalogItem.id, 'pillsPerDay', Math.max(1, parseInt(e.target.value) || 1))}
                    className={styles.medNumInput}
                  />
                </div>

                {/* Frequency */}
                <div className={styles.medField}>
                  <label>Cada cuántas horas *</label>
                  <select
                    value={m.frequencyHours}
                    onChange={e => updateMed(m.catalogItem.id, 'frequencyHours', parseInt(e.target.value))}
                    className={styles.medSelect}
                  >
                    {FREQUENCY_OPTIONS.map(h => (
                      <option key={h} value={h}>
                        {h === 24 ? 'Una vez al día' : `Cada ${h}h`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div className={styles.medField}>
                  <label>Duración (días) *</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={m.durationDays}
                    onChange={e => updateMed(m.catalogItem.id, 'durationDays', Math.max(1, parseInt(e.target.value) || 1))}
                    className={styles.medNumInput}
                  />
                </div>

                {/* Summary badge */}
                <div className={styles.medSummary}>
                  <span>
                    {m.pillsPerDay} pastilla{m.pillsPerDay > 1 ? 's' : ''}/día ·{' '}
                    {m.frequencyHours === 24 ? 'una vez' : `c/${m.frequencyHours}h`} ·{' '}
                    {m.durationDays} día{m.durationDays > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Notes + follow-up */}
        <div className={styles.grid}>
          <div className={styles.fullCol}>
            <Textarea
              label="Notas adicionales"
              placeholder="Observaciones, recomendaciones…"
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
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
            <input type="file" multiple onChange={e => { if (e.target.files) setFiles(p => [...p, ...Array.from(e.target.files!)]); }} accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" hidden />
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
                  <button type="button" onClick={() => setFiles(p => p.filter((_, j) => j !== i))}>
                    <X size={13} />
                  </button>
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
