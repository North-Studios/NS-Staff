import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useRoute } from 'wouter';
import { Header } from '@/components/Header';
import { StaffCard } from '@/components/StaffCard';
import type { Project, StaffMember } from '@shared/schema';
import { Loader2 } from 'lucide-react';
import { getLocalizedValue } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { MarkdownContent } from '@/components/MarkdownContent';

export default function ProjectDetailPage() {
  const [, params] = useRoute('/projects/:endpoint');
  const { t, i18n } = useTranslation('common');
  const endpoint = params?.endpoint;

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ['/api/projects', endpoint],
    enabled: !!endpoint,
  });

  const { data: allStaff } = useQuery<StaffMember[]>({
    queryKey: ['/api/developers'],
  });

  if (isLoading || !project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="loader-project-detail" />
      </div>
    );
  }

  const description = getLocalizedValue(project.description, i18n.language);
  
  const developers = allStaff?.filter(s => project.developers.includes(s.endpoint)) || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-20 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Hero Image */}
          <div 
            className="w-full aspect-video rounded-2xl bg-card overflow-hidden"
            style={{
              backgroundImage: `url(/api/projects/${project.endpoint}/picture)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            data-testid={`img-project-hero-${project.endpoint}`}
          />

          {/* Project Info */}
          <div className="space-y-6">
            <div>
              <h1 className="font-display font-bold text-4xl md:text-5xl mb-4" data-testid={`text-project-name-${project.endpoint}`}>
                {project.name}
              </h1>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag, index) => (
                  <Badge key={tag} variant="secondary" data-testid={`badge-tag-${project.endpoint}-${index}`}>
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="text-xl leading-relaxed text-foreground/90 break-words hyphens-auto" data-testid={`text-project-description-${project.endpoint}`}>
              <MarkdownContent content={description} className="prose-lg" />
            </div>
          </div>

          {/* Developers */}
          {developers.length > 0 && (
            <section data-testid="section-project-developers">
              <h2 className="font-display font-semibold text-2xl mb-6">
                {t('projectCard.developers')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {developers.map((staff) => (
                  <StaffCard key={staff.endpoint} staff={staff} size="small" />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
