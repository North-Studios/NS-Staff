import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useRoute } from 'wouter';
import { Header } from '@/components/Header';
import NotFound from '@/pages/not-found';
import { PolaroidFan } from '@/components/PolaroidFan';
import { ProjectCard } from '@/components/ProjectCard';
import { CountryFlag, LanguageFlag } from '@/lib/countryFlags';
import type { StaffMember, Project } from '@shared/schema';
import { Loader2, Mail, Send, Github, Twitter } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { getLocalizedValue } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MarkdownContent } from '@/components/MarkdownContent';

export default function StaffDetailPage() {
  const [, params] = useRoute('/developers/:endpoint');
  const { t, i18n } = useTranslation('common');
  const endpoint = params?.endpoint;

  const { data: staff, isLoading, isError, isFetched } = useQuery<StaffMember>({
    queryKey: ['/api/developers', endpoint],
    enabled: !!endpoint,
  });

  const { data: allProjects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  if (isError || (isFetched && !staff)) return <NotFound />;
  if (isLoading || !staff) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="loader-staff-detail" />
      </div>
    );
  }

  const displayName = getLocalizedValue(staff.name, i18n.language);
  const description = getLocalizedValue(staff.description, i18n.language);
  
  const staffProjects =
    allProjects?.filter((p) => p.developers.includes(staff.endpoint)) || [];

  // QR download removed per requirements

  const bgColor = '#28735d';

  return (
    <div 
      className="min-h-screen bg-background"
      style={{
        background: `linear-gradient(to bottom, ${bgColor}08, transparent 50%)`,
      }}
    >
      <Header staff={staff} />
      
      <main className="pt-24 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-16">
            {/* Left: Polaroid Fan - Hidden on mobile */}
            <div className="hidden lg:block lg:col-span-2">
              <PolaroidFan staffEndpoint={staff.endpoint} photoCount={3} />
            </div>

            {/* Mobile: First Photo Only - force white in dark mode */}
            <div className="lg:hidden w-full max-w-sm mx-auto">
              <div 
                className="bg-white dark:!bg-white p-4 pb-16"
                style={{ filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3))' }}
                data-testid="polaroid-mobile"
              >
                <div className="aspect-square bg-white dark:!bg-white overflow-hidden">
                  <img
                    src={`/api/staff/${staff.endpoint}/photo/1`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    data-testid={`img-staff-photo-mobile-${staff.endpoint}`}
                  />
                </div>
              </div>
            </div>

            {/* Right: Staff Info */}
            <div className="lg:col-span-3 space-y-6">
              {/* Name and Flag */}
              <div className="flex items-center gap-3">
                <h1 className="font-display font-bold text-4xl md:text-5xl" data-testid={`text-staff-name-${staff.endpoint}`}>{displayName}</h1>
                <CountryFlag country={staff.country} className="w-10 h-7" />
              </div>

              {/* Nicknames */}
              <div className="flex flex-wrap gap-2">
                {staff.nicknames.map((nickname, index) => (
                  <span 
                    key={nickname} 
                    className="text-sm text-muted-foreground font-mono"
                    data-testid={`text-nickname-${staff.endpoint}-${index}`}
                  >
                    @{nickname}
                  </span>
                ))}
              </div>

              {/* Position, Age, Languages */}
              <div className="flex flex-wrap items-center gap-4 text-lg">
                <span className="font-medium" data-testid={`text-position-${staff.endpoint}`}>{staff.post}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground" data-testid={`text-age-${staff.endpoint}`}>{staff.age} {t('staffCard.years')}</span>
                <span className="text-muted-foreground">·</span>
                <div className="flex items-center gap-2">
                  {staff.languages.map((language, index) => (
                    <Tooltip key={language}>
                      <TooltipTrigger>
                        <div data-testid={`flag-language-${staff.endpoint}-${index}`}>
                          <LanguageFlag language={language} className="w-6 h-4" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t(`languages.${language}`)}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="text-lg leading-relaxed text-foreground/90 break-words hyphens-auto" data-testid={`text-description-${staff.endpoint}`}>
                <MarkdownContent content={description} className="prose-lg" />
              </div>

              {/* Mobile contacts collapsible */}
              {(staff.contacts.email ||
                staff.contacts.telegram_channel ||
                staff.contacts.github ||
                staff.contacts.x) && (
                <div className="lg:hidden">
                  <Accordion type="single" collapsible>
                    <AccordionItem value="contacts">
                      <AccordionTrigger className="text-base">
                        {t('contacts.title', { defaultValue: 'Contacts' })}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 py-1">
                          {staff.contacts.email && (
                            <div className="flex items-center gap-3 text-sm">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <a href={`mailto:${staff.contacts.email}`} className="hover:underline" data-testid={`contact-email-${staff.endpoint}`}>
                                {staff.contacts.email}
                              </a>
                            </div>
                          )}
                          {staff.contacts.telegram_channel && (
                            <div className="flex items-center gap-3 text-sm">
                              <Send className="w-4 h-4 text-muted-foreground" />
                              <a href={staff.contacts.telegram_channel} target="_blank" rel="noopener noreferrer" className="hover:underline" data-testid={`contact-telegram-${staff.endpoint}`}>
                                {t('contacts.telegram')}
                              </a>
                            </div>
                          )}
                          {staff.contacts.github && (
                            <div className="flex items-center gap-3 text-sm">
                              <Github className="w-4 h-4 text-muted-foreground" />
                              <a href={staff.contacts.github} target="_blank" rel="noopener noreferrer" className="hover:underline" data-testid={`contact-github-${staff.endpoint}`}>
                                {t('contacts.github')}
                              </a>
                            </div>
                          )}
                          {staff.contacts.x && (
                            <div className="flex items-center gap-3 text-sm">
                              <Twitter className="w-4 h-4 text-muted-foreground" />
                              <a
                                href={staff.contacts.x}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                                data-testid={`contact-x-${staff.endpoint}`}
                              >
                                {t('contacts.x', { defaultValue: 'X' })}
                              </a>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}

              {/* QR Download Button removed */}
            </div>
          </div>

          {/* Projects Section */}
          {staffProjects.length > 0 && (
            <section data-testid="section-staff-projects">
              <h2 className="font-display font-semibold text-3xl mb-8">
                {t('sections.projects')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {staffProjects.map((project) => (
                  <ProjectCard
                    key={project.endpoint}
                    project={project}
                    size="small"
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
