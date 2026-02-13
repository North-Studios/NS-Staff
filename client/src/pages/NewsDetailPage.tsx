import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useRoute } from 'wouter';
import { Header } from '@/components/Header';
import type { Article } from '@shared/schema';
import { Loader2, User } from 'lucide-react';
import { getLocalizedValue, formatPublishedAt } from '@/lib/utils';
import { MarkdownContent } from '@/components/MarkdownContent';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';

export default function NewsDetailPage() {
  const [, params] = useRoute('/news/:id');
  const { t, i18n } = useTranslation('common');
  const id = params?.id;

  const { data: article, isLoading } = useQuery<Article>({
    queryKey: ['/api/news', id],
    enabled: !!id,
  });

  if (isLoading || !article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const title = getLocalizedValue(article.title, i18n.language);
  const content = getLocalizedValue(article.content, i18n.language);
  const published = formatPublishedAt(article.publishedAt, i18n.language);
  const authorEndpoint = article.author?.endpoint;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-20 px-6">
        <article className="max-w-4xl mx-auto space-y-10">
          {/* Banner */}
          {article.bannerUrl && (
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-muted">
              <img
                src={article.bannerUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Header */}
          <header className="space-y-6">
            <div className="space-y-3">
              <h1 className="font-display font-bold text-4xl md:text-5xl">
                {title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {/* Author */}
                <div className="flex items-center gap-2">
                  {article.author?.avatarUrl ? (
                    <img
                      src={article.author.avatarUrl}
                      alt={authorEndpoint}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    {authorEndpoint ? (
                      <Link
                        href={`/developers/${authorEndpoint}`}
                        className="font-medium underline-offset-2 hover:underline"
                      >
                        {authorEndpoint}
                      </Link>
                    ) : (
                      <span className="font-medium">
                        {t('news.unknownAuthor', { defaultValue: 'Unknown author' })}
                      </span>
                    )}
                  </div>
                </div>

                <span>·</span>

                {/* Published at */}
                <span>{published}</span>
              </div>
            </div>

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </header>

          {/* Content */}
          <section className="text-lg leading-relaxed text-foreground/90 break-words hyphens-auto">
            <MarkdownContent content={content} className="prose-lg" />
          </section>
        </article>
      </main>
    </div>
  );
}

