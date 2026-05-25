import { Draggable } from '@hello-pangea/dnd';
import { Building2, Edit2, Trash2 } from 'lucide-react';
import type { Lead } from '../types';

interface CardProps {
  lead: Lead;
  index: number;
  onDelete: (leadId: string) => void;
  onEdit: (lead: Lead) => void;
}

export function Card({ lead, index, onDelete, onEdit }: CardProps) {
  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`card ${snapshot.isDragging ? 'is-dragging' : ''}`}
        >
          <div className="card-title">{lead.title}</div>
          
          <div className="card-company">
            <Building2 size={14} />
            {lead.company}
          </div>
          
          <div className="card-footer">
            <span className="card-value">
              ${lead.value.toLocaleString()}
            </span>
            
            <div className="card-actions">
              <button 
                className="action-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(lead);
                }}
                title="Edit Lead"
              >
                <Edit2 size={14} />
              </button>
              <button 
                className="action-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(lead.id);
                }}
                title="Delete Lead"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
