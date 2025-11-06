import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../lib/auth';
import { ArrowLeft, ThumbsUp, MessageSquare, Trash2 } from 'lucide-react';

function getYouTubeEmbedUrl(url: string): string {
  if (!url) return '';

  // If it's already an embed URL, return it
  if (url.includes('youtube.com/embed/')) {
    return url;
  }

  // Extract video ID from various YouTube URL formats
  let videoId = '';

  // Format: https://www.youtube.com/watch?v=VIDEO_ID
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('v=')[1]?.split('&')[0];
  }
  // Format: https://youtu.be/VIDEO_ID
  else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0];
  }
  // Format: https://www.youtube.com/embed/VIDEO_ID
  else if (url.includes('youtube.com/embed/')) {
    videoId = url.split('embed/')[1]?.split('?')[0];
  }

  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }

  // If not a YouTube URL, return as is (might be another video platform)
  return url;
}

interface PostDetailProps {
  post: any;
  currentUser: User;
  onBack: () => void;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  users: {
    name: string;
    username: string;
    avatar: string;
  };
}

export function PostDetail({ post, currentUser, onBack }: PostDetailProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadComments();
  }, [post.id]);

  async function loadComments() {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          users (name, username, avatar)
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('comments').insert({
        post_id: post.id,
        user_id: currentUser.id,
        content: newComment,
      });

      if (error) throw error;

      await supabase
        .from('posts')
        .update({ comments_count: post.comments_count + 1 })
        .eq('id', post.id);

      await supabase
        .from('users')
        .update({ points: currentUser.points + 3 })
        .eq('id', currentUser.id);

      setNewComment('');
      loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm('Delete this comment?')) return;

    try {
      await supabase.from('comments').delete().eq('id', commentId);
      await supabase
        .from('posts')
        .update({ comments_count: Math.max(0, post.comments_count - 1) })
        .eq('id', post.id);
      loadComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} />
        Back to Feed
      </button>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start gap-4 mb-4">
          <img
            src={post.users.avatar}
            alt={post.users.name}
            className="w-12 h-12 rounded-full"
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">{post.users.name}</h3>
              <span className="text-gray-500 text-sm">@{post.users.username}</span>
            </div>
            <span className="text-gray-400 text-sm">
              {new Date(post.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full mb-4">
          {post.category}
        </span>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>
        <p className="text-gray-700 whitespace-pre-wrap mb-6">{post.content}</p>

        {post.image_urls && post.image_urls.length > 0 && (
          <div className="mb-6">
            {post.image_urls.length === 1 ? (
              <img
                src={post.image_urls[0]}
                alt="Post image"
                className="w-full rounded-lg"
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {post.image_urls.map((url: string, idx: number) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Post image ${idx + 1}`}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {post.video_url && (
          <div className="mb-6 bg-black rounded-lg overflow-hidden aspect-video">
            <iframe
              src={getYouTubeEmbedUrl(post.video_url)}
              title={post.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        <div className="flex items-center gap-6 text-gray-500 border-t pt-4">
          <div className="flex items-center gap-2">
            <ThumbsUp size={18} />
            <span>{post.likes_count} likes</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare size={18} />
            <span>{comments.length} comments</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Add Comment</h3>
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Post Comment (+3 points)'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Comments ({comments.length})
        </h3>

        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border-b pb-4 last:border-b-0">
                <div className="flex items-start gap-4">
                  <img
                    src={comment.users.avatar}
                    alt={comment.users.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">
                        {comment.users.name}
                      </span>
                      <span className="text-gray-500 text-sm">
                        @{comment.users.username}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                  {comment.users && currentUser.id === post.user_id && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
