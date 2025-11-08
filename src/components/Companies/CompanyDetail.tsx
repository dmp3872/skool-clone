import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../lib/auth';
import { ArrowLeft, ExternalLink, Copy, Check, Tag, MessageSquare, ThumbsUp } from 'lucide-react';
import { Company } from '../../lib/companiesData';
import { CreatePost } from '../Feed/CreatePost';
import { PostDetail } from '../Feed/PostDetail';
import { stripFormatting } from '../../lib/contentFormatter';

interface CompanyDetailProps {
  company: Company;
  currentUser: User;
  onBack: () => void;
}

interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  users: {
    name: string;
    username: string;
    avatar: string;
  };
}

export function CompanyDetail({ company, currentUser, onBack }: CompanyDetailProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [company.id]);

  async function loadPosts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users (name, username, avatar)
        `)
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading company posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  function handleCopyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
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
        preselectedCompanyId={company.id}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 md:mb-6"
      >
        <ArrowLeft size={20} />
        Back to Companies
      </button>

      {/* Company Info Card */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-4 md:mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{company.name}</h1>
            <p className="text-gray-600">Discussion Board</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Referral Link */}
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <ExternalLink size={14} />
              <span className="font-medium">Referral Link</span>
            </div>
            <a
              href={company.referralUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium text-center"
            >
              Visit Store →
            </a>
          </div>

          {/* Coupon Code */}
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Tag size={14} />
              <span className="font-medium">Coupon Code</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-center">
                <code className="text-green-800 font-bold text-sm">
                  {company.couponCode}
                </code>
              </div>
              <button
                onClick={() => handleCopyCode(company.couponCode)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Copy code"
              >
                {copiedCode ? (
                  <Check size={18} className="text-green-600" />
                ) : (
                  <Copy size={18} className="text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Notes */}
        {company.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-900">
              <strong>Note:</strong> {company.notes}
            </p>
          </div>
        )}
      </div>

      {/* Create Post Button */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-4 md:mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Community Discussion</h2>
        <button
          onClick={() => setShowCreatePost(true)}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
        >
          Create Post About {company.name}
        </button>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 text-center">
          <div className="text-5xl md:text-6xl mb-4">💬</div>
          <h3 className="text-lg md:text-xl font-semibold mb-2">No posts yet</h3>
          <p className="text-gray-600 mb-4 md:mb-6">
            Be the first to start a discussion about {company.name}!
          </p>
          <button
            onClick={() => setShowCreatePost(true)}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Create First Post
          </button>
        </div>
      ) : (
        <div className="space-y-0 md:space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="bg-white md:rounded-lg md:shadow-sm p-4 md:p-6 border-b md:border-b-0 last:border-b-0 hover:bg-gray-50 md:hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <img
                  src={post.users.avatar}
                  alt={post.users.name}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm md:text-base truncate">
                      {post.users.name}
                    </h3>
                    <span className="text-gray-500 text-xs md:text-sm">·</span>
                    <span className="text-gray-400 text-xs md:text-sm">
                      {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] md:text-xs font-medium rounded mb-2">
                    {post.category.replace('-', ' ')}
                  </span>

                  <h2 className="text-base md:text-xl font-bold text-gray-900 mb-1 md:mb-2 line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4 line-clamp-2">
                    {stripFormatting(post.content)}
                  </p>

                  <div className="flex items-center gap-4 text-gray-500 text-sm">
                    <div className="flex items-center gap-1">
                      <ThumbsUp size={16} />
                      <span>{post.likes_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare size={16} />
                      <span>{post.comments_count}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Count */}
      {posts.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-600">
          {posts.length} {posts.length === 1 ? 'post' : 'posts'} about {company.name}
        </div>
      )}
    </div>
  );
}
