import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import AdminTabs from '../../components/AdminTabs';

export default function AdminUsers() {
  const [users, setUsers] = useState(null);
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const load = () => api.get('/admin/users').then(setUsers);

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (id, role) => {
    try {
      await api.put(`/admin/users/${id}/role`, { role });
      showToast('Role updated', 'success');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div data-testid="admin-users-page">
      <h1 className="page-title">Admin</h1>
      <AdminTabs />

      {!users ? (
        <div className="page-loading">Loading...</div>
      ) : (
        <table className="data-table" data-testid="admin-users-table">
          <thead><tr><th>Name</th><th>Email</th><th>Verified</th><th>Role</th></tr></thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} data-testid="admin-user-row" data-user-id={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.email_verified ? <span className="badge badge-success">Yes</span> : <span className="badge badge-warning">No</span>}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={user.id === currentUser.id}
                    data-testid="admin-user-role-select"
                  >
                    <option value="customer">customer</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
