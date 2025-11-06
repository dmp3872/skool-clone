import { useState } from 'react';
import { User } from '../../lib/auth';
import { CourseManagement } from './CourseManagement';
import { PostModeration } from './PostModeration';
import { InviteManagement } from './InviteManagement';
import { UserManagement } from './UserManagement';
import { BookOpen, MessageSquare, Link as LinkIcon, Users, Shield } from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
}

type AdminView = 'courses' | 'posts' | 'invites' | 'users';

export function AdminDashboard({ currentUser }: AdminDashboardProps) {
  const [activeView, setActiveView] = useState<AdminView>('courses');

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
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'posts', label: 'Posts', icon: MessageSquare },
    { id: 'invites', label: 'Invites', icon: LinkIcon },
    { id: 'users', label: 'Users', icon: Users },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="text-yellow-600" size={32} />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
            <p className="text-gray-600">Manage your community platform</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap border-t pt-4">
          {adminViews.map((view) => {
            const Icon = view.icon;
            return (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id as AdminView)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeView === view.id
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon size={18} />
                {view.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        {activeView === 'courses' && <CourseManagement currentUser={currentUser} />}
        {activeView === 'posts' && <PostModeration currentUser={currentUser} />}
        {activeView === 'invites' && <InviteManagement currentUser={currentUser} />}
        {activeView === 'users' && <UserManagement currentUser={currentUser} />}
      </div>
    </div>
  );
}
