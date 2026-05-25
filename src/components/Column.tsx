import { Droppable } from '@hello-pangea/dnd';
import type { ColumnData, Lead } from '../types';
import { Card } from './Card';

interface ColumnProps {
  column: ColumnData;
  leads: Lead[];
  onDeleteLead: (leadId: string) => void;
  onEditLead: (lead: Lead) => void;
}

export function Column({ column, leads, onDeleteLead, onEditLead }: ColumnProps) {
  return (
    <div className="column">
      <div 
        className="column-header" 
        style={{ '--column-color': column.colorVar } as React.CSSProperties}
      >
        <span>{column.title}</span>
        <span className="column-count">{leads.length}</span>
      </div>
      
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`column-body ${snapshot.isDraggingOver ? 'is-dragging-over' : ''}`}
          >
            {leads.map((lead, index) => (
              <Card 
                key={lead.id} 
                lead={lead} 
                index={index} 
                onDelete={onDeleteLead}
                onEdit={onEditLead}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
