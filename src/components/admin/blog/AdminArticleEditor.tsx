import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  UploadCloud, 
  Image as ImageIcon, 
  Eye, 
  Edit3, 
  Bold, 
  Italic, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Quote, 
  Link as LinkIcon, 
  Minus, 
  Sparkles, 
  Check, 
  AlertCircle, 
  ExternalLink,
  RefreshCw,
  X,
  Plus
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Article } from '../../../types';
import { 
  createArticle, 
  updateArticle, 
  generateSlug, 
  checkSlugAvailability, 
  uploadArticleImage,
  calculateReadingTime 
} from '../../../services/articlesService';
import { AdminSeoPreview } from './AdminSeoPreview';
import { SPA_INFO } from '../../../data/spaData';

interface AdminArticleEditorProps {
  article: Article | null; // null = new article, object = editing existing
  currentUser: User | null;
  onBack: () => void;
  onSaved: (savedArticle: Article) => void;
}

const DEFAULT_CATEGORIES = [
  'Therapy & Wellness',
  'Swedish Massage',
  'Aromatherapy & Oils',
  'Deep Tissue & Recovery',
  'Body Scrub & Skin Care',
  'Stress Relief & Health',
  'Spa Etiquette & Guides'
];

const SUGGESTED_TAGS = [
  'swedish-massage',
  'banani-spa',
  'dhaka-wellness',
  'aromatherapy',
  'stress-relief',
  'relaxation',
  'body-scrub',
  'back-pain',
  'self-care'
];

export function AdminArticleEditor({
  article,
  currentUser,
  onBack,
  onSaved
}: AdminArticleEditorProps) {
  const isEditing = Boolean(article);

  // Form states
  const [title, setTitle] = useState(article?.title || '');
  const [slug, setSlug] = useState(article?.slug || '');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(article?.slug));
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [excerpt, setExcerpt] = useState(article?.excerpt || '');
  const [content, setContent] = useState(article?.content || '');
  const [category, setCategory] = useState(article?.category || 'Therapy & Wellness');
  const [customCategory, setCustomCategory] = useState('');
  const [author, setAuthor] = useState(article?.author || currentUser?.displayName || 'Euro Spa Team');
  const [status, setStatus] = useState<'draft' | 'published'>(article?.status || 'draft');
  const [publishedAt, setPublishedAt] = useState(
    article?.publishedAt || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  );

  // Featured Image
  const [featuredImage, setFeaturedImage] = useState(article?.featuredImage || '/photos/Image_Aug.png');
  const [imageAlt, setImageAlt] = useState(article?.imageAlt || '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Tags
  const [tags, setTags] = useState<string[]>(article?.tags || ['wellness', 'massage']);
  const [tagInput, setTagInput] = useState('');

  // SEO
  const [seoTitle, setSeoTitle] = useState(article?.seoTitle || '');
  const [metaDescription, setMetaDescription] = useState(article?.metaDescription || '');
  const [focusKeyword, setFocusKeyword] = useState(article?.focusKeyword || '');
  const [canonicalUrl, setCanonicalUrl] = useState(article?.canonicalUrl || '');
  const [ogTitle, setOgTitle] = useState(article?.ogTitle || '');
  const [ogDescription, setOgDescription] = useState(article?.ogDescription || '');
  const [ogImage, setOgImage] = useState(article?.ogImage || '');

  // UI modes
  const [editorTab, setEditorTab] = useState<'write' | 'preview'>('write');
  const [seoTab, setSeoTab] = useState<'settings' | 'preview'>('settings');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-generate slug when title changes (unless admin manually edited slug)
  useEffect(() => {
    if (!slugManuallyEdited && title) {
      const generated = generateSlug(title);
      setSlug(generated);
    }
  }, [title, slugManuallyEdited]);

  // Check slug availability with debounce
  useEffect(() => {
    if (!slug) {
      setSlugAvailable(null);
      return;
    }
    const timer = setTimeout(async () => {
      const avail = await checkSlugAvailability(slug, article?.id);
      setSlugAvailable(avail);
    }, 400);

    return () => clearTimeout(timer);
  }, [slug, article?.id]);

  // Insert markdown snippet helper
  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousContent = textarea.value;
    const selectedText = previousContent.substring(start, end);

    let replacement = '';
    if (selectedText) {
      replacement = `${prefix}${selectedText}${suffix}`;
    } else {
      replacement = `${prefix}${suffix}`;
    }

    const newContent = 
      previousContent.substring(0, start) + 
      replacement + 
      previousContent.substring(end);

    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  };

  // Handle Firebase Storage Image Upload
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (< 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setImageError('Image file is too large. Maximum supported size is 10MB.');
      return;
    }

    try {
      setUploadingImage(true);
      setUploadProgress(10);
      setImageError(null);

      const downloadUrl = await uploadArticleImage(file, (pct) => {
        setUploadProgress(pct);
      });

      setFeaturedImage(downloadUrl);
      if (!imageAlt) {
        setImageAlt(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
      setFeedback({ type: 'success', message: 'Featured image uploaded securely to Firebase Storage!' });
    } catch (err: any) {
      console.error('Storage upload failed:', err);
      setImageError(err.message || 'Could not upload image to Firebase Storage.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Add Tag
  const handleAddTag = (rawTag: string) => {
    const clean = rawTag.toLowerCase().trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Save logic
  const handleSave = async (publishNow?: boolean) => {
    // Validation
    if (!title.trim()) {
      setFeedback({ type: 'error', message: 'Please enter an article title.' });
      return;
    }
    if (!slug.trim()) {
      setFeedback({ type: 'error', message: 'Please provide a URL slug.' });
      return;
    }
    if (slugAvailable === false) {
      setFeedback({ type: 'error', message: 'This slug is already in use by another article. Please use a unique slug.' });
      return;
    }
    if (!content.trim()) {
      setFeedback({ type: 'error', message: 'Please write article content before saving.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const targetStatus = publishNow !== undefined ? (publishNow ? 'published' : 'draft') : status;
    const finalCategory = customCategory.trim() || category;
    const finalPublishedAt = targetStatus === 'published' 
      ? (publishedAt || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))
      : publishedAt;

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim() || title.trim(),
      content: content.trim(),
      featuredImage: featuredImage || '/photos/Image_Aug.png',
      imageAlt: imageAlt.trim() || title.trim(),
      category: finalCategory,
      author: author.trim() || 'Euro Spa Team',
      status: targetStatus,
      publishedAt: finalPublishedAt,
      seoTitle: seoTitle.trim() || `${title.trim()} | ${SPA_INFO.name} Banani`,
      metaDescription: metaDescription.trim() || excerpt.trim(),
      focusKeyword: focusKeyword.trim(),
      canonicalUrl: canonicalUrl.trim() || `https://eurospacenter.com/blog/${slug.trim()}`,
      ogTitle: ogTitle.trim() || seoTitle.trim() || title.trim(),
      ogDescription: ogDescription.trim() || metaDescription.trim() || excerpt.trim(),
      ogImage: ogImage.trim() || featuredImage || '',
      tags: tags
    };

    try {
      if (isEditing && article) {
        await updateArticle(article.id, payload);
        const updated: Article = {
          ...article,
          ...payload,
          readingTimeMinutes: calculateReadingTime(payload.content)
        };
        setFeedback({ 
          type: 'success', 
          message: targetStatus === 'published' ? 'Article published and live!' : 'Article saved as draft.' 
        });
        setTimeout(() => onSaved(updated), 800);
      } else {
        const newId = await createArticle(payload);
        const created: Article = {
          id: newId,
          ...payload,
          readingTimeMinutes: calculateReadingTime(payload.content)
        };
        setFeedback({ 
          type: 'success', 
          message: targetStatus === 'published' ? 'Article created and published!' : 'New article saved as draft.' 
        });
        setTimeout(() => onSaved(created), 800);
      }
    } catch (err: any) {
      console.error('Error saving article:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to save article to database.' });
    } finally {
      setSaving(false);
    }
  };

  const readingTime = calculateReadingTime(content);
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-200/80 transition-colors cursor-pointer"
            title="Return to Articles list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Articles CMS</span>
              <span className="text-slate-400">/</span>
              <span className="text-xs font-bold text-blue-600">
                {isEditing ? 'Edit Article' : 'New Article'}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
              {title || (isEditing ? 'Edit Wellness Article' : 'Create Wellness Article')}
            </h2>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {isEditing && article?.status === 'published' && (
            <a
              href={`/blog/${article.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Public</span>
            </a>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(false)}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{status === 'published' || isEditing ? 'Update & Publish' : 'Publish Article'}</span>
          </button>
        </div>
      </div>

      {/* Inline Notification Banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button 
            onClick={() => setFeedback(null)}
            className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Main Content, Title, Slug, Markdown Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Slug Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Article Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 7 Health Benefits of Swedish Massage for Back Pain"
                className="w-full px-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-base font-bold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Slug URL */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  SEO Slug (URL identifier) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const gen = generateSlug(title);
                    setSlug(gen);
                    setSlugManuallyEdited(false);
                  }}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Auto-generate from Title</span>
                </button>
              </div>

              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs text-slate-400 font-mono select-none">
                  /blog/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(generateSlug(e.target.value));
                    setSlugManuallyEdited(true);
                  }}
                  placeholder="swedish-massage-back-pain-benefits"
                  className={`w-full pl-16 pr-24 py-2.5 bg-slate-50 focus:bg-white border rounded-xl text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-hidden transition-all ${
                    slugAvailable === false 
                      ? 'border-rose-400 ring-2 ring-rose-200' 
                      : slugAvailable === true 
                        ? 'border-emerald-400' 
                        : 'border-slate-200 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                />
                <div className="absolute right-3 flex items-center gap-1 text-[11px]">
                  {slugAvailable === true && (
                    <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Unique
                    </span>
                  )}
                  {slugAvailable === false && (
                    <span className="text-rose-600 font-medium flex items-center gap-0.5">
                      <AlertCircle className="w-3 h-3" /> Taken
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Public URL: <span className="text-slate-600 font-mono">https://eurospacenter.com/blog/{slug || 'your-slug'}</span>
              </p>
            </div>

            {/* Short Excerpt */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Short Excerpt / Summary
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {excerpt.length} / 180 chars
                </span>
              </div>
              <textarea
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="A compelling 1-2 sentence overview of what the reader will learn..."
                className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all leading-relaxed"
              />
            </div>
          </div>

          {/* Full Content Markdown Editor */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            {/* Editor Toolbar Header */}
            <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 flex-wrap">
                {/* Mode Tabs */}
                <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg mr-2">
                  <button
                    type="button"
                    onClick={() => setEditorTab('write')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      editorTab === 'write'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Write</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab('preview')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      editorTab === 'preview'
                        ? 'bg-white text-blue-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live Preview</span>
                  </button>
                </div>

                {/* Quick Formatting Buttons (only enabled in write mode) */}
                {editorTab === 'write' && (
                  <div className="flex items-center gap-1 flex-wrap border-l border-slate-200 pl-2">
                    <button
                      type="button"
                      onClick={() => insertMarkdown('## ')}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                      title="Heading 2 (## )"
                    >
                      <Heading2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('### ')}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                      title="Heading 3 (### )"
                    >
                      <Heading3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('**', '**')}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                      title="Bold (**text**)"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('*', '*')}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                      title="Italic (*text*)"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('- ')}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                      title="Bullet List (- item)"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('1. ')}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                      title="Numbered List (1. item)"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('> ')}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                      title="Blockquote (> quote)"
                    >
                      <Quote className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('[Link text](', ')')}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                      title="Insert Link"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('\n---\n')}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                      title="Divider line (---)"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Word & Reading Metrics */}
              <div className="text-[11px] text-slate-500 font-medium flex items-center gap-3">
                <span>{wordCount} words</span>
                <span>•</span>
                <span>~{readingTime} min read</span>
              </div>
            </div>

            {/* Editor Body */}
            {editorTab === 'write' ? (
              <div className="p-4">
                <textarea
                  ref={textareaRef}
                  rows={18}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your article in Markdown here...

## Understanding Swedish Massage
Swedish massage is one of the most popular therapeutic bodywork techniques worldwide.

### Key Benefits:
- Relieves muscle tension
- Improves blood circulation
- Stimulates natural endorphins

Call or visit Euro Spa Center in Banani to book your personalized session!"
                  className="w-full p-2 text-slate-800 text-sm font-sans leading-relaxed focus:outline-hidden placeholder:text-slate-400 resize-y"
                />
              </div>
            ) : (
              /* Live Preview */
              <div className="p-6 bg-[#FDFBF7] min-h-[380px] max-h-[600px] overflow-y-auto">
                <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-4">
                  {content ? (
                    content.split('\n\n').map((paragraph, idx) => {
                      if (paragraph.startsWith('## ')) {
                        return (
                          <h2 key={idx} className="text-xl font-bold text-slate-900 pt-3 pb-1 border-b border-slate-200">
                            {paragraph.replace('## ', '')}
                          </h2>
                        );
                      }
                      if (paragraph.startsWith('### ')) {
                        return (
                          <h3 key={idx} className="text-base font-bold text-blue-900 pt-1">
                            {paragraph.replace('### ', '')}
                          </h3>
                        );
                      }
                      if (paragraph.startsWith('- ')) {
                        const items = paragraph.split('\n').map(item => item.replace(/^- /, ''));
                        return (
                          <ul key={idx} className="list-disc pl-5 space-y-1 text-slate-700">
                            {items.map((it, i) => (
                              <li key={i} dangerouslySetInnerHTML={{ __html: it.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            ))}
                          </ul>
                        );
                      }
                      if (/^\d+\.\s/.test(paragraph)) {
                        const items = paragraph.split('\n').map(item => item.replace(/^\d+\.\s/, ''));
                        return (
                          <ol key={idx} className="list-decimal pl-5 space-y-1 text-slate-700">
                            {items.map((it, i) => (
                              <li key={i} dangerouslySetInnerHTML={{ __html: it.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            ))}
                          </ol>
                        );
                      }
                      if (paragraph.startsWith('> ')) {
                        return (
                          <blockquote key={idx} className="border-l-4 border-blue-500 pl-4 py-1 italic text-slate-600 bg-white rounded-r-lg">
                            {paragraph.replace(/^>\s?/, '')}
                          </blockquote>
                        );
                      }
                      if (paragraph.trim() === '---') {
                        return <hr key={idx} className="border-slate-200 my-4" />;
                      }
                      return (
                        <p key={idx} className="leading-relaxed text-slate-700">
                          {paragraph}
                        </p>
                      );
                    })
                  ) : (
                    <div className="text-slate-400 text-xs italic py-8 text-center">
                      No content written yet. Switch to Write mode to begin drafting your article.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Settings, Images, SEO, Metadata */}
        <div className="space-y-6">
          {/* Publishing Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Publishing Details
            </h3>

            {/* Status Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Article Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('draft')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    status === 'draft'
                      ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Draft</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('published')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    status === 'published'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Published</span>
                </button>
              </div>
            </div>

            {/* Author */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Author Name
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Euro Spa Team"
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (e.target.value !== 'Other') setCustomCategory('');
                }}
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                {DEFAULT_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="Other">Custom Category...</option>
              </select>

              {category === 'Other' && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category name"
                  className="mt-2 w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              )}
            </div>

            {/* Published Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Published Date Text
              </label>
              <input
                type="text"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                placeholder="March 2026 or March 15, 2026"
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Featured Image & Firebase Storage Upload */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>Featured Image</span>
              <span className="text-[10px] font-normal text-slate-400">Firebase Storage</span>
            </h3>

            {/* Image Preview */}
            <div className="relative aspect-16/10 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              {featuredImage ? (
                <img
                  src={featuredImage}
                  alt={imageAlt || 'Featured Preview'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                  No image selected
                </div>
              )}

              {uploadingImage && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold">Uploading to Firebase ({uploadProgress}%)</span>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="article-image-upload"
              />
              <label
                htmlFor="article-image-upload"
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <UploadCloud className="w-4 h-4 text-blue-600" />
                <span>Upload New Image (Storage)</span>
              </label>
            </div>

            {imageError && (
              <p className="text-[11px] text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{imageError}</span>
              </p>
            )}

            {/* Image URL Manual Override */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Or Image URL
              </label>
              <input
                type="text"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden"
              />
            </div>

            {/* Image Alt Text */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Image Alt Text (SEO & Accessibility)
              </label>
              <input
                type="text"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="e.g. Swedish massage session in luxury Banani suite"
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Article Tags
            </h3>

            {/* Current Tags */}
            <div className="flex flex-wrap gap-1.5 min-h-[32px]">
              {tags.map(t => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="text-blue-400 hover:text-blue-700 cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Add Tag Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(tagInput);
                  }
                }}
                placeholder="Add tag (press Enter)..."
                className="flex-1 px-3 py-1.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => handleAddTag(tagInput)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Add
              </button>
            </div>

            {/* Quick Suggestions */}
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">Quick suggestions:</span>
              <div className="flex flex-wrap gap-1">
                {SUGGESTED_TAGS.filter(s => !tags.includes(s)).slice(0, 5).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleAddTag(s)}
                    className="text-[10px] text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-2 py-0.5 rounded cursor-pointer"
                  >
                    +{s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dedicated SEO Settings & SERP Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                SEO & Social Meta
              </h3>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setSeoTab('settings')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                    seoTab === 'settings' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Fields
                </button>
                <button
                  type="button"
                  onClick={() => setSeoTab('preview')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                    seoTab === 'preview' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  SERP Preview
                </button>
              </div>
            </div>

            {seoTab === 'settings' ? (
              <div className="space-y-3 text-xs">
                {/* Focus Keyword */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Focus Keyword / Phrase
                  </label>
                  <input
                    type="text"
                    value={focusKeyword}
                    onChange={(e) => setFocusKeyword(e.target.value)}
                    placeholder="e.g. Swedish massage Banani"
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* SEO Title */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">
                      SEO Title
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {(seoTitle || title).length} / 60
                    </span>
                  </div>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={title ? `${title} | ${SPA_INFO.name} Banani` : 'Title | Euro Spa Center Banani'}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Meta Description */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">
                      Meta Description
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {(metaDescription || excerpt).length} / 160
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder={excerpt || 'Concise search engine description...'}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 leading-relaxed"
                  />
                </div>

                {/* Canonical URL */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Canonical URL Override
                  </label>
                  <input
                    type="text"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    placeholder={`https://eurospacenter.com/blog/${slug || 'article-slug'}`}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden font-mono text-[11px]"
                  />
                </div>

                {/* Open Graph Overrides */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Social Sharing Overrides (Optional)
                  </span>
                  <input
                    type="text"
                    value={ogTitle}
                    onChange={(e) => setOgTitle(e.target.value)}
                    placeholder="Social Card Title (defaults to SEO Title)"
                    className="w-full px-3 py-1.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden"
                  />
                  <input
                    type="text"
                    value={ogImage}
                    onChange={(e) => setOgImage(e.target.value)}
                    placeholder="Social Card Image URL (defaults to Featured Image)"
                    className="w-full px-3 py-1.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>
            ) : (
              /* Live SEO Preview */
              <AdminSeoPreview
                title={seoTitle || title}
                slug={slug}
                metaDescription={metaDescription || excerpt}
                featuredImage={ogImage || featuredImage}
                focusKeyword={focusKeyword}
                content={content}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
