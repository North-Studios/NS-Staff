import { Link, useLocation } from 'wouter';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { StaffMember } from '@shared/schema';
import { Mail, Send, Github, Twitter, Key, Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface HeaderProps {
  staff?: StaffMember;
  showCompanyDates?: boolean;
}

export function Header({ staff, showCompanyDates }: HeaderProps) {
  const { t } = useTranslation('common');
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Site-wide contacts configured via translations
  const siteEmail = t('siteOverlay.email', { defaultValue: '' });
  const siteTelegram = t('siteOverlay.telegram', { defaultValue: '' });
  const siteX = t('siteOverlay.x', { defaultValue: '' });
  const companyDates = t('nav.companyDates', { defaultValue: '' });

  // Version from backend (reads package.json on the server)
  const { data: health } = useQuery<{ status: string; version?: string }>({
    queryKey: ['/api/health'],
  });
  const pkgVersion = health?.version;

  const siteVersion =
    pkgVersion && companyDates
      ? `v${pkgVersion} · ${companyDates}`
      : pkgVersion
        ? `v${pkgVersion}`
        : companyDates;
  const hasSiteOverlay =
    !!siteEmail || !!siteTelegram || !!siteX || !!siteVersion;

  const isActive = (href: string) => {
    if (href === '/') return location === '/' || location.startsWith('/news');
    return location === href || location.startsWith(`${href}/`);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="h-full px-6 flex items-center justify-between max-w-7xl mx-auto gap-6">
        <div className="flex items-center gap-4">
          <Link href="/" data-testid="link-home">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 hover-elevate active-elevate-2 px-3 py-2 rounded-md cursor-pointer transition-all" data-testid="button-home">
                  <div className="w-8 h-8 rounded-md flex items-center justify-center">
                    <img src="/favicon.png" alt="Logo" className="w-6 h-6" />
                  </div>
                  <span className="font-display font-semibold text-lg">{t('nav.nsStaff')}</span>
                </div>
              </TooltipTrigger>
              {(showCompanyDates ?? true) && hasSiteOverlay && (
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-2 text-sm">
                    {siteEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <a
                          href={`mailto:${siteEmail}`}
                          className="hover:text-primary transition-colors"
                          onClick={(e) => {
                            // Не даём клику всплыть до ссылки-дома
                            e.stopPropagation();
                          }}
                        >
                          {siteEmail}
                        </a>
                      </div>
                    )}
                    {siteTelegram && (
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4 text-muted-foreground" />
                        <a
                          href={siteTelegram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          {t('contacts.telegram')}
                        </a>
                      </div>
                    )}
                    {siteX && (
                      <div className="flex items-center gap-2">
                        <Twitter className="w-4 h-4 text-muted-foreground" />
                        <a
                          href={siteX}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          {t('contacts.x', { defaultValue: 'X' })}
                        </a>
                      </div>
                    )}
                    {siteVersion && (
                      <div className="pt-1 text-xs text-muted-foreground">
                        {siteVersion}
                      </div>
                    )}
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          </Link>

          {/* Page-level badge for staff detail */}
          {staff && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="px-3 py-1.5 rounded-full bg-card border border-card-border text-sm font-medium cursor-default hidden lg:block" data-testid={`badge-endpoint-${staff.endpoint}`}>
                  {staff.endpoint}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-2 p-1">
                  {staff.contacts.email && (
                    <div className="flex items-center gap-2 text-sm" data-testid={`text-contact-email-${staff.endpoint}`}>
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{staff.contacts.email}</span>
                    </div>
                  )}
                  {staff.contacts.telegram_channel && (
                    <div className="flex items-center gap-2 text-sm">
                      <Send className="w-4 h-4 text-muted-foreground" />
                      <a
                        href={staff.contacts.telegram_channel}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                        data-testid={`link-contact-telegram-${staff.endpoint}`}
                      >
                        {t('contacts.telegram')}
                      </a>
                    </div>
                  )}
                  {staff.contacts.github && (
                    <div className="flex items-center gap-2 text-sm">
                      <Github className="w-4 h-4 text-muted-foreground" />
                      <a
                        href={staff.contacts.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                        data-testid={`link-contact-github-${staff.endpoint}`}
                      >
                        {t('contacts.github')}
                      </a>
                    </div>
                  )}
                  {staff.contacts.x && (
                    <div className="flex items-center gap-2 text-sm">
                      <Twitter className="w-4 h-4 text-muted-foreground" />
                      <a
                        href={staff.contacts.x}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                        data-testid={`link-contact-x-${staff.endpoint}`}
                      >
                        {t('contacts.x', { defaultValue: 'X' })}
                      </a>
                    </div>
                  )}
                  {staff.contacts.vare && (
                    <div className="flex items-center gap-2 text-sm">
                      <Key className="w-4 h-4 text-muted-foreground" />
                      <a
                        href={staff.contacts.vare}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                        data-testid={`link-contact-vare-${staff.endpoint}`}
                      >
                        {t('contacts.varepsilon', { defaultValue: 'Varepsilon' })}
                      </a>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Main navigation */}
        <nav className="hidden md:flex items-center gap-4 text-sm flex-1">
          <Link href="/news">
            <a
              className={
                'px-3 py-1.5 rounded-full border transition-colors ' +
                (isActive('/news')
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground')
              }
            >
              {t('nav.news', { defaultValue: 'Articles' })}
            </a>
          </Link>
          <Link href="/developers">
            <a
              className={
                'px-3 py-1.5 rounded-full border transition-colors ' +
                (isActive('/developers')
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground')
              }
            >
              {t('nav.developers', { defaultValue: 'Developers' })}
            </a>
          </Link>
          <Link href="/projects">
            <a
              className={
                'px-3 py-1.5 rounded-full border transition-colors ' +
                (isActive('/projects')
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground')
              }
            >
              {t('nav.projects', { defaultValue: 'Projects' })}
            </a>
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full border border-border bg-card px-2.5 py-2 text-sm text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                  aria-label="Open navigation"
                  data-testid="button-mobile-menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col justify-between">
                <div className="mt-6 space-y-6">
                  <SheetHeader className="flex flex-row items-center justify-between">
                    <SheetTitle className="font-display text-xl">
                      {t('nav.nsStaff')}
                    </SheetTitle>
                    <LanguageSwitcher />
                  </SheetHeader>

                  <nav className="flex flex-col gap-5 text-sm">
                    <Link href="/news">
                      <a
                        className={
                          'rounded-full border px-4 py-2 transition-colors ' +
                          (isActive('/news')
                            ? 'border-primary text-primary bg-primary/10'
                            : 'border-border text-foreground hover:bg-accent hover:text-accent-foreground')
                        }
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {t('nav.news', { defaultValue: 'Articles' })}
                      </a>
                    </Link>
                    <Link href="/developers">
                      <a
                        className={
                          'rounded-full border px-4 py-2 transition-colors ' +
                          (isActive('/developers')
                            ? 'border-primary text-primary bg-primary/10'
                            : 'border-border text-foreground hover:bg-accent hover:text-accent-foreground')
                        }
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {t('nav.developers', { defaultValue: 'Developers' })}
                      </a>
                    </Link>
                    <Link href="/projects">
                      <a
                        className={
                          'rounded-full border px-4 py-2 transition-colors ' +
                          (isActive('/projects')
                            ? 'border-primary text-primary bg-primary/10'
                            : 'border-border text-foreground hover:bg-accent hover:text-accent-foreground')
                        }
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {t('nav.projects', { defaultValue: 'Projects' })}
                      </a>
                    </Link>
                  </nav>

                  {hasSiteOverlay && (
                    <div className="pt-4 border-t border-border space-y-2 text-sm">
                      {siteEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <a
                            href={`mailto:${siteEmail}`}
                            className="hover:text-primary transition-colors break-all"
                          >
                            {siteEmail}
                          </a>
                        </div>
                      )}
                      {siteTelegram && (
                        <div className="flex items-center gap-2">
                          <Send className="w-4 h-4 text-muted-foreground" />
                          <a
                            href={siteTelegram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary transition-colors break-all"
                          >
                            {t('contacts.telegram')}
                          </a>
                        </div>
                      )}
                      {siteX && (
                        <div className="flex items-center gap-2">
                          <Twitter className="w-4 h-4 text-muted-foreground" />
                          <a
                            href={siteX}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary transition-colors break-all"
                          >
                            {t('contacts.x', { defaultValue: 'X' })}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border flex flex-col gap-1 text-xs text-muted-foreground">
                  {siteVersion && <span>{siteVersion}</span>}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop language switcher */}
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}
