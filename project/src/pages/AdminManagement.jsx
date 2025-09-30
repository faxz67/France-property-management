import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// @ts-ignore
import { listAdmins, createAdmin, updateAdmin, deleteAdmin } from '../api.js';

const AdminManagement = () => {
  console.log('AdminManagement component rendered');
  const [admins, setAdmins] = useState([]);
  const navigate = useNavigate();
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
      const response = await listAdmins();
      console.log('Admins response:', response.data); // Debug log
      if (response.data && response.data.success) {
        setAdmins(response.data.data?.admins || []);
      } else {
        setAdmins([]);
        setError('Failed to fetch admins');
      }
    } catch (e) {
      console.error('Error fetching admins:', e);
      setAdmins([]);
      setError(e.response?.data?.error || 'Failed to fetch admins');
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
      setError('First name is required');
      setLoading(false);
      return;
    }
    if (!lastName.trim()) {
      setError('Last name is required');
      setLoading(false);
      return;
    }
    if (!email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }
    if (!password.trim()) {
      setError('Password is required');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
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
        setSuccess('Admin created successfully!');
        setFirstName(''); 
        setLastName('');
        setEmail(''); 
        setPassword('');
        setRole('ADMIN');
        await fetchAdmins();
      } else {
        setError('Failed to create admin');
      }
    } catch (e) {
      console.error('Error creating admin:', e);
      setError(e?.response?.data?.error || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (adminId, adminEmail) => {
    if (!window.confirm(`Are you sure you want to delete admin: ${adminEmail}?`)) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await deleteAdmin(adminId);
      console.log('Delete admin response:', response.data); // Debug log
      
      if (response.data && response.data.success) {
        setSuccess('Admin deleted successfully!');
        await fetchAdmins();
      } else {
        setError('Failed to delete admin');
      }
    } catch (e) {
      console.error('Error deleting admin:', e);
      setError(e?.response?.data?.error || 'Failed to delete admin');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (a) => {
    setEditId(a.id);
    // Parse the name field into first and last name
    const nameParts = (a.name || '').split(' ');
    setEditFirstName(nameParts[0] || '');
    setEditLastName(nameParts.slice(1).join(' ') || '');
    setEditEmail(a.email || '');
    setEditPassword(''); // Always empty for security
    setEditRole(a.role || 'ADMIN');
    setEditIsActive(a.status === 'ACTIVE');
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
        setSuccess('Admin updated successfully!');
        cancelEdit();
        await fetchAdmins();
      } else {
        setError('Failed to update admin');
      }
    } catch (e) {
      console.error('Error updating admin:', e);
      setError(e?.response?.data?.error || 'Failed to update admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
        <div className="text-sm text-gray-500">
          Manage system administrators
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Add New Admin</h2>
        <form onSubmit={onCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4" autoComplete="off">
          <input 
            className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            placeholder="First Name" 
            value={firstName} 
            onChange={(e) => setFirstName(e.target.value)} 
            required 
            autoComplete="off" 
          />
          <input 
            className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            placeholder="Last Name" 
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
            placeholder="Password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            minLength={8}
            autoComplete="new-password" 
          />
          <select 
            className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            value={role} 
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="ADMIN">Regular Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
          <button 
            disabled={loading} 
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-3 transition-colors disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Admin'}
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
          <h2 className="text-lg font-semibold">Admin List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b bg-gray-50">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Created</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{admin.fullname}</td>
                  <td className="p-4">{admin.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      admin.role === 'SUPER_ADMIN' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      admin.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {admin.is_active ? 'Active' : 'Inactive'}
                    </span>
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
                        Edit
                      </button>
                      <button 
                        onClick={() => onDelete(admin.id, admin.email)} 
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr>
                  <td className="p-8 text-center text-gray-500" colSpan={6}>
                    No admins found. Add your first admin above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editId !== null && (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Edit Admin</h2>
          <form onSubmit={onUpdate} className="space-y-4" autoComplete="off">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input 
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="First Name" 
                  value={editFirstName} 
                  onChange={(e) => setEditFirstName(e.target.value)} 
                  required 
                  autoComplete="off" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input 
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="Last Name" 
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
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password (optional)</label>
                <input 
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="Leave empty to keep current password" 
                  type="password" 
                  value={editPassword} 
                  onChange={(e) => setEditPassword(e.target.value)} 
                  autoComplete="new-password" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select 
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  value={editRole} 
                  onChange={(e) => setEditRole(e.target.value)}
                >
                  <option value="ADMIN">Regular Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
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
                Account Active
              </label>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button 
                type="submit"
                disabled={loading} 
                className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-6 py-2 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                type="button" 
                onClick={cancelEdit} 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg px-6 py-2 transition-colors"
              >
                Cancel
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
