import { useState, useEffect } from 'react';
import { checkAuthState, getCurrentUser, logoutUser, User } from './lib/auth';
import { initializeDatabase } from './lib/database';
import { supabase } from './lib/supabase';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import { Feed } from './components/Feed/Feed';
import { Courses } from './components/Courses/Courses';
import { Leaderboard } from './components/Leaderboard/Leaderboard';
import { Events } from './components/Events/Events';
import { Profile } from './components/Profile/Profile';
import { Members } from './components/Members/Members';
import { Notifications } from './components/Notifications/Notifications';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import {
  Home,
  BookOpen,
  Trophy,
  Calendar,
  User as UserIcon,
  Users,
  Bell,
  LogOut,
  Shield,
  ChevronDown,
  MoreVertical,
} from 'lucide-react';

type View = 'feed' | 'courses' | 'leaderboard' | 'events' | 'profile' | 'members' | 'notifications' | 'admin';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [currentView, setCurrentView] = useState<View>('feed');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    initializeDatabase();
  }, []);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      if (user.role === 'admin' || user.role === 'moderator') {
        loadPendingApprovals();
      }
    }
  }, [user, currentView]);

  async function checkAuth() {
    setLoading(true);
    try {
      const session = await checkAuthState();
      if (session) {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadUnreadCount() {
    if (!user) return;

    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);

      setUnreadNotifications(count || 0);
    } catch (error) {
      console.error('Error loading notification count:', error);
    }
  }

  async function loadPendingApprovals() {
    if (!user) return;

    try {
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'pending');

      setPendingApprovals(count || 0);
    } catch (error) {
      console.error('Error loading pending approvals:', error);
    }
  }

  async function handleLogout() {
    await logoutUser();
    setUser(null);
    setCurrentView('feed');
  }

  async function handleAuthSuccess() {
    await checkAuth();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return authMode === 'login' ? (
      <Login onSuccess={handleAuthSuccess} onSwitchToRegister={() => setAuthMode('register')} />
    ) : (
      <Register onSuccess={handleAuthSuccess} onSwitchToLogin={() => setAuthMode('login')} />
    );
  }

  const navItems = [
    { id: 'feed', label: 'Feed', icon: Home },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifications },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  if (user.role === 'admin' || user.role === 'moderator') {
    navItems.push({ id: 'admin', label: 'Admin', icon: Shield, badge: pendingApprovals });
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {/* Header */}
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Logo/Brand - Clickable to Home */}
            <button
              onClick={() => setCurrentView('feed')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg md:text-xl">P</span>
              </div>
              <span className="text-lg md:text-xl font-bold text-gray-900">Peptide Price</span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id as View)}
                    className={`relative px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      currentView === item.id
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="hidden lg:inline">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                onClick={handleLogout}
                className="ml-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <LogOut size={18} />
                <span className="hidden lg:inline">Logout</span>
              </button>
            </div>

            {/* Mobile - Three Dots Menu */}
            <div className="md:hidden">
              <button
                onClick={() => setNavDropdownOpen(!navDropdownOpen)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
              >
                <MoreVertical size={20} className="text-gray-700" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        {currentView === 'feed' && <Feed currentUser={user} />}
        {currentView === 'courses' && <Courses currentUser={user} />}
        {currentView === 'leaderboard' && <Leaderboard currentUser={user} />}
        {currentView === 'events' && <Events currentUser={user} />}
        {currentView === 'profile' && <Profile currentUser={user} onUpdate={checkAuth} />}
        {currentView === 'members' && <Members currentUser={user} />}
        {currentView === 'notifications' && <Notifications currentUser={user} />}
        {currentView === 'admin' && <AdminDashboard currentUser={user} />}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
        <div className="flex items-center justify-around px-1" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {/* Community/Feed */}
          <button
            onClick={() => setCurrentView('feed')}
            className={`flex flex-col items-center justify-center py-2 px-3 flex-1 ${
              currentView === 'feed' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <Home size={24} strokeWidth={currentView === 'feed' ? 2.5 : 2} />
            <span className="text-[10px] mt-0.5 font-medium">Community</span>
          </button>

          {/* Courses */}
          <button
            onClick={() => setCurrentView('courses')}
            className={`flex flex-col items-center justify-center py-2 px-3 flex-1 ${
              currentView === 'courses' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <BookOpen size={24} strokeWidth={currentView === 'courses' ? 2.5 : 2} />
            <span className="text-[10px] mt-0.5 font-medium">Classroom</span>
          </button>

          {/* Calendar */}
          <button
            onClick={() => setCurrentView('events')}
            className={`flex flex-col items-center justify-center py-2 px-3 flex-1 ${
              currentView === 'events' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <Calendar size={24} strokeWidth={currentView === 'events' ? 2.5 : 2} />
            <span className="text-[10px] mt-0.5 font-medium">Calendar</span>
          </button>

          {/* Leaderboard */}
          <button
            onClick={() => setCurrentView('leaderboard')}
            className={`flex flex-col items-center justify-center py-2 px-3 flex-1 ${
              currentView === 'leaderboard' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <Trophy size={24} strokeWidth={currentView === 'leaderboard' ? 2.5 : 2} />
            <span className="text-[10px] mt-0.5 font-medium">Leaderboard</span>
          </button>

          {/* Profile */}
          <button
            onClick={() => setCurrentView('profile')}
            className={`flex flex-col items-center justify-center py-2 px-3 flex-1 ${
              currentView === 'profile' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <UserIcon size={24} strokeWidth={currentView === 'profile' ? 2.5 : 2} />
            <span className="text-[10px] mt-0.5 font-medium">Profile</span>
          </button>
        </div>
      </nav>

      {/* Three Dots Menu Dropdown (Mobile) */}
      {navDropdownOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={() => setNavDropdownOpen(false)}
          ></div>

          {/* Menu */}
          <div className="md:hidden fixed top-14 right-2 w-64 bg-white rounded-lg shadow-2xl z-50 border">
            {/* Members */}
            <button
              onClick={() => {
                setCurrentView('members');
                setNavDropdownOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 first:rounded-t-lg ${
                currentView === 'members' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Users size={20} />
              <span className="font-medium">Members</span>
            </button>

            {/* Notifications */}
            <button
              onClick={() => {
                setCurrentView('notifications');
                setNavDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 ${
                currentView === 'notifications' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell size={20} />
                <span className="font-medium">Notifications</span>
              </div>
              {unreadNotifications > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>

            {/* Admin (if applicable) */}
            {(user.role === 'admin' || user.role === 'moderator') && (
              <button
                onClick={() => {
                  setCurrentView('admin');
                  setNavDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 ${
                  currentView === 'admin' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Shield size={20} />
                  <span className="font-medium">Admin</span>
                </div>
                {pendingApprovals > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                    {pendingApprovals > 9 ? '9+' : pendingApprovals}
                  </span>
                )}
              </button>
            )}

            {/* Logout */}
            <button
              onClick={() => {
                handleLogout();
                setNavDropdownOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 border-t last:rounded-b-lg"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </>
      )}

      {/* Desktop Footer */}
      <footer className="hidden md:block bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-gray-600">
            <p className="mb-2">
              Welcome, <span className="font-semibold">{user.name}</span>! You have{' '}
              <span className="font-bold text-blue-600">{user.points}</span> points and are{' '}
              <span className="font-bold text-blue-600">Level {user.level}</span>
            </p>
            <p className="text-sm text-gray-500">
              Peptide Price Community - Your trusted peptide resource
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
