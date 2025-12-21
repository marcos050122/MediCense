import { FieldDefinition } from './types';

export const DEFAULT_FIELDS: FieldDefinition[] = [
  { id: 'total_houses', label: 'Total de casas', type: 'number', isActive: true, order: 1 },
  { id: 'houses_visited', label: 'Casas Vistas/Pesquisadas', type: 'number', isActive: true, order: 2 },
  { id: 'total_pop', label: 'Total de población', type: 'number', isActive: true, order: 3 },
  { id: 'over_80', label: 'Mayores de 80', type: 'number', isActive: true, order: 4 },
  { id: 'over_60', label: 'Mayores de 60', type: 'number', isActive: true, order: 5 },
  { id: 'pregnant', label: 'Embarazadas', type: 'number', isActive: true, order: 6 },
  { id: 'infants', label: 'Lactantes/Menores 2 años', type: 'number', isActive: true, order: 7 },
  { id: 'sick', label: 'Enfermos', type: 'number', isActive: true, order: 8 },
  { id: 'vulnerable', label: 'Vulnerables', type: 'number', isActive: false, order: 9 },
  { id: 'solo_seniors', label: 'Mayores solos', type: 'number', isActive: false, order: 10 },
];
