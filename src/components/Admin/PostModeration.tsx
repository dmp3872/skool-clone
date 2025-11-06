import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../lib/auth';
import { Pin, Trash2 } from 'lucide-react';

interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  is_pinned: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  users: {
    name: string;
    username: string;
    avatar: string;
  };
}

interface PostModerationProps {
  currentUser: User;
}

export function PostModeration({}: PostModerationProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users (name, username, avatar)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleTogglePin(postId: string, currentlyPinned: boolean) {
    try {
      await supabase
        .from('posts')
        .update({ is_pinned: !currentlyPinned })
        .eq('id', postId);
      loadPosts();
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  }

  async function handleDeletePost(postId: string) {
    if (!confirm('Delete this post permanently?')) return;

    try {
      await supabase.from('posts').delete().eq('id', postId);
      loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  }

  const filteredPosts = filterCategory === 'all'
    ? posts
    : posts.filter(p => p.category.toLowerCase() === filterCategory.toLowerCase());

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {['all', 'general', 'announcements', 'questions', 'resources', 'discussions'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterCategory === cat
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">No posts found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start gap-4">
                <img
                  src={post.users.avatar}
                  alt={post.users.name}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{post.users.name}</h3>
                    <span className="text-gray-500 text-sm">@{post.users.username}</span>
                    <span className="text-gray-400 text-sm">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                    {post.is_pinned && (
                      <span className="px-2 py-1 bg-blue-100 text-yellow-700 text-xs font-medium rounded-full">
                        Pinned
                      </span>
                    )}
                  </div>

                  <span className="inline-block px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-full mb-3">
                    {post.category}
                  </span>

                  <h2 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h2>
                  <p className="text-gray-600 mb-4 line-clamp-2">{post.content}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{post.likes_count} likes</span>
                    <span>{post.comments_count} comments</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleTogglePin(post.id, post.is_pinned)}
                    className={`p-2 rounded-lg transition-colors ${
                      post.is_pinned
                        ? 'bg-blue-100 text-yellow-600 hover:bg-blue-200'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title={post.is_pinned ? 'Unpin' : 'Pin'}
                  >
                    <Pin size={20} />
                  </button>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
