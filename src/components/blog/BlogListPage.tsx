import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Clock, Calendar, ArrowLeft, ArrowRight, Tag, BookOpen, Sparkles } from 'lucide-react';
import { Article } from '../../types';
import { fetchPublishedArticles } from '../../services/articlesService';
import { navigate } from '../../router';
import { SPA_INFO } from '../../data/spaData';
import { updatePageSeo, SEO_CONFIG, buildCanonicalUrl, setCanonicalUrl } from '../../config/seoConfig';
import euroSpaLogo from '../../assets/Untitled design (4).jpg';

interface BlogListPageProps {
  onBookNowClick?: () => void;
  onWhatsAppClick?: () => void;
}

export function BlogListPage({ onBookNowClick, onWhatsAppClick }: BlogListPageProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    window.scrollTo(0, 0);

    // Dynamic SEO title & description
    updatePageSeo({
      title: `Wellness Blog & Spa Articles | ${SPA_INFO.name} Banani`,
      description: `Explore expert spa therapies, Swedish massage benefits, aromatherapy guidance, and self-care tips from ${SPA_INFO.name} in Banani, Dhaka.`,
      canonicalUrl: buildCanonicalUrl('/blog'),
      ogImage: SEO_CONFIG.defaultOgImage,
      ogType: 'website'
    });

    fetchPublishedArticles()
      .then(res => setArticles(res))
      .catch(err => console.error('Failed to load published articles:', err))
      .finally(() => setLoading(false));

    return () => {
      setCanonicalUrl(buildCanonicalUrl('/'));
    };
  }, []);

  const categories = ['All', ...Array.from(new Set(articles.map(a => a.category).filter(Boolean)))];

  const filteredArticles = articles.filter(article => {
    const matchesSearch = 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.tags && article.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-900 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <button 
              onClick={(e) => { e.stopPropagation(); navigate('/'); }}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              title="Return to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <img 
                src={euroSpaLogo} 
                alt="Euro Spa Center" 
                className="w-9 h-9 rounded-full object-cover border border-gray-200 shadow-2xs" 
              />
              <div>
                <span className="font-bold text-base text-gray-900 leading-none block">
                  {SPA_INFO.name}
                </span>
                <span className="text-[11px] text-gray-500 font-medium">
                  Wellness Articles & Guides
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors hidden sm:inline-block cursor-pointer"
            >
              Main Website
            </button>
            {onBookNowClick && (
              <button
                onClick={onBookNowClick}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Book Appointment
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="py-12 px-4 border-b border-gray-200/60 bg-gradient-to-b from-white to-[#FAF6EE]">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Health, Relaxation & Body Care</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Spa & Wellness Journal
          </h1>

          <p className="text-xs sm:text-sm text-gray-600 max-w-xl mx-auto leading-relaxed">
            Expert therapeutic advice, Swedish massage guides, aromatherapy benefits, and holistic self-care rituals curated by certified therapists at {SPA_INFO.name} in Banani, Dhaka.
          </p>

          {/* Search bar if articles exist */}
          {articles.length > 0 && (
            <div className="pt-3 max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search articles by topic, treatment, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white rounded-2xl border border-gray-200 text-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-2xs"
                />
              </div>
            </div>
          )}

          {/* Category Filter Pills if articles exist */}
          {articles.length > 0 && categories.length > 2 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Loading published articles...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-16 px-6 bg-white rounded-3xl border border-gray-200/90 max-w-lg mx-auto shadow-2xs space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto">
              <BookOpen className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-gray-800">
                {searchQuery ? 'No matching articles found' : 'No articles published yet'}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
                {searchQuery 
                  ? `No articles found matching "${searchQuery}". Try different search keywords or view all categories.`
                  : 'Check back soon for wellness insights, therapy guides, and massage tips published by Euro Spa Center.'}
              </p>
            </div>
            {searchQuery ? (
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="mt-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Clear Search
              </button>
            ) : (
              <div className="pt-2">
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Explore Spa Therapies</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article, index) => (
              <motion.article
                key={article.id || article.slug}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/blog/${article.slug}`)}
                className="group bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-2xs hover:shadow-md hover:border-gray-300 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Article Thumbnail */}
                  <div className="relative aspect-16/10 overflow-hidden bg-gray-100">
                    <img
                      src={article.featuredImage || '/photos/Image_Aug.png'}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/95 backdrop-blur-xs text-gray-800 shadow-xs">
                        <Tag className="w-3 h-3 text-blue-600" />
                        {article.category || 'Therapy'}
                      </span>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-5">
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-2.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {article.publishedAt || 'March 2026'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {article.readingTimeMinutes || 5} min read
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-2">
                      {article.title}
                    </h2>

                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </div>
                </div>

                {/* Card Footer with Read More button */}
                <div className="px-5 pb-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold">
                  <span className="text-[11px] text-gray-500 font-medium truncate max-w-[140px]">
                    By {article.author || 'Euro Spa Team'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/blog/${article.slug}`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <span>Read More</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 px-4 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span>&copy; 2026 {SPA_INFO.name}. All Rights Reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="hover:text-gray-900 transition-colors cursor-pointer">
              Home
            </button>
            <button onClick={() => navigate('/blog')} className="text-blue-600 font-semibold cursor-pointer">
              Wellness Blog
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
