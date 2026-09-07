import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Tag, 
  BookOpen, 
  Sparkles, 
  AlertTriangle,
  Globe,
  FileText,
  Calendar
} from 'lucide-react';
import { Article } from '../../../types';

interface AdminArticleListProps {
  articles: Article[];
  loading: boolean;
  onNewArticle: () => void;
  onEditArticle: (article: Article) => void;
  onDeleteArticle: (articleId: string) => Promise<void>;
  onTogglePublish: (article: Article) => Promise<void>;
}

export function AdminArticleList({
  articles,
  loading,
  onNewArticle,
  onEditArticle,
  onDeleteArticle,
  onTogglePublish
}: AdminArticleListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Derive categories from existing articles
  const categories = ['All', ...Array.from(new Set(articles.map(a => a.category).filter(Boolean)))];

  // Counts
  const totalCount = articles.length;
  const publishedCount = articles.filter(a => a.status === 'published').length;
  const draftCount = articles.filter(a => a.status === 'draft').length;

  // Filtered list
  const filteredArticles = articles.filter(article => {
    const matchesSearch = 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.author && article.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (article.tags && article.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesStatus = statusFilter === 'all' || article.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || article.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleDeleteConfirm = async () => {
    if (!articleToDelete) return;
    try {
      setActionInProgress(articleToDelete.id);
      await onDeleteArticle(articleToDelete.id);
      setArticleToDelete(null);
    } catch (err) {
      console.error('Failed to delete article:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleToggleStatus = async (article: Article) => {
    try {
      setActionInProgress(article.id);
      await onTogglePublish(article);
    } catch (err) {
      console.error('Failed to toggle article publish status:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <span>Blog & Article CMS</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Create, manage, and publish wellness guides and spa therapy articles with automated SEO controls.
          </p>
        </div>

        <button
          onClick={onNewArticle}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Article</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>All Articles</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === 'all' ? 'bg-slate-200 text-slate-800' : 'bg-slate-200/60 text-slate-500'
              }`}>
                {totalCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('published')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'published'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Published</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800">
                {publishedCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('draft')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'draft'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Drafts</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800">
                {draftCount}
              </span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search input */}
            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search articles by title, tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {/* Category Dropdown if available */}
            {categories.length > 1 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Articles Table / List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center gap-3 text-slate-400 shadow-2xs">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium">Loading articles from Firestore database...</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">
              {articles.length === 0 ? 'No Articles in Database Yet' : 'No Matching Articles Found'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              {articles.length === 0 
                ? 'Create your first wellness article. You can save as draft or publish immediately to the live /blog section.' 
                : 'Try adjusting your search keywords or switching category/status filters.'}
            </p>
          </div>
          {articles.length === 0 ? (
            <button
              onClick={onNewArticle}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Article</span>
            </button>
          ) : (
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); setCategoryFilter('All'); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Article Details</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Category</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 hidden lg:table-cell">Published Date</th>
                  <th className="py-3.5 px-4 hidden sm:table-cell">Author</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredArticles.map((article) => {
                  const isBusy = actionInProgress === article.id;
                  const isPublished = article.status === 'published';

                  return (
                    <tr 
                      key={article.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Title, Thumbnail, Slug */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                            <img
                              src={article.featuredImage || '/photos/Image_Aug.png'}
                              alt={article.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span 
                                onClick={() => onEditArticle(article)}
                                className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer truncate max-w-[240px] sm:max-w-[340px]"
                              >
                                {article.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                              <span>/blog/{article.slug}</span>
                              {article.readingTimeMinutes && (
                                <>
                                  <span>•</span>
                                  <span className="font-sans text-slate-400">{article.readingTimeMinutes} min read</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {article.category || 'Therapy'}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isPublished
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span className="capitalize">{article.status}</span>
                        </span>
                      </td>

                      {/* Published Date */}
                      <td className="py-3.5 px-4 hidden lg:table-cell text-slate-600">
                        {article.publishedAt || (isPublished ? 'Live' : 'Not published')}
                      </td>

                      {/* Author */}
                      <td className="py-3.5 px-4 hidden sm:table-cell text-slate-600 font-medium">
                        {article.author || 'Euro Spa Team'}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View public if published */}
                          {isPublished && (
                            <a
                              href={`/blog/${article.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                              title="View Public Page"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}

                          {/* Toggle publish status */}
                          <button
                            disabled={isBusy}
                            onClick={() => handleToggleStatus(article)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              isPublished
                                ? 'bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                            title={isPublished ? 'Unpublish (Switch to Draft)' : 'Publish immediately'}
                          >
                            {isPublished ? 'Unpublish' : 'Publish'}
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => onEditArticle(article)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Article"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete button */}
                          <button
                            disabled={isBusy}
                            onClick={() => setArticleToDelete(article)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Article"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {articleToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Delete Article?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-800">"{articleToDelete.title}"</strong>? This will permanently remove the article from the Firestore database and it will no longer be visible on the public website.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setArticleToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(actionInProgress)}
                onClick={handleDeleteConfirm}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {actionInProgress ? 'Deleting...' : 'Yes, Delete Article'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
