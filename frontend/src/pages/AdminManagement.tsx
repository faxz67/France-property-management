import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listAdmins, createAdmin, updateAdmin, deleteAdmin } from '../api';

const AdminManagement = () => {
  // Removed console.log to prevent excessive re-renders
  const [admins, setAdmins] = useState([]);
  // const _navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editId, setEditId] = useState(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('ADMIN');
  const [editIsActive, setEditIsActive] = useState(true);

  const fetchAdmins = async () => {
    try {
      // Check if token exists before making API calls
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, skipping admins API call');
        setAdmins([]);
        setError('No authentication token');
        return;
      }

      console.log('Fetching admins with token...');
      const response = await listAdmins();
      console.log('Admins response:', response.data); // Debug log
      if (response.data && response.data.success) {
        setAdmins(response.data.data?.admins || []);
        setError(''); // Clear any previous errors
      } else {
        setAdmins([]);
        setError('Failed to fetch admins');
      }
    } catch (e) {
      console.error('Error fetching admins:', e);
      setAdmins([]);
      setError(e.response?.data?.error || e.message || 'Failed to fetch admins');
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    setLoading(true); 
    setError(''); 
    setSuccess('');
    
    // Client-side validation
    if (!firstName.trim()) {
      setError('Le prénom est requis');
      setLoading(false);
      return;
    }
    if (!lastName.trim()) {
      setError('Le nom de famille est requis');
      setLoading(false);
      return;
    }
    if (!email.trim()) {
      setError('L\'email est requis');
      setLoading(false);
      return;
    }
    if (!password.trim()) {
      setError('Le mot de passe est requis');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }
    
    try {
      console.log('Creating admin with data:', { 
        name: `${firstName} ${lastName}`.trim(), 
        email, 
        password: '[HIDDEN]', 
        role 
      });
      
      const response = await createAdmin({ 
        name: `${firstName} ${lastName}`.trim(), 
        email, 
        password, 
        role 
      });
      
      console.log('Create admin response:', response.data); // Debug log
      
      if (response.data && response.data.success) {
        setSuccess('Administrateur créé avec succès!');
        setFirstName(''); 
        setLastName('');
        setEmail(''); 
        setPassword('');
        setRole('ADMIN');
        await fetchAdmins();
      } else {
        const errorMsg = response.data?.error || 'Échec de la création de l\'administrateur';
        setError(errorMsg);
        console.error('Failed to create admin:', response.data);
      }
    } catch (e) {
      console.error('Error creating admin:', e);
      const errorMsg = e?.response?.data?.error || 
                      e?.message || 
                      'Échec de la création de l\'administrateur. Veuillez réessayer.';
      setError(errorMsg);
      
      // Log full error for debugging
      if (e?.response?.data) {
        console.error('Error response data:', e.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (adminId, adminEmail) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'administrateur : ${adminEmail} ?`)) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('🗑️  Attempting to delete admin:', { adminId, adminEmail });
      
      const response = await deleteAdmin(adminId);
      console.log('Delete admin response:', response.data);
      
      if (response.data && response.data.success) {
        setSuccess('Administrateur supprimé avec succès!');
        await fetchAdmins();
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorMsg = response.data?.error || 'Échec de la suppression de l\'administrateur';
        setError(errorMsg);
        console.error('Failed to delete admin:', response.data);
      }
    } catch (e) {
      console.error('Error deleting admin:', e);
      const errorMsg = e?.response?.data?.error || 
                      e?.message || 
                      'Échec de la suppression de l\'administrateur. Veuillez réessayer.';
      setError(errorMsg);
      
      // Log full error for debugging
      if (e?.response?.data) {
        console.error('Error response data:', e.response.data);
      }
      if (e?.response?.status) {
        console.error('Error status:', e.response.status);
      }
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (a) => {
    setEditId(a.id);
    // Parse the name field into first and last name
    const nameParts = (a.name || a.fullname || '').split(' ');
    setEditFirstName(nameParts[0] || '');
    setEditLastName(nameParts.slice(1).join(' ') || '');
    setEditEmail(a.email || '');
    setEditPassword(''); // Always empty for security
    setEditRole(a.role || 'ADMIN');
    // Handle both status formats: 'ACTIVE'/'INACTIVE' or boolean is_active
    setEditIsActive(a.status === 'ACTIVE' || a.is_active === true);
    setError('');
    setSuccess('');
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditFirstName('');
    setEditLastName('');
    setEditEmail('');
    setEditPassword('');
    setEditRole('ADMIN');
    setEditIsActive(true);
    setError('');
    setSuccess('');
  };


  const onUpdate = async (e) => {
    e.preventDefault();
    if (!editId) return;
    
    setLoading(true); 
    setError('');
    setSuccess('');
    
    try {
      const payload = {};
      
      // Only include fields that have values
      if (editFirstName.trim() || editLastName.trim()) {
        payload.name = `${editFirstName} ${editLastName}`.trim();
      }
      if (editEmail.trim()) payload.email = editEmail.trim();
      if (editPassword.trim()) payload.password = editPassword.trim();
      if (editRole) payload.role = editRole;
      payload.status = editIsActive ? 'ACTIVE' : 'INACTIVE';
      
      console.log('Update payload:', payload); // Debug log
      
      const response = await updateAdmin(editId, payload);
      console.log('Update admin response:', response.data); // Debug log
      
      if (response.data && response.data.success) {
        setSuccess('Administrateur mis à jour avec succès!');
        cancelEdit();
        await fetchAdmins();
      } else {
        setError('Échec de la mise à jour de l\'administrateur');
      }
    } catch (e) {
      console.error('Error updating admin:', e);
      setError(e?.response?.data?.error || 'Échec de la mise à jour de l\'administrateur');
    } finally {
      setLoading(false);
    }
  };

  // Quick status update function
  const handleStatusChange = async (adminId, newStatus) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const payload = { status: newStatus };
      
      console.log('Quick status update payload:', payload);
      
      const response = await updateAdmin(adminId, payload);
      console.log('Quick status update response:', response.data);
      
      if (response.data && response.data.success) {
        const statusText = newStatus === 'ACTIVE' ? 'Actif' : 'Inactif';
        setSuccess(`Statut mis à jour : ${statusText}`);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
        await fetchAdmins();
      } else {
        setError('Échec de la mise à jour du statut');
      }
    } catch (e) {
      console.error('Error updating admin status:', e);
      setError(e?.response?.data?.error || 'Échec de la mise à jour du statut');
      // Clear error message after 5 seconds
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Administrateurs</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Gérer les administrateurs système
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Ajouter un Nouvel Administrateur</h2>
        <form onSubmit={onCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4" autoComplete="off">
          <input 
            className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            placeholder="Prénom" 
            value={firstName} 
            onChange={(e) => setFirstName(e.target.value)} 
            required 
            autoComplete="off" 
          />
          <input 
            className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            placeholder="Nom de Famille" 
            value={lastName} 
            onChange={(e) => setLastName(e.target.value)} 
            required 
            autoComplete="off" 
          />
          <input 
            className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            placeholder="Email" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            autoComplete="off" 
          />
          <input 
            className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            placeholder="Mot de passe" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            minLength={6}
            autoComplete="new-password" 
          />
          <select 
            className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            value={role} 
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="ADMIN">Administrateur</option>
            <option value="SUPER_ADMIN">Super Administrateur</option>
          </select>
          <button 
            disabled={loading} 
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-3 transition-colors disabled:opacity-50"
          >
            {loading ? 'Ajout...' : 'Ajouter Admin'}
          </button>
        </form>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600">{success}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold">Liste des Administrateurs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b bg-gray-50">
                <th className="p-4 font-medium">Nom</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Rôle</th>
                <th className="p-4 font-medium">Statut</th>
                <th className="p-4 font-medium">Créé</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{admin.name || admin.fullname}</td>
                  <td className="p-4">{admin.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      admin.role === 'SUPER_ADMIN' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Administrateur'}
                    </span>
                  </td>
                  <td className="p-4">
                    <select
                      value={(admin.status === 'ACTIVE' || admin.is_active === true) ? 'ACTIVE' : 'INACTIVE'}
                      onChange={(e) => handleStatusChange(admin.id, e.target.value)}
                      disabled={loading}
                      className={`px-3 py-1.5 rounded text-xs font-medium border-0 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      (admin.status === 'ACTIVE' || admin.is_active === true) 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <option value="ACTIVE">Actif</option>
                      <option value="INACTIVE">Inactif</option>
                    </select>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => startEdit(admin)} 
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        disabled={loading}
                      >
                        Modifier
                      </button>
                      <button 
                        onClick={() => onDelete(admin.id, admin.email)} 
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                        disabled={loading}
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr>
                  <td className="p-8 text-center text-gray-500" colSpan={6}>
                    Aucun administrateur trouvé. Ajoutez votre premier administrateur ci-dessus.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editId !== null && (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Modifier l'Administrateur</h2>
          <form onSubmit={onUpdate} className="space-y-4" autoComplete="off">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input 
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="Prénom" 
                  value={editFirstName} 
                  onChange={(e) => setEditFirstName(e.target.value)} 
                  required 
                  autoComplete="off" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de Famille</label>
                <input 
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="Nom de Famille" 
                  value={editLastName} 
                  onChange={(e) => setEditLastName(e.target.value)} 
                  required 
                  autoComplete="off" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="Email" 
                  type="email" 
                  value={editEmail} 
                  onChange={(e) => setEditEmail(e.target.value)} 
                  autoComplete="off" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau Mot de passe (optionnel)</label>
                <input 
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="Laisser vide pour conserver le mot de passe actuel" 
                  type="password" 
                  value={editPassword} 
                  onChange={(e) => setEditPassword(e.target.value)} 
                  autoComplete="new-password" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select 
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  value={editRole} 
                  onChange={(e) => setEditRole(e.target.value)}
                >
                  <option value="ADMIN">Administrateur</option>
                  <option value="SUPER_ADMIN">Super Administrateur</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="editIsActive" 
                checked={editIsActive} 
                onChange={(e) => setEditIsActive(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="editIsActive" className="text-sm font-medium text-gray-700">
                Compte Actif
              </label>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button 
                type="submit"
                disabled={loading} 
                className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-6 py-2 transition-colors disabled:opacity-50"
              >
                {loading ? 'Enregistrement...' : 'Enregistrer les Modifications'}
              </button>
              <button 
                type="button" 
                onClick={cancelEdit} 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg px-6 py-2 transition-colors"
              >
                Annuler
              </button>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600">{success}</p>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
