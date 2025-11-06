import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../lib/auth';
import { Download, Mail, Users, Ban, CheckCircle, UserCheck } from 'lucide-react';

interface UserEmail {
  id: string;
  name: string;
  email: string;
  role: string;
  approval_status: string;
  isBanned?: boolean;
}

interface EmailExportProps {
  currentUser: User;
}

export function EmailExport({ currentUser }: EmailExportProps) {
  const [users, setUsers] = useState<UserEmail[]>([]);
  const [bans, setBans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    banned: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load all users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, role, approval_status')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Load active bans
      const { data: bansData, error: bansError } = await supabase
        .from('user_bans')
        .select('user_id')
        .eq('active', true);

      if (bansError) throw bansError;

      const bannedUserIds = new Set(bansData?.map(b => b.user_id) || []);
      const usersWithBanStatus = (usersData || []).map(user => ({
        ...user,
        isBanned: bannedUserIds.has(user.id),
      }));

      setUsers(usersWithBanStatus);
      setBans(bansData || []);

      // Calculate stats
      const approved = usersWithBanStatus.filter(u =>
        u.approval_status === 'approved' && !u.isBanned
      ).length;
      const pending = usersWithBanStatus.filter(u =>
        u.approval_status === 'pending'
      ).length;
      const banned = usersWithBanStatus.filter(u => u.isBanned).length;

      setStats({
        total: usersWithBanStatus.length,
        approved,
        pending,
        banned,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function exportEmails(filterType: 'all' | 'approved' | 'pending' | 'banned') {
    let filteredUsers: UserEmail[] = [];
    let filename = '';

    switch (filterType) {
      case 'all':
        filteredUsers = users;
        filename = 'all_users_emails.csv';
        break;
      case 'approved':
        filteredUsers = users.filter(u => u.approval_status === 'approved' && !u.isBanned);
        filename = 'approved_members_emails.csv';
        break;
      case 'pending':
        filteredUsers = users.filter(u => u.approval_status === 'pending');
        filename = 'pending_members_emails.csv';
        break;
      case 'banned':
        filteredUsers = users.filter(u => u.isBanned);
        filename = 'banned_users_emails.csv';
        break;
    }

    if (filteredUsers.length === 0) {
      alert('No users to export in this category');
      return;
    }

    // Create CSV content
    const headers = ['Name', 'Email', 'Role', 'Approval Status', 'Status'];
    const rows = filteredUsers.map(user => [
      user.name,
      user.email,
      user.role,
      user.approval_status,
      user.isBanned ? 'Banned' : 'Active'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function copyEmailsToClipboard(filterType: 'all' | 'approved' | 'pending' | 'banned') {
    let filteredUsers: UserEmail[] = [];

    switch (filterType) {
      case 'all':
        filteredUsers = users;
        break;
      case 'approved':
        filteredUsers = users.filter(u => u.approval_status === 'approved' && !u.isBanned);
        break;
      case 'pending':
        filteredUsers = users.filter(u => u.approval_status === 'pending');
        break;
      case 'banned':
        filteredUsers = users.filter(u => u.isBanned);
        break;
    }

    if (filteredUsers.length === 0) {
      alert('No users to copy in this category');
      return;
    }

    const emailList = filteredUsers.map(u => u.email).join(', ');
    navigator.clipboard.writeText(emailList);
    alert(`Copied ${filteredUsers.length} email(s) to clipboard!`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  const exportCategories = [
    {
      id: 'approved',
      label: 'Approved Members',
      description: 'Active, approved members (not banned)',
      count: stats.approved,
      icon: CheckCircle,
      color: 'green',
    },
    {
      id: 'pending',
      label: 'Pending Approval',
      description: 'Users waiting for admin approval',
      count: stats.pending,
      icon: UserCheck,
      color: 'yellow',
    },
    {
      id: 'banned',
      label: 'Banned Users',
      description: 'Users who have been banned',
      count: stats.banned,
      icon: Ban,
      color: 'red',
    },
    {
      id: 'all',
      label: 'All Users',
      description: 'Complete list of all registered users',
      count: stats.total,
      icon: Users,
      color: 'blue',
    },
  ];

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Mail className="text-yellow-600" size={24} />
          <div>
            <h3 className="text-xl font-bold text-gray-900">Email Export</h3>
            <p className="text-sm text-gray-600 mt-1">
              Export member emails by category for marketing and communication
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exportCategories.map((category) => {
          const Icon = category.icon;
          const colorClasses = {
            green: 'bg-green-50 border-green-200 text-green-700',
            yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
            red: 'bg-red-50 border-red-200 text-red-700',
            blue: 'bg-blue-50 border-blue-200 text-blue-700',
          };

          const buttonClasses = {
            green: 'bg-green-600 hover:bg-green-700',
            yellow: 'bg-yellow-600 hover:bg-yellow-700',
            red: 'bg-red-600 hover:bg-red-700',
            blue: 'bg-blue-600 hover:bg-blue-700',
          };

          return (
            <div
              key={category.id}
              className={`bg-white rounded-lg shadow-sm p-6 border-2 ${
                colorClasses[category.color as keyof typeof colorClasses]
              }`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  colorClasses[category.color as keyof typeof colorClasses]
                }`}>
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{category.label}</h3>
                  <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{category.count}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => exportEmails(category.id as any)}
                  disabled={category.count === 0}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    buttonClasses[category.color as keyof typeof buttonClasses]
                  }`}
                >
                  <Download size={16} />
                  Export CSV
                </button>
                <button
                  onClick={() => copyEmailsToClipboard(category.id as any)}
                  disabled={category.count === 0}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    buttonClasses[category.color as keyof typeof buttonClasses]
                  }`}
                >
                  <Mail size={16} />
                  Copy Emails
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
        <h4 className="font-bold text-gray-900 mb-2">Export Formats</h4>
        <ul className="space-y-1 text-sm text-gray-700">
          <li><strong>CSV Export:</strong> Downloads a spreadsheet file with Name, Email, Role, Approval Status, and Status columns</li>
          <li><strong>Copy Emails:</strong> Copies comma-separated email addresses to your clipboard for easy pasting</li>
        </ul>
      </div>
    </div>
  );
}
