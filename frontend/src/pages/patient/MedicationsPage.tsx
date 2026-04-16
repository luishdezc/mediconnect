import React, { useState, useEffect } from 'react';
import { Search, Star, Pill, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { recordApi } from '../../api';
import styles from './MedicationsPage.module.scss';

interface MedStore { name: string; price: number; url: string; delivery?: string; logo: string; }
interface Medication {
  id: string;
  name: string;
  generic?: string;
  category: string;
  description: string;
  sponsored?: boolean;
  sponsorLabel?: string;
  stores: MedStore[];
}

const MEDICATIONS: Medication[] = [
  {
    id: 'omeprazol-20',
    name: 'Omeprazol 20mg',
    generic: 'Omeprazol',
    category: 'Gastrointestinal',
    description: 'Inhibidor de bomba de protones para gastritis y reflujo.',
    sponsored: true,
    sponsorLabel: 'Farmacia del Ahorro — Patrocinado',
    stores: [
      { name: 'Farmacia del Ahorro', price: 89,  logo: '💊', url: 'https://www.farmaciasdelahorro.com.mx', delivery: 'Envío gratis' },
      { name: 'Farmacias Guadalajara', price: 95,  logo: '🏥', url: 'https://www.fasa.com.mx' },
      { name: 'Similares', price: 45,  logo: '🟢', url: 'https://www.similares.com.mx' },
      { name: 'Walmart Farmacia', price: 82,  logo: '🛒', url: 'https://www.walmart.com.mx', delivery: 'Envío a domicilio' },
    ],
  },
  {
    id: 'metformina-850',
    name: 'Metformina 850mg',
    generic: 'Metformina HCl',
    category: 'Diabetes',
    description: 'Antidiabético oral para el control de glucosa en diabetes tipo 2.',
    sponsored: true,
    sponsorLabel: 'Farmacias Benavides — Patrocinado',
    stores: [
      { name: 'Farmacias Benavides', price: 120, logo: '🔵', url: 'https://www.benavides.com.mx', delivery: 'Envío gratis +$300' },
      { name: 'Farmacia del Ahorro', price: 135, logo: '💊', url: 'https://www.farmaciasdelahorro.com.mx' },
      { name: 'Similares', price: 65,  logo: '🟢', url: 'https://www.similares.com.mx' },
      { name: 'Chedraui Farmacia',  price: 128, logo: '🏪', url: 'https://www.chedraui.com.mx' },
    ],
  },
  {
    id: 'losartan-50',
    name: 'Losartán 50mg',
    generic: 'Losartán Potásico',
    category: 'Cardiovascular',
    description: 'Antagonista del receptor de angiotensina II para la hipertensión arterial.',
    sponsored: true,
    sponsorLabel: 'Farmacia del Ahorro — Patrocinado',
    stores: [
      { name: 'Farmacia del Ahorro',   price: 145, logo: '💊', url: 'https://www.farmaciasdelahorro.com.mx', delivery: 'Envío gratis' },
      { name: 'Farmacias Guadalajara', price: 158, logo: '🏥', url: 'https://www.fasa.com.mx' },
      { name: 'Similares',             price: 89,  logo: '🟢', url: 'https://www.similares.com.mx' },
      { name: 'Sam\'s Club Farmacia',  price: 132, logo: '🏬', url: 'https://www.sams.com.mx' },
    ],
  },
  {
    id: 'amoxicilina-500',
    name: 'Amoxicilina 500mg',
    generic: 'Amoxicilina',
    category: 'Antibióticos',
    description: 'Antibiótico de amplio espectro para infecciones bacterianas.',
    stores: [
      { name: 'Similares',             price: 85,  logo: '🟢', url: 'https://www.similares.com.mx' },
      { name: 'Farmacia del Ahorro',   price: 120, logo: '💊', url: 'https://www.farmaciasdelahorro.com.mx' },
      { name: 'Farmacias Guadalajara', price: 132, logo: '🏥', url: 'https://www.fasa.com.mx' },
      { name: 'Farmacias Benavides',   price: 115, logo: '🔵', url: 'https://www.benavides.com.mx' },
    ],
  },
  {
    id: 'ibuprofeno-400',
    name: 'Ibuprofeno 400mg',
    generic: 'Ibuprofeno',
    category: 'Analgésicos / AINE',
    description: 'Antiinflamatorio no esteroideo para dolor, fiebre e inflamación.',
    stores: [
      { name: 'Walmart Farmacia',      price: 42,  logo: '🛒', url: 'https://www.walmart.com.mx', delivery: 'Envío a domicilio' },
      { name: 'Similares',             price: 35,  logo: '🟢', url: 'https://www.similares.com.mx' },
      { name: 'Farmacia del Ahorro',   price: 55,  logo: '💊', url: 'https://www.farmaciasdelahorro.com.mx' },
      { name: 'OXXO',                  price: 68,  logo: '🏪', url: '#' },
    ],
  },
  {
    id: 'atorvastatina-20',
    name: 'Atorvastatina 20mg',
    generic: 'Atorvastatina Cálcica',
    category: 'Cardiovascular',
    description: 'Estatina para el control del colesterol y triglicéridos elevados.',
    stores: [
      { name: 'Similares',             price: 95,  logo: '🟢', url: 'https://www.similares.com.mx' },
      { name: 'Farmacia del Ahorro',   price: 210, logo: '💊', url: 'https://www.farmaciasdelahorro.com.mx' },
      { name: 'Farmacias Guadalajara', price: 225, logo: '🏥', url: 'https://www.fasa.com.mx' },
      { name: 'Chedraui Farmacia',     price: 198, logo: '🏪', url: 'https://www.chedraui.com.mx' },
    ],
  },
  {
    id: 'salbutamol-100',
    name: 'Salbutamol Inhalador 100mcg',
    generic: 'Salbutamol / Albuterol',
    category: 'Respiratorio',
    description: 'Broncodilatador de acción rápida para el asma y EPOC.',
    stores: [
      { name: 'Farmacias Benavides',   price: 185, logo: '🔵', url: 'https://www.benavides.com.mx' },
      { name: 'Farmacia del Ahorro',   price: 195, logo: '💊', url: 'https://www.farmaciasdelahorro.com.mx', delivery: 'Envío gratis' },
      { name: 'Farmacias Guadalajara', price: 202, logo: '🏥', url: 'https://www.fasa.com.mx' },
      { name: 'Similares',             price: 155, logo: '🟢', url: 'https://www.similares.com.mx' },
    ],
  },
  {
    id: 'levotiroxina-100',
    name: 'Levotiroxina 100mcg',
    generic: 'Levotiroxina Sódica',
    category: 'Tiroides',
    description: 'Hormona tiroidea sintética para el hipotiroidismo.',
    stores: [
      { name: 'Similares',             price: 78,  logo: '🟢', url: 'https://www.similares.com.mx' },
      { name: 'Farmacia del Ahorro',   price: 125, logo: '💊', url: 'https://www.farmaciasdelahorro.com.mx' },
      { name: 'Sam\'s Club Farmacia',  price: 98,  logo: '🏬', url: 'https://www.sams.com.mx' },
      { name: 'Farmacias Benavides',   price: 118, logo: '🔵', url: 'https://www.benavides.com.mx' },
    ],
  },
  {
    id: 'sertralina-50',
    name: 'Sertralina 50mg',
    generic: 'Sertralina HCl',
    category: 'Psiquiatría',
    description: 'Inhibidor selectivo de la recaptación de serotonina (ISRS) para depresión y ansiedad.',
    stores: [
      { name: 'Similares',             price: 110, logo: '🟢', url: 'https://www.similares.com.mx' },
      { name: 'Farmacia del Ahorro',   price: 185, logo: '💊', url: 'https://www.farmaciasdelahorro.com.mx' },
      { name: 'Farmacias Guadalajara', price: 198, logo: '🏥', url: 'https://www.fasa.com.mx' },
      { name: 'Walmart Farmacia',      price: 172, logo: '🛒', url: 'https://www.walmart.com.mx' },
    ],
  },
];

const MedicationsPage: React.FC = () => {

  const [query, setQuery]             = useState('');
  const [expanded, setExpanded]       = useState<string | null>(null);
  const [prescribedNames, setPrescribed] = useState<string[]>([]);

  useEffect(() => {
    recordApi.getMy(1).then(r => {
      const names: string[] = [];
      r.data.data.forEach((rec: any) => {
        if (rec.prescription) {
          const lines = rec.prescription.split('\n').map((l: string) => l.trim()).filter(Boolean);
          lines.forEach((line: string) => {
            const match = line.match(/^([A-Za-záéíóúüñÁÉÍÓÚÜÑ ]+?)(?:\s+\d|\s+-|\s+\(|$)/);
            const name = match ? match[1].trim() : line.split(/[\d–—-]/)[0].trim();
            if (name.length > 2) names.push(name);
          });
        }
      });
      setPrescribed([...new Set(names)]);
    }).catch(() => {});
  }, []);

  const sponsored = MEDICATIONS.filter(m => m.sponsored);
  const catalog   = MEDICATIONS.filter(m => !m.sponsored);

  const filtered = query.trim()
    ? MEDICATIONS.filter(m =>
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.generic?.toLowerCase().includes(query.toLowerCase()) ||
        m.category.toLowerCase().includes(query.toLowerCase())
      )
    : null;

  const toggle = (id: string) => setExpanded(p => p === id ? null : id);

  const MedCard = ({ med }: { med: Medication }) => {
    const sorted = [...med.stores].sort((a, b) => a.price - b.price);
    const best   = sorted[0];
    const isOpen = expanded === med.id;

    return (
      <div className={[styles.medCard, med.sponsored ? styles['medCard--sponsored'] : ''].join(' ')}>
        {med.sponsored && (
          <div className={styles.sponsoredBadge}>
            <Star size={11} fill="#f0b96a" stroke="#f0b96a" /> {med.sponsorLabel}
          </div>
        )}

        <button className={styles.medHeader} onClick={() => toggle(med.id)}>
          <div className={styles.medIcon}>
            <Pill size={20} />
          </div>
          <div className={styles.medInfo}>
            <strong>{med.name}</strong>
            {med.generic && <span className={styles.medGeneric}>{med.generic}</span>}
            <span className={styles.medCategory}>{med.category}</span>
          </div>
          <div className={styles.bestPrice}>
            <span className={styles.bestLabel}>Mejor precio</span>
            <span className={styles.bestAmount}>${best.price}</span>
            <span className={styles.bestStore}>{best.name}</span>
          </div>
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {isOpen && (
          <div className={styles.medBody}>
            <p className={styles.medDesc}>{med.description}</p>

            <div className={styles.storesGrid}>
              {sorted.map((store, i) => (
                <div
                  key={store.name}
                  className={[styles.storeCard, i === 0 ? styles['storeCard--best'] : ''].join(' ')}
                >
                  {i === 0 && <div className={styles.bestTag}>✓ Más barato</div>}
                  <div className={styles.storeLogo}>{store.logo}</div>
                  <div className={styles.storeName}>{store.name}</div>
                  <div className={styles.storePrice}>${store.price} <span>MXN</span></div>
                  {store.delivery && (
                    <div className={styles.storeDelivery}>{store.delivery}</div>
                  )}
                  <a
                    href={store.url}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.storeBtn}
                    onClick={e => store.url === '#' && e.preventDefault()}
                  >
                    <ShoppingCart size={13} /> Comprar
                  </a>
                </div>
              ))}
            </div>

            <div className={styles.priceDisclaimer}>
              * Los precios son referenciales y pueden variar. Consulta el precio exacto en cada farmacia.
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1>Medicamentos</h1>
            <p>Compara precios en farmacias y encuentra dónde comprar más barato</p>
          </div>
        </div>

        {prescribedNames.length > 0 && (
          <div className={styles.prescribedAlert}>
            <Pill size={18} />
            <div>
              <strong>Medicamentos recetados en tu expediente</strong>
              <div className={styles.prescribedTags}>
                {prescribedNames.slice(0, 6).map(n => (
                  <button
                    key={n}
                    className={styles.prescribedTag}
                    onClick={() => setQuery(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <Card padding="sm">
          <Input
            placeholder="Buscar medicamento por nombre, genérico o categoría…"
            icon={<Search size={16} />}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </Card>

        {filtered !== null ? (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para "{query}"
            </h2>
            {filtered.length === 0 ? (
              <Card>
                <div className={styles.empty}>
                  <Pill size={40} strokeWidth={1.2} />
                  <h3>Sin resultados</h3>
                  <p>No encontramos ese medicamento. Prueba con el nombre genérico.</p>
                </div>
              </Card>
            ) : (
              filtered.map(med => <MedCard key={med.id} med={med} />)
            )}
          </div>
        ) : (
          <>
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>⭐ Medicamentos destacados</h2>
                <span className={styles.sponsoredNote}>Contenido patrocinado</span>
              </div>
              {sponsored.map(med => <MedCard key={med.id} med={med} />)}
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>📋 Catálogo general</h2>
              {catalog.map(med => <MedCard key={med.id} med={med} />)}
            </div>
          </>
        )}

        <div className={styles.disclaimer}>
          <strong>⚕️ Aviso médico:</strong> Este comparador es solo informativo. Siempre consulta a tu médico antes de comprar o cambiar medicamentos. Los precios pueden variar según la farmacia y disponibilidad.
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MedicationsPage;
