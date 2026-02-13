import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header';
import { SearchInput } from '@/components/SearchInput';
import { StaffCard } from '@/components/StaffCard';
import type { StaffMember } from '@shared/schema';
import { Loader2 } from 'lucide-react';
import { getLocalizedValue } from '@/lib/utils';

export default function DevelopersPage() {
  const { t, i18n } = useTranslation('common');
  const [search, setSearch] = useState('');

  const { data: staffMembers, isLoading } = useQuery<StaffMember[]>({
    queryKey: ['/api/developers'],
  });

  const filteredStaff = staffMembers?.filter((staff) => {
    if (!search) return true;
    const name = getLocalizedValue(staff.name, i18n.language);
    const searchLower = search.toLowerCase();
    return (
      name.toLowerCase().includes(searchLower) ||
      staff.endpoint.toLowerCase().includes(searchLower) ||
      staff.nicknames.some((nick) => nick.toLowerCase().includes(searchLower)) ||
      staff.post.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-7xl mx-auto space-y-10">
          <section data-testid="section-staff">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <h1 className="font-display font-semibold text-3xl" data-testid="heading-staff">
                {t('sections.staff')}
              </h1>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('search.searchStaff')}
                testId="input-search-staff"
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20" data-testid="loader-staff-list">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredStaff && filteredStaff.length > 0 ? (
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                data-testid="grid-staff"
              >
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
        </div>
      </main>
    </div>
  );
}

