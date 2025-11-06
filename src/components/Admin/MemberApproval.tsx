import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../lib/auth';
import { UserCheck, UserX, Clock, Mail, Calendar, CheckCircle, XCircle } from 'lucide-react';

interface PendingUser {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  approval_status: string;
  created_at: string;
}

interface MemberApprovalProps {
  currentUser: User;
}

export function MemberApproval({ currentUser }: MemberApprovalProps) {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    loadUsers();
  }, [filter]);

  async function loadUsers() {
    setLoading(true);
    try {
      let query = supabase
        .from('users')
        .select('id, name, username, email, avatar, approval_status, created_at')
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('approval_status', 'pending');
      } else {
        query = query.in('approval_status', ['pending', 'rejected']);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPendingUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(userId: string, userName: string) {
    if (!confirm(`Approve ${userName}'s account?`)) return;

    setProcessingId(userId);
    try {
      // Update user status to approved
      const { error: updateError } = await supabase
        .from('users')
        .update({ approval_status: 'approved' })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Send approval notification to user
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'approval',
        title: 'Account Approved!',
        message: 'Your account has been approved. Welcome to the community! Get started by introducing yourself in the community feed.',
        link: '/feed',
        read: false,
      });

      // Reload users list
      await loadUsers();
    } catch (error: any) {
      console.error('Error approving user:', error);
      alert(`Failed to approve user: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(userId: string, userName: string) {
    const reason = prompt(`Enter rejection reason for ${userName}:`);
    if (!reason) return;

    setProcessingId(userId);
    try {
      // Update user status to rejected
      const { error: updateError } = await supabase
        .from('users')
        .update({ approval_status: 'rejected' })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Send rejection notification to user
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'rejection',
        title: 'Account Not Approved',
        message: `Your account application was not approved. Reason: ${reason}. Please contact an administrator for more information.`,
        link: '/feed',
        read: false,
      });

      // Reload users list
      await loadUsers();
    } catch (error: any) {
      console.error('Error rejecting user:', error);
      alert(`Failed to reject user: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Member Approvals</h3>
            <p className="text-sm text-gray-600 mt-1">
              Review and approve new member registrations
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({pendingUsers.filter(u => u.approval_status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {pendingUsers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <UserCheck className="mx-auto text-green-500 mb-4" size={48} />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {filter === 'pending' ? 'No Pending Approvals' : 'No Users Found'}
          </h3>
          <p className="text-gray-600">
            {filter === 'pending'
              ? 'All member registrations have been processed.'
              : 'No pending or rejected users to display.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingUsers.map((user) => (
            <div
              key={user.id}
              className={`bg-white rounded-lg shadow-sm p-6 border-2 ${
                user.approval_status === 'pending'
                  ? 'border-yellow-300'
                  : user.approval_status === 'rejected'
                  ? 'border-red-300'
                  : 'border-gray-200'
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
                    {user.approval_status === 'pending' && (
                      <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        <Clock size={12} />
                        Pending
                      </span>
                    )}
                    {user.approval_status === 'rejected' && (
                      <span className="flex items-center gap-1 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        <XCircle size={12} />
                        Rejected
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <span className="font-medium">@{user.username}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail size={14} />
                      {user.email}
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar size={14} />
                      Registered {new Date(user.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {user.approval_status === 'pending' && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleApprove(user.id, user.name)}
                      disabled={processingId === user.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle size={16} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(user.id, user.name)}
                      disabled={processingId === user.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                )}

                {user.approval_status === 'rejected' && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleApprove(user.id, user.name)}
                      disabled={processingId === user.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle size={16} />
                      Approve Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
