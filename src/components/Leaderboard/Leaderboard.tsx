import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../lib/auth';
import { Trophy, Award, Crown } from 'lucide-react';

interface LeaderboardUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  points: number;
  level: number;
}

interface LeaderboardProps {
  currentUser: User;
}

export function Leaderboard({ currentUser }: LeaderboardProps) {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState<number>(0);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  async function loadLeaderboard() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, username, avatar, points, level')
        .order('points', { ascending: false })
        .limit(100);

      if (error) throw error;

      setUsers(data || []);

      const rank = (data || []).findIndex(u => u.id === currentUser.id) + 1;
      setCurrentUserRank(rank);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  function getRankIcon(rank: number) {
    switch (rank) {
      case 1:
        return <Crown className="text-yellow-500" size={24} />;
      case 2:
        return <Trophy className="text-gray-400" size={24} />;
      case 3:
        return <Trophy className="text-orange-600" size={24} />;
      default:
        return null;
    }
  }

  function getLevelBadge(level: number) {
    if (level >= 5) return { label: 'Expert', color: 'bg-yellow-500' };
    if (level >= 3) return { label: 'Advanced', color: 'bg-blue-500' };
    if (level >= 2) return { label: 'Intermediate', color: 'bg-green-500' };
    return { label: 'Beginner', color: 'bg-gray-500' };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Leaderboard</h2>
        <p className="text-gray-600">Top members by points earned</p>
      </div>

      {currentUserRank > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 mb-1">Your Rank</p>
              <p className="text-4xl font-bold">#{currentUserRank}</p>
            </div>
            <div className="text-right">
              <p className="text-blue-100 mb-1">Your Points</p>
              <p className="text-3xl font-bold">{currentUser.points}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {users.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold mb-2">No members yet</h3>
            <p className="text-gray-600">Be the first to earn points!</p>
          </div>
        ) : (
          <div className="divide-y">
            {users.slice(0, 50).map((user, index) => {
              const rank = index + 1;
              const badge = getLevelBadge(user.level);
              const isCurrentUser = user.id === currentUser.id;

              return (
                <div
                  key={user.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    isCurrentUser ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 text-center">
                      {getRankIcon(rank) || (
                        <span className="text-xl font-bold text-gray-600">
                          {rank}
                        </span>
                      )}
                    </div>

                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-full"
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{user.name}</h3>
                        <span className="text-gray-500 text-sm">@{user.username}</span>
                        {isCurrentUser && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs ${badge.color} text-white px-2 py-1 rounded-full`}>
                          Level {user.level} - {badge.label}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Award className="text-yellow-500" size={20} />
                        <span className="text-2xl font-bold text-gray-900">
                          {user.points}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">points</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">How to Earn Points</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold">+5</span>
            </div>
            <span className="text-gray-700">Create a post</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold">+3</span>
            </div>
            <span className="text-gray-700">Add a comment</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold">+2</span>
            </div>
            <span className="text-gray-700">Like a post</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold">+10</span>
            </div>
            <span className="text-gray-700">Complete a lesson</span>
          </div>
        </div>
      </div>
    </div>
  );
}
