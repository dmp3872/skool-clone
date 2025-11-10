import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../lib/auth';
import { ArrowLeft, ThumbsUp, MessageSquare, Trash2, Reply, Store } from 'lucide-react';
import { ImageViewer } from './ImageViewer';
import { formatContent } from '../../lib/contentFormatter';
import { getCompanyById } from '../../lib/companiesData';
import { getVideoEmbed } from '../../lib/videoUtils';

interface PostDetailProps {
  post: any;
  currentUser: User;
  onBack: () => void;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  replies_count: number;
  user_id: string;
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
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [imageViewer, setImageViewer] = useState<{ images: string[]; index: number } | null>(null);

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
        parent_id: null,
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

  async function handleSubmitReply(parentId: string) {
    if (!replyContent.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('comments').insert({
        post_id: post.id,
        user_id: currentUser.id,
        content: replyContent,
        parent_id: parentId,
      });

      if (error) throw error;

      // Increment parent comment's replies count
      await supabase.rpc('increment_comment_replies', { comment_id: parentId });

      // Increment post's total comments count
      await supabase
        .from('posts')
        .update({ comments_count: post.comments_count + 1 })
        .eq('id', post.id);

      // Award points
      await supabase
        .from('users')
        .update({ points: currentUser.points + 3 })
        .eq('id', currentUser.id);

      setReplyContent('');
      setReplyingTo(null);
      loadComments();
    } catch (error) {
      console.error('Error adding reply:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteComment(commentId: string, parentId: string | null) {
    if (!confirm('Delete this comment?')) return;

    try {
      // Get all replies to calculate total deletion count
      const { data: replies } = await supabase
        .from('comments')
        .select('id')
        .eq('parent_id', commentId);

      const deletionCount = 1 + (replies?.length || 0);

      // Delete the comment (CASCADE will delete all replies)
      await supabase.from('comments').delete().eq('id', commentId);

      // Update parent comment's replies count if this is a reply
      if (parentId) {
        await supabase.rpc('decrement_comment_replies', { comment_id: parentId });
      }

      // Update post's total comments count
      await supabase
        .from('posts')
        .update({ comments_count: Math.max(0, post.comments_count - deletionCount) })
        .eq('id', post.id);

      loadComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  }

  // Organize comments into parent/child structure
  const parentComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  // Render a comment and its replies recursively
  const renderComment = (comment: Comment, depth: number = 0) => {
    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'moderator';
    const canDelete = isAdmin || comment.user_id === currentUser.id;
    const replies = getReplies(comment.id);

    return (
      <div key={comment.id} className={depth > 0 ? 'ml-8 mt-4' : ''}>
        <div className="border-b pb-4 last:border-b-0">
          <div className="flex items-start gap-4">
            <img
              src={comment.users.avatar}
              alt={comment.users.name}
              className="w-10 h-10 rounded-full flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
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
                {canDelete && (
                  <button
                    onClick={() => handleDeleteComment(comment.id, comment.parent_id)}
                    className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                    title="Delete comment"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <div
                className="text-gray-700 mb-2 formatted-content"
                dangerouslySetInnerHTML={{ __html: formatContent(comment.content) }}
              />
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setReplyingTo(comment.id);
                    setReplyContent('');
                  }}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <Reply size={14} />
                  <span>Reply</span>
                </button>
                {replies.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                  </span>
                )}
              </div>

              {/* Reply form */}
              {replyingTo === comment.id && (
                <div className="mt-3 bg-gray-50 p-3 rounded-lg">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Reply to ${comment.users.name}...`}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleSubmitReply(comment.id)}
                      disabled={loading || !replyContent.trim()}
                      className="bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Posting...' : 'Post Reply'}
                    </button>
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyContent('');
                      }}
                      className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Render nested replies */}
        {replies.length > 0 && (
          <div className="mt-4">
            {replies.map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

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

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
            {post.category}
          </span>
          {post.company_id && getCompanyById(post.company_id) && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">
              <Store size={14} />
              {getCompanyById(post.company_id)!.name}
            </span>
          )}
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>
        <div
          className="text-gray-700 mb-6 formatted-content"
          dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
        />

        {post.image_urls && post.image_urls.length > 0 && (
          <div className="mb-6">
            {post.image_urls.length === 1 ? (
              <img
                src={post.image_urls[0]}
                alt="Post image"
                className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setImageViewer({ images: post.image_urls!, index: 0 })}
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {post.image_urls.map((url: string, idx: number) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Post image ${idx + 1}`}
                    className="w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setImageViewer({ images: post.image_urls!, index: idx })}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {post.video_url && (() => {
          const videoEmbed = getVideoEmbed(post.video_url);
          if (videoEmbed) {
            return (
              <div className="mb-6 bg-black rounded-lg overflow-hidden aspect-video">
                <iframe
                  src={videoEmbed.embedUrl}
                  title={post.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              </div>
            );
          }
          return null;
        })()}

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
            className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
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
          <div className="space-y-6">
            {parentComments.map(comment => renderComment(comment))}
          </div>
        )}
      </div>

      {/* Image Viewer Modal */}
      {imageViewer && (
        <ImageViewer
          images={imageViewer.images}
          initialIndex={imageViewer.index}
          onClose={() => setImageViewer(null)}
        />
      )}
    </div>
  );
}
