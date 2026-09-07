import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Tag, 
  Share2, 
  BookOpen, 
  Sparkles, 
  ChevronRight, 
  Phone,
  CheckCircle2,
  ExternalLink,
  MapPin
} from 'lucide-react';
import { Article } from '../../types';
import { fetchArticleBySlug, fetchRelatedArticles } from '../../services/articlesService';
import { navigate } from '../../router';
import { SPA_INFO, SERVICES_DATA } from '../../data/spaData';
import { updatePageSeo, SEO_CONFIG, buildCanonicalUrl, setCanonicalUrl } from '../../config/seoConfig';
import euroSpaLogo from '../../assets/Untitled design (4).jpg';

interface ArticleDetailPageProps {
  slug: string;
  onBookNowClick?: () => void;
  onWhatsAppClick?: () => void;
}

export function ArticleDetailPage({ slug, onBookNowClick, onWhatsAppClick }: ArticleDetailPageProps) {
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchArticleBySlug(slug)
      .then(async (art) => {
        setArticle(art);
        if (art && art.status === 'published') {
          const canonicalUrl = art.canonicalUrl || buildCanonicalUrl(`/blog/${art.slug}`);
          const ogImageUrl = art.ogImage || (art.featuredImage?.startsWith('http') 
            ? art.featuredImage 
            : `${SEO_CONFIG.canonicalBaseUrl}${art.featuredImage || '/euro_spa_logo_clean.png'}`);

          // Centralized SEO update
          updatePageSeo({
            title: art.seoTitle || `${art.title} | ${SEO_CONFIG.siteName} Banani`,
            description: art.metaDescription || art.excerpt,
            canonicalUrl: canonicalUrl,
            ogImage: ogImageUrl,
            ogType: 'article'
          });

          // Schema.org Article Structured Data (JSON-LD)
          const structuredDataScriptId = 'article-json-ld';
          let scriptTag = document.getElementById(structuredDataScriptId) as HTMLScriptElement | null;
          if (!scriptTag) {
            scriptTag = document.createElement('script');
            scriptTag.id = structuredDataScriptId;
            scriptTag.type = 'application/ld+json';
            document.head.appendChild(scriptTag);
          }
          const articleSchema = {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: art.title,
            description: art.metaDescription || art.excerpt,
            image: [ogImageUrl],
            datePublished: art.publishedAt || '2026-03-01',
            author: {
              '@type': 'Organization',
              name: art.author || SEO_CONFIG.siteName,
              url: SEO_CONFIG.canonicalBaseUrl
            },
            publisher: {
              '@type': 'Spa',
              name: SEO_CONFIG.siteName,
              url: SEO_CONFIG.canonicalBaseUrl,
              logo: {
                '@type': 'ImageObject',
                url: `${SEO_CONFIG.canonicalBaseUrl}/euro_spa_logo_clean.png`
              }
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': canonicalUrl
            }
          };
          scriptTag.textContent = JSON.stringify(articleSchema);

          // Fetch related published articles
          const related = await fetchRelatedArticles(art.id, art.category);
          setRelatedArticles(related);
        }
      })
      .catch(err => console.error('Error fetching article by slug:', err))
      .finally(() => setLoading(false));

    return () => {
      const scriptTag = document.getElementById('article-json-ld');
      if (scriptTag) scriptTag.remove();
      setCanonicalUrl(buildCanonicalUrl('/'));
    };
  }, [slug]);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Loading wellness article...</p>
        </div>
      </div>
    );
  }

  // Not found or draft/unpublished
  if (!article || article.status !== 'published') {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans">
        <header className="bg-white border-b border-gray-200 py-4 px-4 shadow-2xs">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={() => navigate('/blog')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Articles</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
            >
              Main Website
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-12 max-w-md text-center shadow-2xs space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <BookOpen className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Article Unavailable</h1>
            <p className="text-xs text-gray-500 leading-relaxed">
              The article you are looking for has either been moved, does not exist, or is currently unpublished.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate('/blog')}
                className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Browse All Articles
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Return Home
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-900 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/blog')}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              title="Return to Articles list"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <img
                src={euroSpaLogo}
                alt="Euro Spa Center"
                className="w-8 h-8 rounded-full object-cover border border-gray-200 shadow-2xs"
              />
              <span className="font-bold text-sm text-gray-900 hidden sm:inline-block">
                {SPA_INFO.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Share article link"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{copied ? 'Link Copied!' : 'Share'}</span>
            </button>

            {onBookNowClick && (
              <button
                onClick={onBookNowClick}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Book Treatment
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Breadcrumb Navigation */}
      <nav className="max-w-4xl mx-auto w-full px-4 pt-6 pb-2 text-xs text-gray-500 flex items-center gap-2">
        <button onClick={() => navigate('/')} className="hover:text-gray-900 cursor-pointer">Home</button>
        <ChevronRight className="w-3 h-3 text-gray-400" />
        <button onClick={() => navigate('/blog')} className="hover:text-gray-900 cursor-pointer">Blog</button>
        <ChevronRight className="w-3 h-3 text-gray-400" />
        <span className="text-gray-900 font-medium truncate max-w-xs">{article.category || 'Therapy'}</span>
      </nav>

      {/* Main Article Container */}
      <article className="max-w-4xl mx-auto w-full px-4 py-6 flex-1">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            <Tag className="w-3 h-3" />
            <span>{article.category || 'Wellness Guide'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 border-y border-gray-200/70 py-3">
            <div className="flex items-center gap-2">
              <img
                src={euroSpaLogo}
                alt="Author"
                className="w-6 h-6 rounded-full object-cover border border-gray-200"
              />
              <span className="font-semibold text-gray-800">{article.author || 'Euro Spa Team'}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>{article.publishedAt || 'March 2026'}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>{article.readingTimeMinutes || 5} min read</span>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        <div className="my-8 rounded-3xl overflow-hidden border border-gray-200/80 shadow-md aspect-16/9 bg-gray-100">
          <img
            src={article.featuredImage || '/photos/Image_Aug.png'}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Excerpt Intro */}
        {article.excerpt && (
          <div className="p-5 bg-white rounded-2xl border border-blue-100 shadow-2xs text-gray-700 text-sm sm:text-base font-medium leading-relaxed italic mb-8">
            "{article.excerpt}"
          </div>
        )}

        {/* Article Markdown/Formatted Body Content */}
        <div className="prose prose-gray max-w-none text-gray-800 text-sm sm:text-base leading-relaxed space-y-5">
          {article.content.split('\n\n').map((paragraph, idx) => {
            if (paragraph.startsWith('## ')) {
              return (
                <h2 key={idx} className="text-xl sm:text-2xl font-bold text-gray-900 pt-4 pb-1 border-b border-gray-200">
                  {paragraph.replace('## ', '')}
                </h2>
              );
            }
            if (paragraph.startsWith('### ')) {
              return (
                <h3 key={idx} className="text-base sm:text-lg font-bold text-gray-900 pt-2 text-blue-900">
                  {paragraph.replace('### ', '')}
                </h3>
              );
            }
            if (paragraph.startsWith('- ')) {
              const items = paragraph.split('\n').map(item => item.replace(/^- /, ''));
              return (
                <ul key={idx} className="list-disc pl-5 space-y-1.5 text-gray-700">
                  {items.map((it, i) => (
                    <li key={i} dangerouslySetInnerHTML={{ __html: it.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  ))}
                </ul>
              );
            }
            if (/^\d+\.\s/.test(paragraph)) {
              const items = paragraph.split('\n').map(item => item.replace(/^\d+\.\s/, ''));
              return (
                <ol key={idx} className="list-decimal pl-5 space-y-1.5 text-gray-700">
                  {items.map((it, i) => (
                    <li key={i} dangerouslySetInnerHTML={{ __html: it.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  ))}
                </ol>
              );
            }
            return (
              <p key={idx} className="leading-relaxed">
                {paragraph}
              </p>
            );
          })}
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="pt-8 pb-4 flex flex-wrap items-center gap-2 border-t border-gray-200 mt-10">
            <span className="text-xs font-semibold text-gray-400 mr-1">Tags:</span>
            {article.tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600 font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Relevant Internal Links to Euro Spa Center Services */}
        <section className="my-10 p-6 bg-white rounded-3xl border border-gray-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Signature Spa Therapies at {SPA_INFO.name}</h3>
              <p className="text-xs text-gray-500">Explore certified massage treatments available at our Banani spa suite</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {SERVICES_DATA.slice(0, 3).map((service) => (
              <div
                key={service.id}
                onClick={() => {
                  if (onBookNowClick) {
                    onBookNowClick();
                  } else {
                    navigate('/');
                  }
                }}
                className="p-3.5 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold text-gray-900 group-hover:text-blue-600">
                    {service.name}
                  </h4>
                  <Sparkles className="w-3.5 h-3.5 text-blue-500 opacity-60 group-hover:opacity-100" />
                </div>
                <p className="text-[11px] text-gray-500 line-clamp-2">
                  {service.shortDescription}
                </p>
                <div className="mt-2 text-[10px] font-semibold text-blue-700">
                  {service.durationRange}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Spa Appointment Callout Banner */}
        <div className="my-10 p-6 sm:p-8 bg-gradient-to-br from-blue-900 to-indigo-950 rounded-3xl text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl" />
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Experience Authentic Relaxation</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2">
              Book Your Treatment at {SPA_INFO.name}
            </h3>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed mb-6">
              Located at {SPA_INFO.fullAddress}. Experience certified therapists, private sanitized suites, and authentic aromatherapy oils in Banani, Dhaka.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {onBookNowClick && (
                <button
                  onClick={onBookNowClick}
                  className="px-5 py-2.5 bg-white text-blue-900 hover:bg-blue-50 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Book Instant Appointment
                </button>
              )}
              {onWhatsAppClick && (
                <button
                  onClick={onWhatsAppClick}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>WhatsApp Concierge</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Related Articles Section */}
        {relatedArticles.length > 0 && (
          <section className="pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                Related Wellness Articles
              </h3>
              <button
                onClick={() => navigate('/blog')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {relatedArticles.map((rel) => (
                <div
                  key={rel.slug}
                  onClick={() => navigate(`/blog/${rel.slug}`)}
                  className="group bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="aspect-16/10 overflow-hidden bg-gray-100">
                    <img
                      src={rel.featuredImage || '/photos/Image_Aug.png'}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <h4 className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 leading-snug">
                      {rel.title}
                    </h4>
                    <span className="text-[11px] text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {rel.readingTimeMinutes || 5} min read
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </article>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 px-4 mt-auto">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>&copy; 2026 {SPA_INFO.name}. All Rights Reserved.</div>
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
