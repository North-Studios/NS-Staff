import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header';
import type { Article } from '@shared/schema';
import { Loader2 } from 'lucide-react';
import { getLocalizedValue, formatPublishedAt } from '@/lib/utils';
import { Link, useLocation } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/SearchInput';

export default function NewsListPage() {
  const { t, i18n } = useTranslation('common');
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');

  const { data: articles, isLoading } = useQuery<Article[]>({
    queryKey: ['/api/news'],
  });

  const filteredArticles = articles?.filter((article) => {
    if (!search) return true;

    const searchLower = search.toLowerCase();
    const title = getLocalizedValue(article.title, i18n.language).toLowerCase();
    const summary = getLocalizedValue(article.summary, i18n.language).toLowerCase();
    const content = getLocalizedValue(article.content, i18n.language).toLowerCase();
    const tags = article.tags.join(' ').toLowerCase();
    const dateIso = article.publishedAt.toLowerCase();

    return (
      title.includes(searchLower) ||
      summary.includes(searchLower) ||
      content.includes(searchLower) ||
      tags.includes(searchLower) ||
      dateIso.includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="font-display font-semibold text-3xl">
                {t('sections.news', { defaultValue: 'Articles' })}
              </h1>
              <p className="text-muted-foreground">
                {t('news.subtitle', {
                  defaultValue: 'Fresh notes and updates from the team.',
                })}
              </p>
            </div>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('search.searchNews', {
                defaultValue: 'Search articles...',
              })}
              testId="input-search-news"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !articles || articles.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">
                {t('news.empty', { defaultValue: 'No articles yet.' })}
              </p>
            </div>
          ) : filteredArticles && filteredArticles.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">
                {t('search.noNewsResults', {
                  defaultValue: 'No articles match your query.',
                })}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredArticles!.map((article) => {
                const title = getLocalizedValue(article.title, i18n.language);
                const summary = getLocalizedValue(article.summary, i18n.language);
                const published = formatPublishedAt(article.publishedAt, i18n.language);
                const authorEndpoint = article.author?.endpoint;

                return (
                  <Link
                    key={article.id}
                    href={`/news/${article.id}`}
                    className="group"
                  >
                    <article className="h-full flex flex-col overflow-hidden rounded-xl border bg-card hover-elevate active-elevate-2 transition-all duration-300 cursor-pointer">
                      {article.bannerUrl && (
                        <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                          <img
                            src={article.bannerUrl}
                            alt={title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      )}

                      <div className="p-5 space-y-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {authorEndpoint && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setLocation(`/developers/${authorEndpoint}`);
                                }}
                                className="underline-offset-2 hover:underline"
                              >
                                {authorEndpoint}
                              </button>
                              <span>·</span>
                            </>
                          )}
                          <span>{published}</span>
                        </div>

                        <h2 className="font-display font-semibold text-xl line-clamp-2">
                          {title}
                        </h2>

                        {summary && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {summary}
                          </p>
                        )}

                        {article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {article.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-[11px] px-2 py-0.5"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

