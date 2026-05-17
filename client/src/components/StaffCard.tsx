import { Link } from 'wouter';
import type { StaffMember } from '@shared/schema';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { CountryFlag } from '@/lib/countryFlags';
import { getLocalizedValue } from '@/lib/utils';
interface StaffCardProps {
  staff: StaffMember;
  size?: 'small' | 'large';
}

export function StaffCard({ staff, size = 'small' }: StaffCardProps) {
  const { i18n, t } = useTranslation('common');
  const displayName = getLocalizedValue(staff.name, i18n.language);

  // Unified design: fall back to global brand colors when per-staff colors
  // are not present (or will be removed when data fully moves to SQL).
  const baseColor1 = staff.colors?.color2 ?? '#9e9e9e';
  const baseColor2 = staff.colors?.color1 ?? '#adadad';
  const borderColor = staff.colors?.color_main ?? '#cbcbcb';

  const gradientStyle = {
    background: `linear-gradient(135deg, ${baseColor1}15, ${baseColor2}15)`,
    borderColor: `${borderColor}33`,
  };

  if (size === 'large') {
    return (
      <Card 
        className="p-6 hover-elevate active-elevate-2 transition-all duration-300 border card-mobile-light"
        style={gradientStyle}
        data-testid={`card-staff-large-${staff.endpoint}`}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-card to-background flex items-center justify-center">
            <CountryFlag country={staff.country} className="w-8 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-xl" data-testid={`text-name-${staff.endpoint}`}>{displayName}</h3>
            <p className="text-sm text-muted-foreground" data-testid={`text-nickname-${staff.endpoint}`}>@{staff.nicknames[0]}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground" data-testid={`text-post-${staff.endpoint}`}>{staff.post}</p>
      </Card>
    );
  }

  return (
    <Link href={`/developers/${staff.endpoint}`} data-testid={`link-staff-${staff.endpoint}`}>
      <Card 
        className="group relative overflow-hidden aspect-[3/4] hover-elevate active-elevate-2 transition-all duration-300 cursor-pointer border card-mobile-light"
        style={gradientStyle}
        data-testid={`card-staff-${staff.endpoint}`}
      >
        <div className="absolute inset-0 p-6 flex flex-col justify-end">
          <div
            className="absolute inset-0 opacity-20 bg-cover bg-center transition-opacity duration-300 group-hover:opacity-30"
            style={{ backgroundImage: `url(/api/staff/${staff.endpoint}/photo/1)` }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-display font-semibold text-xl" data-testid={`text-name-${staff.endpoint}`}>{displayName}</h3>
              <CountryFlag country={staff.country} className="w-6 h-4" />
            </div>
            <p className="text-sm text-muted-foreground mb-1" data-testid={`text-nickname-${staff.endpoint}`}>@{staff.nicknames[0]}</p>
            <p className="text-sm font-medium" data-testid={`text-post-${staff.endpoint}`}>{staff.post}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
