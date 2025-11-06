import { useState } from 'react';
import { User } from '../../lib/auth';
import { CourseManagement } from './CourseManagement';
import { PostModeration } from './PostModeration';
import { InviteManagement } from './InviteManagement';
import { UserManagement } from './UserManagement';
import { MemberApproval } from './MemberApproval';
import { EmailExport } from './EmailExport';
import { BookOpen, MessageSquare, Link as LinkIcon, Users, Shield, UserCheck, Mail } from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
}

type AdminView = 'approvals' | 'users' | 'emails' | 'courses' | 'posts' | 'invites';

export function AdminDashboard({ currentUser }: AdminDashboardProps) {
  const [activeView, setActiveView] = useState<AdminView>('approvals');

  if (currentUser.role !== 'admin' && currentUser.role !== 'moderator') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-12 text-center">
          <Shield className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  const adminViews = [
    { id: 'approvals', label: 'Approvals', icon: UserCheck },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'emails', label: 'Emails', icon: Mail },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'posts', label: 'Posts', icon: MessageSquare },
    { id: 'invites', label: 'Invites', icon: LinkIcon },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="text-blue-600" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Admin Dashboard</h2>
              <p className="text-sm text-gray-600">Manage your community platform</p>
            </div>
          </div>
        </div>

        <div className="px-2 py-2">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {adminViews.map((view) => {
              const Icon = view.icon;
              return (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id as AdminView)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                    activeView === view.id
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} />
                  <span>{view.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        {activeView === 'approvals' && <MemberApproval currentUser={currentUser} />}
        {activeView === 'users' && <UserManagement currentUser={currentUser} />}
        {activeView === 'emails' && <EmailExport currentUser={currentUser} />}
        {activeView === 'courses' && <CourseManagement currentUser={currentUser} />}
        {activeView === 'posts' && <PostModeration currentUser={currentUser} />}
        {activeView === 'invites' && <InviteManagement currentUser={currentUser} />}
      </div>
    </div>
  );
}
