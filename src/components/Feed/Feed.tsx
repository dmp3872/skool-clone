import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../lib/auth';
import { MessageSquare, ThumbsUp, Pin, Trash2, PinOff } from 'lucide-react';
import { PostDetail } from './PostDetail';
import { CreatePost } from './CreatePost';

interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  video_url?: string;
  image_urls?: string[];
  image_count?: number;
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

interface FeedProps {
  currentUser: User;
}

export function Feed({ currentUser }: FeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
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
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleLike(postId: string) {
    try {
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (existingLike) {
        await supabase.from('post_likes').delete().eq('id', existingLike.id);
        await supabase.rpc('decrement_post_likes', { post_id: postId });
        await supabase
          .from('users')
          .update({ points: currentUser.points - 2 })
          .eq('id', currentUser.id);
      } else {
        await supabase.from('post_likes').insert({
          post_id: postId,
          user_id: currentUser.id,
        });
        await supabase.rpc('increment_post_likes', { post_id: postId });
        await supabase
          .from('users')
          .update({ points: currentUser.points + 2 })
          .eq('id', currentUser.id);
      }

      loadPosts();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }

  async function handleDeletePost(postId: string) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await supabase.from('post_likes').delete().eq('post_id', postId);
      await supabase.from('comments').delete().eq('post_id', postId);
      await supabase.from('posts').delete().eq('id', postId);
      loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  }

  async function handleTogglePin(postId: string, currentPinned: boolean) {
    try {
      await supabase
        .from('posts')
        .update({ is_pinned: !currentPinned })
        .eq('id', postId);
      loadPosts();
    } catch (error) {
      console.error('Error toggling pin:', error);
      alert('Failed to update pin status');
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

  if (selectedPost) {
    return (
      <PostDetail
        post={selectedPost}
        currentUser={currentUser}
        onBack={() => {
          setSelectedPost(null);
          loadPosts();
        }}
      />
    );
  }

  if (showCreatePost) {
    return (
      <CreatePost
        currentUser={currentUser}
        onClose={() => {
          setShowCreatePost(false);
          loadPosts();
        }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Community Feed</h2>
        <button
          onClick={() => setShowCreatePost(true)}
          className="w-full bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
        >
          Create New Post
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {['all', 'peptide-research', 'dosing-protocols', 'supplier-reviews', 'results', 'questions', 'general'].map((cat) => (
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
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
          <p className="text-gray-600 mb-6">Be the first to start a conversation!</p>
          <button
            onClick={() => setShowCreatePost(true)}
            className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600"
          >
            Create First Post
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              {post.is_pinned && (
                <div className="flex items-center gap-2 text-yellow-600 mb-3">
                  <Pin size={16} />
                  <span className="text-sm font-medium">Pinned Post</span>
                </div>
              )}

              <div className="flex items-start gap-4">
                <img
                  src={post.users.avatar}
                  alt={post.users.name}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{post.users.name}</h3>
                      <span className="text-gray-500 text-sm">@{post.users.username}</span>
                      <span className="text-gray-400 text-sm">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {(currentUser.role === 'admin' || currentUser.role === 'moderator') && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePin(post.id, post.is_pinned);
                          }}
                          className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                          title={post.is_pinned ? 'Unpin post' : 'Pin post'}
                        >
                          {post.is_pinned ? <PinOff size={16} /> : <Pin size={16} />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePost(post.id);
                          }}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete post"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  <span className="inline-block px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-full mb-3">
                    {post.category}
                  </span>

                  <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>
                  <p className="text-gray-600 mb-4 line-clamp-2">{post.content}</p>

                  {post.image_urls && post.image_urls.length > 0 && (
                    <div className="mb-4">
                      {post.image_urls.length === 1 ? (
                        <img
                          src={post.image_urls[0]}
                          alt="Post image"
                          className="w-full max-h-64 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {post.image_urls.slice(0, 4).map((url, idx) => (
                            <div key={idx} className="relative">
                              <img
                                src={url}
                                alt={`Post image ${idx + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              {idx === 3 && post.image_urls && post.image_urls.length > 4 && (
                                <div className="absolute inset-0 bg-black bg-opacity-60 rounded-lg flex items-center justify-center">
                                  <span className="text-white text-xl font-bold">
                                    +{post.image_urls.length - 4}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-6 text-gray-500">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(post.id);
                      }}
                      className="flex items-center gap-2 hover:text-yellow-600 transition-colors"
                    >
                      <ThumbsUp size={18} />
                      <span>{post.likes_count}</span>
                    </button>
                    <div className="flex items-center gap-2">
                      <MessageSquare size={18} />
                      <span>{post.comments_count}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
