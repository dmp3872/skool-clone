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
} from 'lucide-react';

type View = 'feed' | 'courses' | 'leaderboard' | 'events' | 'profile' | 'members' | 'notifications' | 'admin';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [currentView, setCurrentView] = useState<View>('feed');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    initializeDatabase();
  }, []);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
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
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500"></div>
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
    navItems.push({ id: 'admin', label: 'Admin', icon: Shield, badge: undefined });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:inline">Peptide Price</span>
              <span className="text-lg font-bold text-gray-900 sm:hidden">PP</span>
            </div>

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
                        ? 'bg-yellow-500 text-white'
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

            {/* Mobile Dropdown */}
            <div className="md:hidden relative">
              <button
                onClick={() => setNavDropdownOpen(!navDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg font-medium text-gray-900"
              >
                {(() => {
                  const activeItem = navItems.find(item => item.id === currentView);
                  const Icon = activeItem?.icon;
                  return (
                    <>
                      {Icon && <Icon size={18} />}
                      <span className="hidden sm:inline">{activeItem?.label}</span>
                      {activeItem?.badge && activeItem.badge > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 ml-1">
                          {activeItem.badge > 9 ? '9+' : activeItem.badge}
                        </span>
                      )}
                    </>
                  );
                })()}
                <ChevronDown size={16} className={`transition-transform ${navDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {navDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg z-50">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrentView(item.id as View);
                          setNavDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors first:rounded-t-lg ${
                          currentView === item.id ? 'bg-yellow-50 text-yellow-600' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={18} />
                          <span className="font-medium">{item.label}</span>
                        </div>
                        {item.badge && item.badge > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
                            {item.badge > 9 ? '9+' : item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  <div className="border-t">
                    <button
                      onClick={() => {
                        handleLogout();
                        setNavDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors rounded-b-lg"
                    >
                      <LogOut size={18} />
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'feed' && <Feed currentUser={user} />}
        {currentView === 'courses' && <Courses currentUser={user} />}
        {currentView === 'leaderboard' && <Leaderboard currentUser={user} />}
        {currentView === 'events' && <Events currentUser={user} />}
        {currentView === 'profile' && <Profile currentUser={user} onUpdate={checkAuth} />}
        {currentView === 'members' && <Members currentUser={user} />}
        {currentView === 'notifications' && <Notifications currentUser={user} />}
        {currentView === 'admin' && <AdminDashboard currentUser={user} />}
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-gray-600">
            <p className="mb-2">
              Welcome, <span className="font-semibold">{user.name}</span>! You have{' '}
              <span className="font-bold text-yellow-600">{user.points}</span> points and are{' '}
              <span className="font-bold text-yellow-600">Level {user.level}</span>
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
