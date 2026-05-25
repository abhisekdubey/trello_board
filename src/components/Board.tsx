import { DragDropContext } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import type { BoardData, Lead } from '../types';
import { Column } from './Column';

interface BoardProps {
  data: BoardData;
  onDragEnd: (result: DropResult) => void;
  onDeleteLead: (leadId: string) => void;
  onEditLead: (lead: Lead) => void;
}

export function Board({ data, onDragEnd, onDeleteLead, onEditLead }: BoardProps) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="board-container">
        {data.columnOrder.map((columnId) => {
          const column = data.columns[columnId];
          const leads = column.leadIds.map((leadId) => data.leads[leadId]);

          return (
            <Column
              key={column.id}
              column={column}
              leads={leads}
              onDeleteLead={onDeleteLead}
              onEditLead={onEditLead}
            />
          );
        })}
      </div>
    </DragDropContext>
  );
}
