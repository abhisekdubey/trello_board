import { useState, useEffect } from 'react';
import type { DropResult } from '@hello-pangea/dnd';
import { Plus, LayoutDashboard, LogOut } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, collection, query, where } from 'firebase/firestore';

import { Board } from './components/Board';
import { Auth } from './components/Auth';
import { WorkspaceSetup } from './components/WorkspaceSetup';
import { auth, db } from './firebase';
import { initialData } from './data';
import type { BoardData, Lead } from './types';
import './App.css';

function App() {
  const [user, setUser] = useState<any>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // App State
  const [data, setData] = useState<BoardData>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    value: '',
    columnId: 'col-leads'
  });

  // Listen to Auth State
  useEffect(() => {
    if (!auth) {
      setLoadingAuth(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && db) {
        // Fetch user's tenantId
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setTenantId(userDoc.data().tenantId);
        } else {
          setTenantId(null);
        }
      } else {
        setTenantId(null);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync with Firestore Real-time DB
  useEffect(() => {
    if (!tenantId || !db) return;

    // Listen to all leads for this tenant
    const q = query(collection(db, 'leads'), where('tenantId', '==', tenantId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newLeads: Record<string, Lead> = {};
      const colAssignments: Record<string, string[]> = {
        'col-leads': [],
        'col-contacted': [],
        'col-proposal': [],
        'col-negotiating': [],
        'col-won': []
      };

      snapshot.forEach((doc) => {
        const lead = doc.data() as Lead;
        newLeads[lead.id] = lead;
        // In a real app we'd store the columnId on the lead itself for easier querying
        // For this demo, let's just map them based on a columnId field we'll add
        if ((lead as any).columnId && colAssignments[(lead as any).columnId]) {
          colAssignments[(lead as any).columnId].push(lead.id);
        } else {
          colAssignments['col-leads'].push(lead.id); // Default fallback
        }
      });

      setData(prev => {
        const newColumns = { ...prev.columns };
        for (const colId of prev.columnOrder) {
          newColumns[colId] = {
            ...newColumns[colId],
            leadIds: colAssignments[colId] || []
          };
        }
        return {
          ...prev,
          leads: newLeads,
          columns: newColumns
        };
      });
    });

    return () => unsubscribe();
  }, [tenantId]);

  const handleLogout = () => {
    if (auth) signOut(auth);
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Optimistic UI Update
    const startColumn = data.columns[source.droppableId];
    const finishColumn = data.columns[destination.droppableId];
    
    // Create new state
    let newData = { ...data };
    
    if (startColumn === finishColumn) {
      const newLeadIds = Array.from(startColumn.leadIds);
      newLeadIds.splice(source.index, 1);
      newLeadIds.splice(destination.index, 0, draggableId);
      
      newData.columns[startColumn.id].leadIds = newLeadIds;
    } else {
      const startLeadIds = Array.from(startColumn.leadIds);
      startLeadIds.splice(source.index, 1);
      
      const finishLeadIds = Array.from(finishColumn.leadIds);
      finishLeadIds.splice(destination.index, 0, draggableId);
      
      newData.columns[startColumn.id].leadIds = startLeadIds;
      newData.columns[finishColumn.id].leadIds = finishLeadIds;
    }
    
    setData(newData);

    // Sync to Firestore
    if (db && tenantId) {
      // We only need to update the columnId of the lead
      try {
        await setDoc(doc(db, 'leads', draggableId), { columnId: destination.droppableId }, { merge: true });
      } catch (e) {
        console.error("Failed to update Firestore:", e);
      }
    }
  };

  const handleOpenModal = (lead?: Lead) => {
    if (lead) {
      setEditingLead(lead);
      // Find which column the lead is in
      let columnId = 'col-leads';
      for (const colId of data.columnOrder) {
        if (data.columns[colId].leadIds.includes(lead.id)) {
          columnId = colId;
          break;
        }
      }
      setFormData({
        title: lead.title,
        company: lead.company,
        value: lead.value.toString(),
        columnId,
      });
    } else {
      setEditingLead(null);
      setFormData({
        title: '',
        company: '',
        value: '',
        columnId: 'col-leads'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !tenantId) return;

    const leadId = editingLead ? editingLead.id : uuidv4();
    const leadData = {
      id: leadId,
      title: formData.title,
      company: formData.company,
      value: parseFloat(formData.value) || 0,
      tenantId: tenantId,
      columnId: formData.columnId,
      dateAdded: editingLead ? editingLead.dateAdded : new Date().toISOString(),
    };

    setIsModalOpen(false);
    
    // Save to Firestore
    try {
      await setDoc(doc(db, 'leads', leadId), leadData);
    } catch (err) {
      console.error("Error saving lead:", err);
      alert("Failed to save lead to database.");
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    
    if (db) {
      // In a real app we'd delete the doc, but for this demo let's just set deleted flag or physically delete
      // Actually, let's just do a mock delete for now if we can't use deleteDoc easily without importing
      try {
        const { deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'leads', leadId));
      } catch (err) {
        console.error("Error deleting lead:", err);
      }
    }
  };

  if (loadingAuth) {
    return <div style={{display:'flex', height:'100vh', justifyContent:'center', alignItems:'center'}}>Loading...</div>;
  }

  // Routing
  if (!user) {
    return <Auth />;
  }

  if (!tenantId) {
    return <WorkspaceSetup userId={user.uid} userEmail={user.email} />;
  }

  // Main Board UI
  return (
    <div className="app-container">
      <header className="header">
        <h1 className="header-title">
          <LayoutDashboard size={28} />
          Pipeline
        </h1>
        <div style={{display:'flex', gap: '1rem', alignItems: 'center'}}>
          <span style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>{user.email}</span>
          <button className="btn btn-secondary" onClick={handleLogout} style={{padding: '0.4rem 0.8rem', display:'flex', alignItems:'center', gap:'0.5rem'}}>
            <LogOut size={16} /> Logout
          </button>
          <button className="add-lead-btn" onClick={() => handleOpenModal()}>
            <Plus size={20} />
            Add Lead
          </button>
        </div>
      </header>

      <Board 
        data={data} 
        onDragEnd={onDragEnd} 
        onDeleteLead={handleDeleteLead}
        onEditLead={handleOpenModal}
      />

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingLead ? 'Edit Lead' : 'New Lead'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Deal / Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Website Redesign"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Company / Contact</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  value={formData.company}
                  onChange={e => setFormData({...formData, company: e.target.value})}
                  placeholder="e.g. Acme Corp"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Estimated Value ($)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  required
                  min="0"
                  value={formData.value}
                  onChange={e => setFormData({...formData, value: e.target.value})}
                  placeholder="e.g. 5000"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Stage</label>
                <select 
                  className="form-select"
                  value={formData.columnId}
                  onChange={e => setFormData({...formData, columnId: e.target.value})}
                >
                  {data.columnOrder.map(colId => (
                    <option key={colId} value={colId}>
                      {data.columns[colId].title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingLead ? 'Save Changes' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
