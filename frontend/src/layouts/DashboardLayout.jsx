import { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bars3Icon,
  BellAlertIcon,
  CalendarDaysIcon,
  ChartBarSquareIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BeakerIcon,
  HomeIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  SparklesIcon,
  WalletIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ArrowRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import LogoMark from '../components/LogoMark';
import { useAuth } from '../context/AuthContext';

const sidebarNavItems = [
  { label: 'Dashboard', to: '/dashboard', icon: HomeIcon },
  { label: 'Health Assessment', to: '/assessment', icon: HeartIcon },
  { label: 'Disease Prediction', to: '/disease-prediction', icon: BeakerIcon },
  { label: 'Smart Care Navigator', to: '/navigator', icon: SparklesIcon },
  { label: 'Cost Intelligence', to: '/cost', icon: WalletIcon },
  { label: 'Appointments', to: '/appointments', icon: CalendarDaysIcon },
  { label: 'AI Chat', to: '/chat', icon: ChatBubbleLeftRightIcon }
];

const routeTitles = {
  '/emergency': 'Emergency Mode',
  '/profile': 'Profile'
};

function getPageTitle(pathname) {
  const current = sidebarNavItems.find((item) => item.to === pathname);
  return current?.label || routeTitles[pathname] || 'Dashboard';
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem('careledger-sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut, profileImage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const displayName = useMemo(() => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  }, [user]);

  const pageTitle = getPageTitle(location.pathname);

  const handleLogOut = async () => {
    await signOut();
    navigate('/');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem('careledger-sidebar-collapsed', String(next));
      } catch {
        // The layout still works if browser storage is unavailable.
      }
      return next;
    });
  };

  return (
    <div className={`min-h-screen bg-background text-text transition-[padding] duration-300 ease-in-out ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-80'}`}>
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="fixed left-4 top-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-white text-heading shadow-card lg:hidden"
        aria-label="Open sidebar"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r border-border bg-white shadow-soft transition-[width,transform] duration-300 ease-in-out lg:translate-x-0 ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-80'} ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className={`flex min-h-[81px] items-center justify-between border-b border-border px-6 py-5 transition-[padding] duration-300 ${sidebarCollapsed ? 'lg:justify-center lg:px-3' : ''}`}>
          <div className={`flex items-center gap-3 overflow-hidden transition-all duration-200 ${sidebarCollapsed ? 'lg:w-0 lg:opacity-0' : 'opacity-100'}`}>
            <LogoMark className="h-10 w-auto" />
            <div className="whitespace-nowrap">
              <div className="text-lg font-medium tracking-tight text-heading">CareLedger AI</div>
              <div className="text-xs text-muted">Secure care workspace</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border text-heading lg:hidden"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className={`flex-1 space-y-1 overflow-y-auto px-4 py-5 transition-[padding] duration-300 ${sidebarCollapsed ? 'lg:px-3' : ''}`}>
          {sidebarNavItems.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={label}
              to={to}
              onClick={() => setSidebarOpen(false)}
              title={sidebarCollapsed ? label : undefined}
              aria-label={label}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${sidebarCollapsed ? 'lg:justify-center lg:gap-0 lg:px-0' : ''} ${
                  isActive ? 'bg-primary text-white shadow-card' : 'text-muted hover:bg-slate-100 hover:text-heading'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className={`whitespace-nowrap transition-all duration-200 ${sidebarCollapsed ? 'lg:max-w-0 lg:overflow-hidden lg:opacity-0' : 'max-w-52 opacity-100'}`}>{label}</span>
              {sidebarCollapsed ? <span className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-xl bg-heading px-3 py-2 text-xs font-medium text-white opacity-0 shadow-soft transition-opacity group-hover:opacity-100 lg:block">{label}</span> : null}
            </NavLink>
          ))}
        </nav>

        <div className={`border-t border-border p-4 transition-[padding] duration-300 ${sidebarCollapsed ? 'lg:p-3' : ''}`}>
          <NavLink
            to="/emergency"
            onClick={() => setSidebarOpen(false)}
            title={sidebarCollapsed ? 'Emergency' : undefined}
            aria-label="Emergency"
            className="group relative inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-critical px-4 py-3 text-sm font-medium text-white shadow-soft transition hover:opacity-90"
          >
            <BellAlertIcon className="h-4 w-4 shrink-0" />
            <span className={`whitespace-nowrap transition-all duration-200 ${sidebarCollapsed ? 'lg:max-w-0 lg:overflow-hidden lg:opacity-0' : 'max-w-24 opacity-100'}`}>Emergency</span>
            {sidebarCollapsed ? <span className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-xl bg-critical px-3 py-2 text-xs font-medium text-white opacity-0 shadow-soft transition-opacity group-hover:opacity-100 lg:block">Emergency</span> : null}
          </NavLink>
        </div>
      </aside>

      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
        />
      ) : null}

      <div className="min-h-screen">
        <header className="sticky top-0 z-30 border-b border-border/80 bg-white/90 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur-xl">
          <div className="mx-auto flex min-h-[88px] max-w-7xl items-center justify-between gap-4 px-4 pl-16 sm:px-6 lg:px-8 lg:pl-8">
            <div className="flex min-w-0 items-center gap-4 sm:gap-5">
              <div className="flex shrink-0 items-center gap-3">
                <LogoMark className="h-11 w-auto sm:h-12" />
                <span className="hidden whitespace-nowrap text-lg font-semibold tracking-tight text-heading sm:block">CareLedger AI</span>
              </div>
              <div className="hidden h-8 w-px bg-border sm:block" />
              <span className="truncate rounded-full border border-primary/15 bg-teal-50 px-3 py-1.5 text-xs font-medium text-primary sm:text-sm">{pageTitle}</span>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-white text-muted shadow-card transition hover:border-primary/30 hover:bg-teal-50 hover:text-primary"
                aria-label="Notifications"
                title="Notifications"
              >
                <BellAlertIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={toggleSidebar}
                className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-border bg-white text-heading shadow-card transition hover:border-primary/30 hover:bg-teal-50 hover:text-primary lg:inline-flex"
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((current) => !current)}
                  className="flex items-center gap-3 rounded-full border border-border bg-white px-2.5 py-2 shadow-card sm:px-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
                    {profileImage ? <img src={profileImage} alt={`${displayName}'s profile`} className="h-full w-full object-cover" /> : <UserCircleIcon className="h-5 w-5" />}
                  </div>
                  <div className="hidden text-left leading-tight xl:block">
                    <div className="text-sm font-medium text-heading">{displayName}</div>
                    <div className="text-xs text-muted">Signed in</div>
                  </div>
                  <ChevronDownIcon className="hidden h-4 w-4 text-muted sm:block" />
                </button>

                {menuOpen ? (
                  <div className="absolute right-0 mt-3 w-48 overflow-hidden rounded-2xl border border-border bg-white p-2 shadow-soft">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        navigate('/profile');
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-heading hover:bg-slate-100"
                    >
                      <UserCircleIcon className="h-4 w-4" />
                      Profile
                    </button>
                    <button
                      type="button"
                      onClick={handleLogOut}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-critical hover:bg-rose-50"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
