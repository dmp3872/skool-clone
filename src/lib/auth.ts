import { supabase } from './supabase';

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  role: 'admin' | 'moderator' | 'member';
  points: number;
  level: number;
  created_at: string;
  last_active: string;
}

export async function registerUser(email: string, password: string, name: string) {
  try {
    if (!email || !password || !name) {
      throw new Error('All fields are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Registration failed');

    const username = name.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000);

    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        username,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        bio: `Hi! I'm ${name}. Excited to be part of this community!`,
        role: 'member',
        points: 0,
        level: 1,
      });

    if (profileError) throw profileError;

    await supabase.from('notifications').insert({
      user_id: authData.user.id,
      type: 'welcome',
      title: 'Welcome to the community!',
      message: 'Get started by introducing yourself in the community feed.',
      link: '/feed',
      read: false,
    });

    return { success: true, user: authData.user };
  } catch (error: any) {
    console.error('Registration error:', error);
    return { success: false, error: error.message };
  }
}

export async function loginUser(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    await supabase
      .from('users')
      .update({ last_active: new Date().toISOString() })
      .eq('id', data.user.id);

    return { success: true, user: data.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Logout error:', error);
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error || !data) return null;
    return data as User;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

export async function checkAuthState() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
