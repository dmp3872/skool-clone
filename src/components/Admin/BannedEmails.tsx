import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../lib/auth';
import { Ban, Mail, Calendar, Trash2, AlertTriangle } from 'lucide-react';

interface BannedEmail {
  id: string;
  email: string;
  reason: string;
  banned_at: string;
  banned_by: string;
  banner_name?: string;
}

interface BannedEmailsProps {
  currentUser: User;
}

export function BannedEmails({ currentUser }: BannedEmailsProps) {
  const [bannedEmails, setBannedEmails] = useState<BannedEmail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBannedEmails();
  }, []);

  async function loadBannedEmails() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('banned_emails')
        .select(`
          *,
          banner:banned_by (
            name
          )
        `)
        .order('banned_at', { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map(item => ({
        ...item,
        banner_name: item.banner?.name || 'Unknown Admin',
      }));

      setBannedEmails(formattedData);
    } catch (error) {
      console.error('Error loading banned emails:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUnbanEmail(emailId: string, email: string) {
    if (!confirm(`Remove ${email} from permanent ban list? They will be able to register again.`)) return;

    try {
      const { error } = await supabase
        .from('banned_emails')
        .delete()
        .eq('id', emailId);

      if (error) {
        console.error('Error unbanning email:', error);
        alert(`Failed to unban email: ${error.message}`);
        return;
      }

      alert(`${email} has been removed from the ban list and can now register.`);
      loadBannedEmails();
    } catch (error) {
      console.error('Error unbanning email:', error);
      alert('Failed to unban email');
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
        <div className="flex items-center gap-3 mb-2">
          <Ban className="text-red-600" size={24} />
          <div>
            <h3 className="text-xl font-bold text-gray-900">Permanently Banned Emails</h3>
            <p className="text-sm text-gray-600 mt-1">
              These email addresses are blocked from all future registrations
            </p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-red-900">
              <strong>Important:</strong> Banned emails cannot register new accounts. Use "Kick Member"
              instead if you want to remove someone but allow them to return later.
            </div>
          </div>
        </div>
      </div>

      {bannedEmails.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Ban className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Banned Emails</h3>
          <p className="text-gray-600">
            No email addresses are currently on the permanent ban list.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bannedEmails.map((banned) => (
            <div
              key={banned.id}
              className="bg-white rounded-lg shadow-sm p-6 border-2 border-red-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="text-red-600" size={24} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 text-lg">{banned.email}</h3>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                      Permanently Banned
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <strong className="text-gray-900 min-w-20">Reason:</strong>
                      <span>{banned.reason}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-500" />
                      <span>Banned on {new Date(banned.banned_at).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Banned by: <strong>{banned.banner_name}</strong></span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleUnbanEmail(banned.id, banned.email)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  title="Remove from ban list"
                >
                  <Trash2 size={16} />
                  Unban Email
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
        <h4 className="font-bold text-gray-900 mb-2">Understanding Kick vs Ban</h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li><strong>Kick Member:</strong> Removes user from the platform. They can re-register with the same email address.</li>
          <li><strong>Ban Forever:</strong> Removes user AND permanently blocks their email from all future registrations.</li>
          <li><strong>Unban Email:</strong> Removes email from this permanent ban list, allowing future registrations.</li>
        </ul>
      </div>
    </div>
  );
}
