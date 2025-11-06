import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../lib/auth';
import { Search, Award } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  role: string;
  points: number;
  level: number;
}

interface MembersProps {
  currentUser: User;
}

export function Members({ currentUser }: MembersProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [searchQuery, filterRole, members]);

  async function loadMembers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, username, avatar, bio, role, points, level')
        .order('points', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error loading members:', error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }

  function filterMembers() {
    let filtered = members;

    if (searchQuery) {
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter((m) => m.role === filterRole);
    }

    setFilteredMembers(filtered);
  }

  function getRoleBadge(role: string) {
    switch (role) {
      case 'admin':
        return { label: 'Admin', color: 'bg-red-500' };
      case 'moderator':
        return { label: 'Moderator', color: 'bg-yellow-500' };
      default:
        return { label: 'Member', color: 'bg-gray-500' };
    }
  }

  function getLevelBadge(level: number) {
    if (level >= 5) return { label: 'Expert', color: 'text-yellow-600' };
    if (level >= 3) return { label: 'Advanced', color: 'text-yellow-600' };
    if (level >= 2) return { label: 'Intermediate', color: 'text-green-600' };
    return { label: 'Beginner', color: 'text-gray-600' };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Community Members</h2>
        <p className="text-gray-600">Connect with {members.length} amazing community members</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search members by name or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
            <option value="member">Member</option>
          </select>
        </div>
      </div>

      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold mb-2">No members found</h3>
          <p className="text-gray-600">Try adjusting your search filters</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => {
            const roleBadge = getRoleBadge(member.role);
            const levelBadge = getLevelBadge(member.level);
            const isCurrentUser = member.id === currentUser.id;

            return (
              <div
                key={member.id}
                className={`bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow ${
                  isCurrentUser ? 'ring-2 ring-yellow-500' : ''
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-16 h-16 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{member.name}</h3>
                      {isCurrentUser && (
                        <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">@{member.username}</p>
                    <span className={`text-xs ${roleBadge.color} text-white px-2 py-1 rounded-full`}>
                      {roleBadge.label}
                    </span>
                  </div>
                </div>

                <p className="text-gray-700 text-sm mb-4 line-clamp-2">{member.bio}</p>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Award className="text-yellow-500" size={18} />
                    <span className="font-bold text-gray-900">{member.points}</span>
                    <span className="text-sm text-gray-500">points</span>
                  </div>
                  <div className={`text-sm font-medium ${levelBadge.color}`}>
                    Level {member.level}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
