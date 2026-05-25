import type { BoardData } from './types';

export const initialData: BoardData = {
  leads: {
    'lead-1': { id: 'lead-1', title: 'Website Redesign', company: 'Acme Corp', value: 5000, dateAdded: new Date().toISOString() },
    'lead-2': { id: 'lead-2', title: 'SEO Optimization', company: 'Globex', value: 2500, dateAdded: new Date().toISOString() },
    'lead-3': { id: 'lead-3', title: 'Mobile App MVP', company: 'Initech', value: 15000, dateAdded: new Date().toISOString() },
    'lead-4': { id: 'lead-4', title: 'Marketing Campaign', company: 'Soylent', value: 8000, dateAdded: new Date().toISOString() },
    'lead-5': { id: 'lead-5', title: 'E-commerce Setup', company: 'Massive Dynamic', value: 12000, dateAdded: new Date().toISOString() },
  },
  columns: {
    'col-leads': {
      id: 'col-leads',
      title: 'Leads',
      leadIds: ['lead-1', 'lead-2'],
      colorVar: 'var(--col-leads)',
    },
    'col-contacted': {
      id: 'col-contacted',
      title: 'Contacted',
      leadIds: ['lead-3'],
      colorVar: 'var(--col-contacted)',
    },
    'col-proposal': {
      id: 'col-proposal',
      title: 'Proposal Sent',
      leadIds: ['lead-4'],
      colorVar: 'var(--col-proposal)',
    },
    'col-negotiating': {
      id: 'col-negotiating',
      title: 'Negotiating',
      leadIds: [],
      colorVar: 'var(--col-negotiating)',
    },
    'col-won': {
      id: 'col-won',
      title: 'Won',
      leadIds: ['lead-5'],
      colorVar: 'var(--col-won)',
    },
  },
  columnOrder: ['col-leads', 'col-contacted', 'col-proposal', 'col-negotiating', 'col-won'],
};
