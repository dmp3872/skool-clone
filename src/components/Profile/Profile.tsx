import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../lib/auth';
import { Edit2, Award, MessageSquare, BookOpen, Upload, Image as ImageIcon } from 'lucide-react';

interface ProfileProps {
  currentUser: User;
  onUpdate: () => void;
}

export function Profile({ currentUser, onUpdate }: ProfileProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({
    posts: 0,
    comments: 0,
    completedLessons: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id);

      const { count: commentsCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id);

      const { count: lessonsCount } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
        .eq('completed', true);

      setStats({
        posts: postsCount || 0,
        comments: commentsCount || 0,
        completedLessons: lessonsCount || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ name, bio, avatar })
        .eq('id', currentUser.id);

      if (error) throw error;

      setEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  function getLevelBadge(level: number) {
    if (level >= 5) return { label: 'Expert', color: 'bg-yellow-500' };
    if (level >= 3) return { label: 'Advanced', color: 'bg-blue-500' };
    if (level >= 2) return { label: 'Intermediate', color: 'bg-green-500' };
    return { label: 'Beginner', color: 'bg-gray-500' };
  }

  const badge = getLevelBadge(currentUser.level);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-700"></div>

        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-16 mb-4">
            <img
              src={editing ? avatar : currentUser.avatar}
              alt={currentUser.name}
              className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
            />
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Edit2 size={18} />
                Edit Profile
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <img
                      src={avatar}
                      alt="Preview"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                    <div className="flex-1">
                      <label className="cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300 w-fit">
                          <Upload size={18} className="text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">
                            {uploading ? 'Uploading...' : 'Upload Image'}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG or GIF (max 5MB)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <ImageIcon size={18} className="text-gray-400 mt-2" />
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Or paste image URL
                      </label>
                      <input
                        type="text"
                        value={avatar}
                        onChange={(e) => setAvatar(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setName(currentUser.name);
                    setBio(currentUser.bio);
                    setAvatar(currentUser.avatar);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{currentUser.name}</h1>
                  <span className={`text-sm ${badge.color} text-white px-3 py-1 rounded-full`}>
                    Level {currentUser.level} - {badge.label}
                  </span>
                </div>
                <p className="text-gray-600 mb-1">@{currentUser.username}</p>
                <p className="text-gray-700">{currentUser.bio}</p>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Award className="text-yellow-500" size={20} />
                    <p className="text-2xl font-bold text-gray-900">{currentUser.points}</p>
                  </div>
                  <p className="text-sm text-gray-600">Points</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <MessageSquare className="text-blue-500" size={20} />
                    <p className="text-2xl font-bold text-gray-900">{stats.posts}</p>
                  </div>
                  <p className="text-sm text-gray-600">Posts</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <MessageSquare className="text-green-500" size={20} />
                    <p className="text-2xl font-bold text-gray-900">{stats.comments}</p>
                  </div>
                  <p className="text-sm text-gray-600">Comments</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <BookOpen className="text-purple-500" size={20} />
                    <p className="text-2xl font-bold text-gray-900">{stats.completedLessons}</p>
                  </div>
                  <p className="text-sm text-gray-600">Lessons</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500">
                  Member since {new Date(currentUser.created_at).toLocaleDateString()}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
