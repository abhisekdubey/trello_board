import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Building2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface WorkspaceSetupProps {
  userId: string;
  userEmail: string;
}

export function WorkspaceSetup({ userId, userEmail }: WorkspaceSetupProps) {
  const [workspaceName, setWorkspaceName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    
    setError('');
    setLoading(true);

    try {
      // 1. Create a new Tenant document
      const tenantId = uuidv4();
      await setDoc(doc(db, 'tenants', tenantId), {
        id: tenantId,
        name: workspaceName,
        createdAt: new Date().toISOString(),
        ownerId: userId
      });

      // 2. Update the User document with the tenantId
      await setDoc(doc(db, 'users', userId), {
        uid: userId,
        email: userEmail,
        tenantId: tenantId,
        role: 'admin'
      });
      
      // User will now be subscribed to the board
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create workspace');
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass" style={{ padding: '2.5rem', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '450px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Building2 size={48} style={{ color: 'var(--accent-blue)', marginBottom: '1rem' }} />
          <h2>Create Your Workspace</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
            Set up a dedicated multi-tenant space for your team's CRM pipeline.
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(236, 72, 153, 0.1)', color: 'var(--accent-pink)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleCreateWorkspace}>
          <div className="form-group">
            <label className="form-label">Workspace / Company Name</label>
            <input 
              type="text" 
              className="form-input" 
              required
              value={workspaceName}
              onChange={e => setWorkspaceName(e.target.value)}
              placeholder="e.g. Acme Corp"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Workspace'}
          </button>
        </form>
      </div>
    </div>
  );
}
