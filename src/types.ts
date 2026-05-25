export interface Lead {
  id: string;
  title: string;
  company: string;
  value: number;
  dateAdded: string;
  tenantId?: string;
}

export interface ColumnData {
  id: string;
  title: string;
  leadIds: string[];
  colorVar: string;
}

export interface BoardData {
  leads: Record<string, Lead>;
  columns: Record<string, ColumnData>;
  columnOrder: string[];
}
