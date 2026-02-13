import { Link } from 'wouter';
import type { Project } from '@shared/schema';
import { useTranslation } from 'react-i18next';
import { getLocalizedValue } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MarkdownContent } from '@/components/MarkdownContent';

interface ProjectCardProps {
  project: Project;
  size?: 'small' | 'large';
  accentColor?: string;
}

export function ProjectCard({ project, size = 'small', accentColor = '#9e9e9e' }: ProjectCardProps) {
  const { i18n } = useTranslation('common');
  const description = getLocalizedValue(project.description, i18n.language);

  const gradientStyle = {
    background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}10)`,
    borderColor: `${accentColor}33`,
  };

  if (size === 'large') {
    return (
      <Card 
        className="p-6 border transition-all duration-300"
        style={gradientStyle}
        data-testid={`card-project-large-${project.endpoint}`}
      >
        <div className="flex items-start gap-4">
          <div 
            className="w-20 h-20 rounded-lg bg-cover bg-center flex-shrink-0"
            style={{ 
              backgroundImage: `url(/api/projects/${project.endpoint}/picture)`,
              backgroundColor: `${accentColor}20`
            }}
            data-testid={`img-project-picture-${project.endpoint}`}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-xl mb-2" data-testid={`text-project-name-${project.endpoint}`}>{project.name}</h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {project.tags.map((tag, index) => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="text-xs"
                  style={{ borderColor: `${accentColor}40` }}
                  data-testid={`badge-tag-${project.endpoint}-${index}`}
                >
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="text-sm text-muted-foreground" data-testid={`text-project-description-${project.endpoint}`}>
              <MarkdownContent content={description} className="prose-sm prose-p:my-1" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Link href={`/projects/${project.endpoint}`} data-testid={`link-project-${project.endpoint}`}>
      <Card 
        className="group relative overflow-hidden aspect-[16/10] hover-elevate active-elevate-2 transition-all duration-300 cursor-pointer border"
        style={gradientStyle}
        data-testid={`card-project-${project.endpoint}`}
      >
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 opacity-20 bg-cover bg-center transition-opacity duration-300 group-hover:opacity-40"
            style={{ 
              backgroundImage: `url(/api/projects/${project.endpoint}/picture)`,
              backgroundColor: `${accentColor}20`
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
        <div className="relative h-full p-6 flex flex-col justify-end">
          <h3 className="font-display font-semibold text-lg mb-2" data-testid={`text-project-name-${project.endpoint}`}>{project.name}</h3>
          <div className="flex flex-wrap gap-1.5">
            {project.tags.map((tag, index) => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className="text-xs"
                style={{ borderColor: `${accentColor}40` }}
                data-testid={`badge-tag-${project.endpoint}-${index}`}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    </Link>
  );
}
