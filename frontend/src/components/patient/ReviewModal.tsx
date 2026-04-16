import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../ui/Card';
import Button from '../ui/Button';
import StarRating from '../ui/StarRating';
import api from '../../api';
import type { Appointment } from '../../types';
import styles from './ReviewModal.module.scss';

interface Props {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: () => void;
}

const STAR_LABELS = ['', 'Muy malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'];

const ReviewModal: React.FC<Props> = ({ appointment, onClose, onSuccess }) => {
  const docUser = (appointment.doctorId?.userId as any);
  const [rating,  setRating]  = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!rating) { toast.error('Selecciona una calificación'); return; }
    setLoading(true);
    try {
      await api.post('/reviews', {
        appointmentId: appointment._id,
        rating,
        comment: comment.trim(),
      });
      toast.success('¡Gracias por tu reseña!');
      onSuccess();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al enviar reseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Calificar consulta" size="sm">
      <div className={styles.wrap}>
        {/* Doctor info */}
        <div className={styles.docInfo}>
          <div className={styles.docAvatar}>
            {docUser?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <strong>{docUser?.name}</strong>
            <span>{appointment.doctorId?.specialization}</span>
          </div>
        </div>

        {}
        <div className={styles.ratingSection}>
          <p>¿Cómo calificarías tu experiencia?</p>
          <StarRating value={rating} onChange={setRating} size={36} />
          {rating > 0 && (
            <span className={styles.ratingLabel}>{STAR_LABELS[rating]}</span>
          )}
        </div>

        {}
        <div className={styles.commentSection}>
          <label>
            <MessageSquare size={14} />
            Comentario <span>(opcional)</span>
          </label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Cuéntanos más sobre tu experiencia…"
            rows={3}
            maxLength={500}
            className={styles.textarea}
          />
          <span className={styles.charCount}>{comment.length}/500</span>
        </div>

        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} loading={loading} disabled={!rating}>
            Publicar reseña
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ReviewModal;
