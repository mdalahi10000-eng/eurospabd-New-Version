import { useState, useEffect } from 'react';
import { User } from '../../../supabase';
import { Article } from '../../../types';
import { 
  fetchAllArticlesAdmin, 
  deleteArticle, 
  toggleArticlePublish 
} from '../../../services/articlesService';
import { AdminArticleList } from './AdminArticleList';
import { AdminArticleEditor } from './AdminArticleEditor';

interface AdminBlogSectionProps {
  currentUser: User | null;
}

export function AdminBlogSection({ currentUser }: AdminBlogSectionProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const items = await fetchAllArticlesAdmin();
      setArticles(items);
    } catch (err) {
      console.error('Failed to load articles for admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handleNewArticle = () => {
    setSelectedArticle(null);
    setViewMode('editor');
  };

  const handleEditArticle = (article: Article) => {
    setSelectedArticle(article);
    setViewMode('editor');
  };

  const handleDeleteArticle = async (articleId: string) => {
    await deleteArticle(articleId);
    setArticles(prev => prev.filter(a => a.id !== articleId));
  };

  const handleTogglePublish = async (article: Article) => {
    const newStatus = await toggleArticlePublish(article);
    setArticles(prev => prev.map(a => {
      if (a.id === article.id) {
        return {
          ...a,
          status: newStatus,
          publishedAt: newStatus === 'published' && !a.publishedAt 
            ? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) 
            : a.publishedAt
        };
      }
      return a;
    }));
  };

  const handleArticleSaved = (savedArticle: Article) => {
    setArticles(prev => {
      const exists = prev.some(a => a.id === savedArticle.id);
      if (exists) {
        return prev.map(a => a.id === savedArticle.id ? savedArticle : a);
      } else {
        return [savedArticle, ...prev];
      }
    });
    setViewMode('list');
    setSelectedArticle(null);
  };

  if (viewMode === 'editor') {
    return (
      <AdminArticleEditor
        article={selectedArticle}
        currentUser={currentUser}
        onBack={() => {
          setViewMode('list');
          setSelectedArticle(null);
        }}
        onSaved={handleArticleSaved}
      />
    );
  }

  return (
    <AdminArticleList
      articles={articles}
      loading={loading}
      onNewArticle={handleNewArticle}
      onEditArticle={handleEditArticle}
      onDeleteArticle={handleDeleteArticle}
      onTogglePublish={handleTogglePublish}
    />
  );
}
