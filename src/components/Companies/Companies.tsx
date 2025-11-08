import { useState } from 'react';
import { Search, ExternalLink, Copy, Check, Tag } from 'lucide-react';
import { companies, searchCompanies } from '../../lib/companiesData';

export function Companies() {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filteredCompanies = searchQuery
    ? searchCompanies(searchQuery)
    : companies;

  function handleCopyCode(code: string, companyId: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(companyId);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Peptide Suppliers</h1>
        <p className="text-gray-600 mb-6">
          Browse our curated list of peptide suppliers with exclusive discount codes and referral links.
        </p>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search companies..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Companies Grid */}
      {filteredCompanies.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2">No companies found</h3>
          <p className="text-gray-600">Try a different search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((company) => (
            <div
              key={company.id}
              className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow border border-gray-200"
            >
              {/* Company Name */}
              <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">
                {company.name}
              </h3>

              {/* Referral Link */}
              <div className="mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <ExternalLink size={14} />
                  <span className="font-medium">Referral Link</span>
                </div>
                <a
                  href={company.referralUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  Visit Store →
                </a>
              </div>

              {/* Coupon Code */}
              <div className="mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Tag size={14} />
                  <span className="font-medium">Coupon Code</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <code className="text-green-800 font-bold text-sm">
                      {company.couponCode}
                    </code>
                  </div>
                  <button
                    onClick={() => handleCopyCode(company.couponCode, company.id)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Copy code"
                  >
                    {copiedCode === company.id ? (
                      <Check size={18} className="text-green-600" />
                    ) : (
                      <Copy size={18} className="text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Notes */}
              {company.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 italic">{company.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Banner */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-5">
        <h4 className="font-semibold text-blue-900 mb-2">How to Use Referral Links & Codes</h4>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Click "Visit Store" to open the supplier's website with the referral link</li>
          <li>Click the copy icon to copy the coupon code</li>
          <li>Apply the coupon code at checkout to receive your discount</li>
          <li>Some referral links include the discount automatically</li>
        </ol>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{companies.length}</div>
          <div className="text-sm text-gray-600">Total Suppliers</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {companies.filter(c => c.couponCode !== 'N/A').length}
          </div>
          <div className="text-sm text-gray-600">Active Codes</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {companies.filter(c => c.notes).length}
          </div>
          <div className="text-sm text-gray-600">Special Offers</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {filteredCompanies.length}
          </div>
          <div className="text-sm text-gray-600">Showing</div>
        </div>
      </div>
    </div>
  );
}
