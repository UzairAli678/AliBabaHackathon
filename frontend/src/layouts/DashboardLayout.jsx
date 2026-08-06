import { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bars3Icon,
  BellAlertIcon,
  CalendarDaysIcon,
  ChartBarSquareIcon,
  ChevronDownIcon,
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
  '/emergency': 'Emergency Mode'
};

function getPageTitle(pathname) {
  const current = sidebarNavItems.find((item) => item.to === pathname);
  return current?.label || routeTitles[pathname] || 'Dashboard';
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
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

  return (
    <div className="min-h-screen bg-background text-text lg:pl-80">
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="fixed left-4 top-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-white text-heading shadow-card lg:hidden"
        aria-label="Open sidebar"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r border-border bg-white shadow-soft transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <LogoMark className="h-10 w-auto" />
            <div>
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

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
          {sidebarNavItems.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={label}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive ? 'bg-primary text-white shadow-card' : 'text-muted hover:bg-slate-100 hover:text-heading'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <NavLink
            to="/emergency"
            onClick={() => setSidebarOpen(false)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-critical px-4 py-3 text-sm font-medium text-white shadow-soft transition hover:opacity-90"
          >
            <BellAlertIcon className="h-4 w-4" />
            Emergency
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
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 pl-16 sm:px-6 lg:px-8 lg:pl-8">
            <div>
              <h1 className="text-2xl font-medium tracking-tight text-heading">{pageTitle}</h1>
              <p className="mt-1 text-sm text-muted">Your secure CareLedger AI workspace</p>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                className="flex items-center gap-3 rounded-full border border-border bg-white px-3 py-2 shadow-card"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserCircleIcon className="h-5 w-5" />
                </div>
                <div className="hidden text-left leading-tight sm:block">
                  <div className="text-sm font-medium text-heading">{displayName}</div>
                  <div className="text-xs text-muted">Signed in</div>
                </div>
                <ChevronDownIcon className="h-4 w-4 text-muted" />
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
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
