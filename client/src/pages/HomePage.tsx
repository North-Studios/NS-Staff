import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header';
import { SearchInput } from '@/components/SearchInput';
import { StaffCard } from '@/components/StaffCard';
import { ProjectCard } from '@/components/ProjectCard';
import type { StaffMember, Project } from '@shared/schema';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { t, i18n } = useTranslation('common');
  const [staffSearch, setStaffSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');

  const { data: staffMembers, isLoading: isLoadingStaff } = useQuery<StaffMember[]>({
    queryKey: ['/api/developers'],
  });

  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const filteredStaff = staffMembers?.filter((staff) => {
    if (!staffSearch) return true;
    const langKey = i18n.language === 'ru' ? 'ru-RU' : 'en-EN';
    const name = staff.name[langKey] || staff.name['en-EN'] || '';
    const searchLower = staffSearch.toLowerCase();
    return (
      name.toLowerCase().includes(searchLower) ||
      staff.endpoint.toLowerCase().includes(searchLower) ||
      staff.nicknames.some(nick => nick.toLowerCase().includes(searchLower)) ||
      staff.post.toLowerCase().includes(searchLower)
    );
  });

  const filteredProjects = projects?.filter((project) => {
    if (!projectSearch) return true;
    const langKey = i18n.language === 'ru' ? 'ru-RU' : 'en-EN';
    const description = project.description[langKey] || project.description['en-EN'] || '';
    const searchLower = projectSearch.toLowerCase();
    return (
      project.name.toLowerCase().includes(searchLower) ||
      project.endpoint.toLowerCase().includes(searchLower) ||
      project.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
      description.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <Header showCompanyDates />
      
      <main className="pt-24 pb-20 px-6">
        <div className="max-w-7xl mx-auto space-y-20">
          {/* Staff Section */}
          <section data-testid="section-staff">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <h2 className="font-display font-semibold text-3xl" data-testid="heading-staff">{t('sections.staff')}</h2>
              <SearchInput
                value={staffSearch}
                onChange={setStaffSearch}
                placeholder={t('search.searchStaff')}
                testId="input-search-staff"
              />
            </div>

            {isLoadingStaff ? (
              <div className="flex items-center justify-center py-20" data-testid="loader-staff-list">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredStaff && filteredStaff.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="grid-staff">
                {filteredStaff.map((staff) => (
                  <StaffCard key={staff.endpoint} staff={staff} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20" data-testid="empty-staff">
                <p className="text-muted-foreground">{t('empty.noStaff')}</p>
              </div>
            )}
          </section>

          {/* Projects Section */}
          <section data-testid="section-projects">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <h2 className="font-display font-semibold text-3xl" data-testid="heading-projects">{t('sections.projects')}</h2>
              <SearchInput
                value={projectSearch}
                onChange={setProjectSearch}
                placeholder={t('search.searchProjects')}
                testId="input-search-projects"
              />
            </div>

            {isLoadingProjects ? (
              <div className="flex items-center justify-center py-20" data-testid="loader-projects-list">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredProjects && filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="grid-projects">
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
