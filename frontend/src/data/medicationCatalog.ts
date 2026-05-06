
export interface MedCatalogItem {
  id: string;
  name: string;      
  generic: string;   
  doseLabel: string;  
  category: string;
}

const CAT: MedCatalogItem[] = [
  { id:'amoxi-250', name:'Amoxicilina 250mg',       generic:'Amoxicilina',       doseLabel:'250 mg', category:'Antibióticos' },
  { id:'amoxi-500', name:'Amoxicilina 500mg',       generic:'Amoxicilina',       doseLabel:'500 mg', category:'Antibióticos' },
  { id:'amoxi-875', name:'Amoxicilina 875mg',       generic:'Amoxicilina',       doseLabel:'875 mg', category:'Antibióticos' },
  { id:'azit-250',  name:'Azitromicina 250mg',      generic:'Azitromicina',      doseLabel:'250 mg', category:'Antibióticos' },
  { id:'azit-500',  name:'Azitromicina 500mg',      generic:'Azitromicina',      doseLabel:'500 mg', category:'Antibióticos' },
  { id:'cipro-250', name:'Ciprofloxacino 250mg',    generic:'Ciprofloxacino',    doseLabel:'250 mg', category:'Antibióticos' },
  { id:'cipro-500', name:'Ciprofloxacino 500mg',    generic:'Ciprofloxacino',    doseLabel:'500 mg', category:'Antibióticos' },
  { id:'metro-250', name:'Metronidazol 250mg',      generic:'Metronidazol',      doseLabel:'250 mg', category:'Antibióticos' },
  { id:'metro-500', name:'Metronidazol 500mg',      generic:'Metronidazol',      doseLabel:'500 mg', category:'Antibióticos' },
  { id:'clari-250', name:'Claritromicina 250mg',    generic:'Claritromicina',    doseLabel:'250 mg', category:'Antibióticos' },
  { id:'clari-500', name:'Claritromicina 500mg',    generic:'Claritromicina',    doseLabel:'500 mg', category:'Antibióticos' },
  { id:'trim-800',  name:'Trimetoprim/Sulfametoxazol 800mg', generic:'TMP/SMX', doseLabel:'800 mg', category:'Antibióticos' },

  { id:'ibu-200',   name:'Ibuprofeno 200mg',        generic:'Ibuprofeno',        doseLabel:'200 mg', category:'Analgésicos' },
  { id:'ibu-400',   name:'Ibuprofeno 400mg',        generic:'Ibuprofeno',        doseLabel:'400 mg', category:'Analgésicos' },
  { id:'ibu-600',   name:'Ibuprofeno 600mg',        generic:'Ibuprofeno',        doseLabel:'600 mg', category:'Analgésicos' },
  { id:'para-325',  name:'Paracetamol 325mg',       generic:'Paracetamol',       doseLabel:'325 mg', category:'Analgésicos' },
  { id:'para-500',  name:'Paracetamol 500mg',       generic:'Paracetamol',       doseLabel:'500 mg', category:'Analgésicos' },
  { id:'para-1g',   name:'Paracetamol 1g',          generic:'Paracetamol',       doseLabel:'1000 mg',category:'Analgésicos' },
  { id:'napro-250', name:'Naproxeno 250mg',         generic:'Naproxeno',         doseLabel:'250 mg', category:'Analgésicos' },
  { id:'napro-500', name:'Naproxeno 500mg',         generic:'Naproxeno',         doseLabel:'500 mg', category:'Analgésicos' },
  { id:'diclo-50',  name:'Diclofenaco 50mg',        generic:'Diclofenaco',       doseLabel:'50 mg',  category:'Analgésicos' },
  { id:'keto-10',   name:'Ketorolaco 10mg',         generic:'Ketorolaco',        doseLabel:'10 mg',  category:'Analgésicos' },
  { id:'aceta-500', name:'Acetaminofén 500mg',      generic:'Acetaminofén',      doseLabel:'500 mg', category:'Analgésicos' },

  { id:'ome-10',    name:'Omeprazol 10mg',          generic:'Omeprazol',         doseLabel:'10 mg',  category:'Gastrointestinal' },
  { id:'ome-20',    name:'Omeprazol 20mg',          generic:'Omeprazol',         doseLabel:'20 mg',  category:'Gastrointestinal' },
  { id:'ome-40',    name:'Omeprazol 40mg',          generic:'Omeprazol',         doseLabel:'40 mg',  category:'Gastrointestinal' },
  { id:'panto-20',  name:'Pantoprazol 20mg',        generic:'Pantoprazol',       doseLabel:'20 mg',  category:'Gastrointestinal' },
  { id:'panto-40',  name:'Pantoprazol 40mg',        generic:'Pantoprazol',       doseLabel:'40 mg',  category:'Gastrointestinal' },
  { id:'meta-10',   name:'Metoclopramida 10mg',     generic:'Metoclopramida',    doseLabel:'10 mg',  category:'Gastrointestinal' },
  { id:'onda-4',    name:'Ondansetrón 4mg',         generic:'Ondansetrón',       doseLabel:'4 mg',   category:'Gastrointestinal' },
  { id:'onda-8',    name:'Ondansetrón 8mg',         generic:'Ondansetrón',       doseLabel:'8 mg',   category:'Gastrointestinal' },
  { id:'lope-2',    name:'Loperamida 2mg',          generic:'Loperamida',        doseLabel:'2 mg',   category:'Gastrointestinal' },
  { id:'ranie-150', name:'Ranitidina 150mg',        generic:'Ranitidina',        doseLabel:'150 mg', category:'Gastrointestinal' },

  { id:'losar-25',  name:'Losartán 25mg',           generic:'Losartán',          doseLabel:'25 mg',  category:'Cardiovascular' },
  { id:'losar-50',  name:'Losartán 50mg',           generic:'Losartán',          doseLabel:'50 mg',  category:'Cardiovascular' },
  { id:'losar-100', name:'Losartán 100mg',          generic:'Losartán',          doseLabel:'100 mg', category:'Cardiovascular' },
  { id:'enala-5',   name:'Enalapril 5mg',           generic:'Enalapril',         doseLabel:'5 mg',   category:'Cardiovascular' },
  { id:'enala-10',  name:'Enalapril 10mg',          generic:'Enalapril',         doseLabel:'10 mg',  category:'Cardiovascular' },
  { id:'amlo-5',    name:'Amlodipino 5mg',          generic:'Amlodipino',        doseLabel:'5 mg',   category:'Cardiovascular' },
  { id:'amlo-10',   name:'Amlodipino 10mg',         generic:'Amlodipino',        doseLabel:'10 mg',  category:'Cardiovascular' },
  { id:'ator-10',   name:'Atorvastatina 10mg',      generic:'Atorvastatina',     doseLabel:'10 mg',  category:'Cardiovascular' },
  { id:'ator-20',   name:'Atorvastatina 20mg',      generic:'Atorvastatina',     doseLabel:'20 mg',  category:'Cardiovascular' },
  { id:'ator-40',   name:'Atorvastatina 40mg',      generic:'Atorvastatina',     doseLabel:'40 mg',  category:'Cardiovascular' },
  { id:'meto-25',   name:'Metoprolol 25mg',         generic:'Metoprolol',        doseLabel:'25 mg',  category:'Cardiovascular' },
  { id:'meto-50',   name:'Metoprolol 50mg',         generic:'Metoprolol',        doseLabel:'50 mg',  category:'Cardiovascular' },
  { id:'asa-81',    name:'Ácido Acetilsalicílico 81mg', generic:'Aspirina',     doseLabel:'81 mg',  category:'Cardiovascular' },

  { id:'metf-500',  name:'Metformina 500mg',        generic:'Metformina',        doseLabel:'500 mg', category:'Diabetes' },
  { id:'metf-850',  name:'Metformina 850mg',        generic:'Metformina',        doseLabel:'850 mg', category:'Diabetes' },
  { id:'metf-1000', name:'Metformina 1000mg',       generic:'Metformina',        doseLabel:'1000 mg',category:'Diabetes' },
  { id:'glib-5',    name:'Glibenclamida 5mg',       generic:'Glibenclamida',     doseLabel:'5 mg',   category:'Diabetes' },
  { id:'sita-100',  name:'Sitagliptina 100mg',      generic:'Sitagliptina',      doseLabel:'100 mg', category:'Diabetes' },

  { id:'salb-inh',  name:'Salbutamol Inhalador 100mcg', generic:'Salbutamol',   doseLabel:'100 mcg/dosis', category:'Respiratorio' },
  { id:'bude-inh',  name:'Budesonida Inhalador 200mcg', generic:'Budesonida',   doseLabel:'200 mcg/dosis', category:'Respiratorio' },
  { id:'monte-4',   name:'Montelukast 4mg',         generic:'Montelukast',       doseLabel:'4 mg',   category:'Respiratorio' },
  { id:'monte-10',  name:'Montelukast 10mg',         generic:'Montelukast',      doseLabel:'10 mg',  category:'Respiratorio' },

  { id:'ceti-5',    name:'Cetirizina 5mg',          generic:'Cetirizina',        doseLabel:'5 mg',   category:'Antihistamínicos' },
  { id:'ceti-10',   name:'Cetirizina 10mg',         generic:'Cetirizina',        doseLabel:'10 mg',  category:'Antihistamínicos' },
  { id:'lora-10',   name:'Loratadina 10mg',         generic:'Loratadina',        doseLabel:'10 mg',  category:'Antihistamínicos' },
  { id:'difen-25',  name:'Difenhidramina 25mg',     generic:'Difenhidramina',    doseLabel:'25 mg',  category:'Antihistamínicos' },

  { id:'levo-25',   name:'Levotiroxina 25mcg',      generic:'Levotiroxina',      doseLabel:'25 mcg', category:'Tiroides' },
  { id:'levo-50',   name:'Levotiroxina 50mcg',      generic:'Levotiroxina',      doseLabel:'50 mcg', category:'Tiroides' },
  { id:'levo-100',  name:'Levotiroxina 100mcg',     generic:'Levotiroxina',      doseLabel:'100 mcg',category:'Tiroides' },

  { id:'sert-25',   name:'Sertralina 25mg',         generic:'Sertralina',        doseLabel:'25 mg',  category:'Psiquiatría' },
  { id:'sert-50',   name:'Sertralina 50mg',         generic:'Sertralina',        doseLabel:'50 mg',  category:'Psiquiatría' },
  { id:'fluo-10',   name:'Fluoxetina 10mg',         generic:'Fluoxetina',        doseLabel:'10 mg',  category:'Psiquiatría' },
  { id:'fluo-20',   name:'Fluoxetina 20mg',         generic:'Fluoxetina',        doseLabel:'20 mg',  category:'Psiquiatría' },
  { id:'alpr-25',   name:'Alprazolam 0.25mg',       generic:'Alprazolam',        doseLabel:'0.25 mg',category:'Psiquiatría' },
  { id:'alpr-50',   name:'Alprazolam 0.5mg',        generic:'Alprazolam',        doseLabel:'0.5 mg', category:'Psiquiatría' },

  { id:'folico-5',  name:'Ácido Fólico 5mg',        generic:'Ácido Fólico',      doseLabel:'5 mg',   category:'Vitaminas' },
  { id:'hierro-325',name:'Sulfato Ferroso 325mg',   generic:'Sulfato Ferroso',   doseLabel:'325 mg', category:'Vitaminas' },
  { id:'vitd-1000', name:'Vitamina D3 1000 UI',     generic:'Colecalciferol',    doseLabel:'1000 UI',category:'Vitaminas' },
  { id:'calcio-600',name:'Calcio 600mg',            generic:'Carbonato de Calcio',doseLabel:'600 mg',category:'Vitaminas' },
];

export default CAT;

export const CATEGORIES = [...new Set(CAT.map(m => m.category))].sort();
