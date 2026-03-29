import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header';
import { SearchInput } from '@/components/SearchInput';
import { ProjectCard } from '@/components/ProjectCard';
import type { Project } from '@shared/schema';
import { Loader2 } from 'lucide-react';
import { getLocalizedValue } from '@/lib/utils';

export default function ProjectsPage() {
  const { t, i18n } = useTranslation('common');
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.title = 'NS Staff Portfolio';
  }, []);

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const filteredProjects = projects?.filter((project) => {
    if (!search) return true;
    const description = getLocalizedValue(project.description, i18n.language);
    const searchLower = search.toLowerCase();
    return (
      project.name.toLowerCase().includes(searchLower) ||
      project.endpoint.toLowerCase().includes(searchLower) ||
      project.tags.some((tag) => tag.toLowerCase().includes(searchLower)) ||
      description.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-7xl mx-auto space-y-10">
          <section data-testid="section-projects">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <h1 className="font-display font-semibold text-3xl" data-testid="heading-projects">
                {t('sections.projects')}
              </h1>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('search.searchProjects')}
                testId="input-search-projects"
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20" data-testid="loader-projects-list">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredProjects && filteredProjects.length > 0 ? (
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                data-testid="grid-projects"
              >
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.endpoint} project={project} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20" data-testid="empty-projects">
                <p className="text-muted-foreground">{t('empty.noProjects')}</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

