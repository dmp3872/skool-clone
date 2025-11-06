import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../lib/auth';
import { Search, Ban, ShieldCheck, Shield, CheckCircle } from 'lucide-react';

interface ManagedUser {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  role: string;
  points: number;
  level: number;
  created_at: string;
  isBanned?: boolean;
}

interface UserBan {
  id: string;
  user_id: string;
  reason: string;
  banned_at: string;
  active: boolean;
}

interface UserManagementProps {
  currentUser: User;
}

export function UserManagement({ currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [bans, setBans] = useState<UserBan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showBanned, setShowBanned] = useState(false);

  useEffect(() => {
    loadUsers();
    loadBans();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadBans() {
    try {
      const { data, error } = await supabase
        .from('user_bans')
        .select('*')
        .eq('active', true);

      if (error) throw error;
      setBans(data || []);
    } catch (error) {
      console.error('Error loading bans:', error);
    }
  }

  async function handleChangeRole(userId: string, newRole: string) {
    if (!confirm(`Change user role to ${newRole}?`)) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        console.error('Error changing role:', error);
        alert(`Failed to change role: ${error.message}`);
        return;
      }

      loadUsers();
    } catch (error) {
      console.error('Error changing role:', error);
      alert('Failed to change role');
    }
  }

  async function handleBanUser(userId: string) {
    const reason = prompt('Enter ban reason:');
    if (!reason) return;

    try {
      const { error } = await supabase.from('user_bans').insert({
        user_id: userId,
        banned_by: currentUser.id,
        reason,
        active: true,
      });

      if (error) {
        console.error('Error banning user:', error);
        alert(`Failed to ban user: ${error.message}`);
        return;
      }

      loadBans();
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Failed to ban user');
    }
  }

  async function handleUnbanUser(userId: string) {
    if (!confirm('Unban this user?')) return;

    try {
      const { error } = await supabase
        .from('user_bans')
        .update({ active: false, unbanned_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('active', true);

      if (error) {
        console.error('Error unbanning user:', error);
        alert(`Failed to unban user: ${error.message}`);
        return;
      }

      loadBans();
    } catch (error) {
      console.error('Error unbanning user:', error);
      alert('Failed to unban user');
    }
  }

  const bannedUserIds = new Set(bans.map(b => b.user_id));
  const usersWithBanStatus = users.map(user => ({
    ...user,
    isBanned: bannedUserIds.has(user.id),
  }));

  let filteredUsers = usersWithBanStatus.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filterRole !== 'all') {
    filteredUsers = filteredUsers.filter((u) => u.role === filterRole);
  }

  if (showBanned) {
    filteredUsers = filteredUsers.filter((u) => u.isBanned);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, username, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-4 items-center">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="member">Member</option>
            </select>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showBanned}
                onChange={(e) => setShowBanned(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Show only banned users</span>
            </label>
          </div>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">No users found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user) => {
            const isCurrentUser = user.id === currentUser.id;
            const userBan = bans.find(b => b.user_id === user.id);

            return (
              <div
                key={user.id}
                className={`bg-white rounded-lg shadow-sm p-6 ${
                  user.isBanned ? 'border-2 border-red-300' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-16 h-16 rounded-full"
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{user.name}</h3>
                      {isCurrentUser && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                          You
                        </span>
                      )}
                      {user.isBanned && (
                        <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full">
                          Banned
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      @{user.username} • {user.email}
                    </p>

                    <div className="flex items-center gap-4 text-sm">
                      <span className={`px-3 py-1 rounded-full font-medium ${
                        user.role === 'admin'
                          ? 'bg-red-100 text-red-700'
                          : user.role === 'moderator'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                      <span className="text-gray-600">Level {user.level}</span>
                      <span className="text-gray-600">{user.points} points</span>
                      <span className="text-gray-500">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {userBan && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-900">
                          <strong>Ban reason:</strong> {userBan.reason}
                        </p>
                        <p className="text-xs text-red-700 mt-1">
                          Banned on {new Date(userBan.banned_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {!isCurrentUser && (
                    <div className="flex flex-col gap-2">
                      {!user.isBanned ? (
                        <>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleChangeRole(user.id, 'admin')}
                              disabled={user.role === 'admin'}
                              className={`p-2 rounded-lg transition-colors ${
                                user.role === 'admin'
                                  ? 'bg-red-100 text-red-600'
                                  : 'text-gray-600 hover:bg-red-50'
                              }`}
                              title="Make Admin"
                            >
                              <ShieldCheck size={20} />
                            </button>
                            <button
                              onClick={() => handleChangeRole(user.id, 'moderator')}
                              disabled={user.role === 'moderator'}
                              className={`p-2 rounded-lg transition-colors ${
                                user.role === 'moderator'
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'text-gray-600 hover:bg-blue-50'
                              }`}
                              title="Make Moderator"
                            >
                              <Shield size={20} />
                            </button>
                            <button
                              onClick={() => handleChangeRole(user.id, 'member')}
                              disabled={user.role === 'member'}
                              className={`p-2 rounded-lg transition-colors ${
                                user.role === 'member'
                                  ? 'bg-gray-100 text-gray-600'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                              title="Make Member"
                            >
                              <CheckCircle size={20} />
                            </button>
                          </div>
                          <button
                            onClick={() => handleBanUser(user.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                          >
                            <Ban size={16} />
                            Ban User
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleUnbanUser(user.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <CheckCircle size={16} />
                          Unban User
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
