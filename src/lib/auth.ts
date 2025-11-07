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
  approval_status: 'pending' | 'approved' | 'rejected';
}

export async function registerUser(email: string, password: string, name: string) {
  try {
    if (!email || !password || !name) {
      throw new Error('All fields are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Check if email is permanently banned (can be done without auth)
    const { data: bannedEmail } = await supabase
      .from('banned_emails')
      .select('email')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (bannedEmail) {
      throw new Error('This email address is not allowed to register.');
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
        emailRedirectTo: undefined
      }
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
        approval_status: 'pending',
      });

    if (profileError) throw profileError;

    // Try to create notification, but don't fail if it doesn't work
    try {
      await supabase.from('notifications').insert({
        user_id: authData.user.id,
        type: 'welcome',
        title: 'Account pending approval',
        message: 'Your account has been created and is pending admin approval. You will be notified once approved.',
        link: '/feed',
        read: false,
      });
    } catch (notifError) {
      console.log('Notification creation failed, but registration succeeded');
    }

    return { success: true, user: authData.user, requiresApproval: false };
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

    // Check user's approval status
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('approval_status, role')
      .eq('id', data.user.id)
      .maybeSingle();

    if (userError) throw userError;

    // Check if account is rejected (only case we block login)
    if (userData && userData.approval_status === 'rejected') {
      await supabase.auth.signOut();
      throw new Error('Your account has been rejected. Please contact an administrator for more information.');
    }

    // Update last active
    await supabase
      .from('users')
      .update({ last_active: new Date().toISOString() })
      .eq('id', data.user.id);

    // Return success with approval status
    return {
      success: true,
      user: data.user,
      isPending: userData?.approval_status === 'pending' && userData?.role === 'member'
    };
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
