import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../lib/auth';
import { Plus, Copy, Trash2, Check } from 'lucide-react';

interface InviteLink {
  id: string;
  code: string;
  created_by: string;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  created_at: string;
  active: boolean;
}

interface InviteManagementProps {
  currentUser: User;
}

export function InviteManagement({ currentUser }: InviteManagementProps) {
  const [invites, setInvites] = useState<InviteLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadInvites();
  }, []);

  async function loadInvites() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invite_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (error) {
      console.error('Error loading invites:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyLink(code: string) {
    const link = `${window.location.origin}?invite=${code}`;
    await navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  async function handleDeleteInvite(inviteId: string) {
    if (!confirm('Delete this invite link?')) return;

    try {
      await supabase.from('invite_links').delete().eq('id', inviteId);
      loadInvites();
    } catch (error) {
      console.error('Error deleting invite:', error);
    }
  }

  async function handleToggleActive(inviteId: string, currentActive: boolean) {
    try {
      await supabase
        .from('invite_links')
        .update({ active: !currentActive })
        .eq('id', inviteId);
      loadInvites();
    } catch (error) {
      console.error('Error toggling invite:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showCreate) {
    return <CreateInviteForm currentUser={currentUser} onClose={() => { setShowCreate(false); loadInvites(); }} />;
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <button
          onClick={() => setShowCreate(true)}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Create Invite Link
        </button>
      </div>

      {invites.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">No invite links yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invites.map((invite) => (
            <div key={invite.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <code className="px-3 py-1 bg-gray-100 text-gray-900 font-mono text-sm rounded">
                      {invite.code}
                    </code>
                    {!invite.active && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      Uses: {invite.uses_count}
                      {invite.max_uses && ` / ${invite.max_uses}`}
                    </p>
                    {invite.expires_at && (
                      <p>
                        Expires: {new Date(invite.expires_at).toLocaleDateString()}
                      </p>
                    )}
                    <p>Created: {new Date(invite.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopyLink(invite.code)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Copy invite link"
                  >
                    {copiedCode === invite.code ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                  <button
                    onClick={() => handleToggleActive(invite.id, invite.active)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      invite.active
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {invite.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteInvite(invite.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs text-gray-600 mb-1">Invite Link:</p>
                <code className="text-xs text-gray-800 break-all">
                  {window.location.origin}?invite={invite.code}
                </code>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateInviteForm({ currentUser, onClose }: { currentUser: User; onClose: () => void }) {
  const [maxUses, setMaxUses] = useState<number | ''>('');
  const [expiresInDays, setExpiresInDays] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);

  function generateCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const code = generateCode();
      const expiresAt = expiresInDays
        ? new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000).toISOString()
        : null;

      await supabase.from('invite_links').insert({
        code,
        created_by: currentUser.id,
        max_uses: maxUses || null,
        expires_at: expiresAt,
        uses_count: 0,
        active: true,
      });

      onClose();
    } catch (error) {
      console.error('Error creating invite:', error);
      alert('Failed to create invite link');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Create Invite Link</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Uses (leave empty for unlimited)
          </label>
          <input
            type="number"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value ? parseInt(e.target.value) : '')}
            min="1"
            placeholder="Unlimited"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expires In (days, leave empty for no expiration)
          </label>
          <input
            type="number"
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(e.target.value ? parseInt(e.target.value) : '')}
            min="1"
            placeholder="No expiration"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            A unique invite code will be automatically generated. You can share the link with
            people you want to invite to the community.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Invite Link'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
