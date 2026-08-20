import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import {
  BellAlertIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  BeakerIcon,
  HomeIcon,
  HeartIcon,
  ShieldCheckIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  WalletIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import LogoMark from './components/LogoMark';
import PlaceholderPage from './components/PlaceholderPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/Dashboard';
import AssessmentPage from './pages/Assessment';
import DiseasePredictionPage from './pages/DiseasePrediction';
import NavigatorPage from './pages/Navigator';
import EmergencyPage from './pages/Emergency';
import DashboardFeaturePage from './pages/DashboardFeaturePage';
import ChatPage from './pages/Chat';
import ProfilePage from './pages/Profile';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CostIntelligencePage from './pages/CostIntelligence';
import AppointmentsPage from './pages/Appointments';
import { AuthProvider, useAuth } from './context/AuthContext';
import useCareContext from './store/useCareContext';
import healthAssessmentImage from './assets/illustrations/Health assessment selected.jpg.jpeg';
import diseasePredictionImage from './assets/illustrations/Disease prediction selected.png';
import careNavigatorImage from './assets/illustrations/care navigator selected.png';
import costIntelligenceImage from './assets/illustrations/cost intelligence selected.png';
import treatmentAffordabilityImage from './assets/illustrations/Treatment affordability selected.jpg.jpeg';
import appointmentsImage from './assets/illustrations/Appointments selected.jpg.jpeg';
import aiChatImage from './assets/illustrations/Ai chat selected.png';
import healthRoadmapImage from './assets/illustrations/Health roadmap selected.jpg.jpeg';
import homePageVideo from './assets/illustrations/Home page video.mp4';
import dashboardPoster from './assets/illustrations/dashboard.jpeg';

const navItems = [
  { label: 'Home', to: '/', icon: HomeIcon },
  { label: 'Care Navigator', to: '/navigator', icon: SparklesIcon },
  { label: 'Cost', to: '/cost', icon: CurrencyDollarIcon },
  { label: 'Appointments', to: '/appointments', icon: CalendarDaysIcon },
];

const features = [
  {
    title: 'Health Assessment',
    description: 'Capture symptoms and get structured next-step guidance.',
    icon: HeartIcon,
    tint: 'bg-teal-50',
    image: healthAssessmentImage,
    href: '/assessment'
  },
  {
    title: 'Disease Prediction',
    description: 'Search symptoms and see likely conditions from the AI model.',
    icon: BeakerIcon,
    tint: 'bg-violet-50',
    image: diseasePredictionImage,
    href: '/disease-prediction'
  },
  {
    title: 'Smart Care Navigator',
    description: 'Get calm, practical guidance on the right next step for symptoms and follow-up care.',
    icon: SparklesIcon,
    tint: 'bg-teal-50',
    image: careNavigatorImage,
    href: '/navigator'
  },
  {
    title: 'Cost Intelligence',
    description: 'Review transparent estimates and compare options before you commit to care.',
    icon: WalletIcon,
    tint: 'bg-amber-50',
    image: costIntelligenceImage,
    href: '/cost'
  },
  {
    title: 'Treatment Affordability',
    description: 'Track affordability and make care plans easier to manage.',
    icon: ShieldCheckIcon,
    tint: 'bg-emerald-50',
    image: treatmentAffordabilityImage,
    href: '/affordability'
  },
  {
    title: 'Appointments',
    description: 'Keep your visits organized in one place.',
    icon: CalendarDaysIcon,
    tint: 'bg-slate-50',
    image: appointmentsImage,
    href: '/appointments'
  },
  {
    title: 'AI Chat',
    description: 'Ask follow-up questions and get quick support.',
    icon: ChatBubbleLeftRightIcon,
    tint: 'bg-cyan-50',
    image: aiChatImage,
    href: '/chat'
  },
  {
    title: 'Health Roadmap',
    description: 'Follow your care plan and milestones over time.',
    icon: SparklesIcon,
    tint: 'bg-sky-50',
    image: healthRoadmapImage,
    href: '/roadmap'
  }
];

const stats = [
  { value: '24/7', label: 'AI support' },
  { value: 'Transparent', label: 'cost guidance' },
  { value: 'Trusted', label: 'clinical style' }
];

function IconCard({ icon: Icon, title, description, tint, href, image }) {
  return (
    <NavLink
      to={href}
      className="group relative min-h-[390px] overflow-hidden rounded-[28px] border border-border bg-heading shadow-card transition duration-300 hover:-translate-y-1.5 hover:shadow-soft"
    >
      <img
        src={image}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
      <div className="relative flex min-h-[390px] flex-col justify-end p-6 sm:p-7">
        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${tint} shadow-lg ring-1 ring-white/50`}>
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="mt-4 text-2xl font-medium tracking-tight text-white">{title}</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-white/80">{description}</p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white">
          Explore feature
          <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </NavLink>
  );
}

function NavAuthActions() {
  const { user, signOut } = useAuth();
  const clearCareHistory = useCareContext((state) => state.clearCareHistory);
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <NavLink
          to="/signin"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2.5 text-sm font-medium text-heading transition hover:bg-slate-50"
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4" />
          Sign In
        </NavLink>
        <NavLink
          to="/signup"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-soft transition hover:opacity-90"
        >
          <UserPlusIcon className="h-4 w-4" />
          Sign Up
        </NavLink>
      </div>
    );
  }

  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-3 rounded-full border border-border bg-white px-3 py-2 shadow-card">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserCircleIcon className="h-5 w-5" />
        </div>
        <div className="hidden leading-tight sm:block">
          <div className="text-sm font-medium text-heading">{name}</div>
          <div className="text-xs text-muted">Signed in</div>
        </div>
      </div>
      <button
        type="button"
        onClick={async () => {
          clearCareHistory();
          await signOut();
          navigate('/');
        }}
        className="inline-flex items-center gap-2 rounded-full bg-heading px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
      >
        <ArrowRightIcon className="h-4 w-4" />
        Log out
      </button>
    </div>
  );
}

function GuestOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function LandingRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Shell>
      <HomePage />
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-background text-text">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <NavLink to="/" className="flex items-center gap-3">
            <LogoMark className="h-10 w-auto" />
            <div>
              <div className="text-lg font-medium tracking-tight text-heading">CareLedger AI</div>
              <div className="text-xs text-muted">Hospital-grade guidance, simplified</div>
            </div>
          </NavLink>

          <nav className="hidden items-center gap-2 xl:flex">
            {navItems.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={label}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-primary text-white' : 'text-muted hover:bg-slate-100 hover:text-heading'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <NavLink
              to="/emergency"
              className="hidden items-center gap-2 rounded-full bg-critical px-4 py-3 text-sm font-medium text-white shadow-soft transition hover:opacity-90 md:inline-flex"
            >
              <BellAlertIcon className="h-4 w-4" />
              Emergency
            </NavLink>
            <NavAuthActions />
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-border bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <LogoMark className="h-8 w-auto" />
              <div className="text-lg font-medium tracking-tight text-heading">CareLedger AI</div>
            </div>
            <p className="mt-4 max-w-md text-sm leading-7 text-muted">
              A premium healthcare experience for symptom guidance, cost clarity, appointments, and care planning.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <div className="font-medium text-heading">Explore</div>
              <div className="mt-3 space-y-2 text-muted">
                {navItems.map((item) => (
                  <div key={item.label}>
                    <NavLink to={item.to} className="hover:text-heading">
                      {item.label}
                    </NavLink>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="font-medium text-heading">Contact</div>
              <div className="mt-3 space-y-2 text-muted">
                <p>support@careledger.ai</p>
                <p>24/7 care assistant</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HomePage() {
  const { user } = useAuth();

  return (
    <main>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="relative isolate min-h-[620px] overflow-hidden rounded-[32px] border border-border bg-heading shadow-soft">
          <video
            className="absolute inset-0 h-full w-full object-cover object-center"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={dashboardPoster}
            onLoadedMetadata={(event) => { event.currentTarget.playbackRate = 0.6; }}
            aria-hidden="true"
          >
            <source src={homePageVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/30" />
          <div className="relative flex min-h-[620px] max-w-3xl flex-col justify-center p-7 sm:p-12 lg:p-16">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-md">
            <ShieldCheckIcon className="h-4 w-4" />
            Trusted guidance for better care planning
          </div>
          <h1 className="mt-6 max-w-2xl text-4xl font-medium tracking-tight text-white sm:text-5xl lg:text-6xl">
            Your health, understood and planned
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/80">
            CareLedger AI brings calm symptom guidance, transparent cost intelligence, and structured care planning into one polished hospital-style experience.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <NavLink
              to={user ? '/assessment' : '/signin'}
              className="inline-flex items-center rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-white shadow-soft transition hover:opacity-90"
            >
              Check your symptoms
            </NavLink>
            <NavLink
              to="/navigator"
              className="inline-flex items-center rounded-full border border-white/30 bg-white/15 px-6 py-3.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/25"
            >
              Open care navigator
            </NavLink>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/20 bg-slate-950/35 px-4 py-4 shadow-card backdrop-blur-md">
                <div className="text-2xl font-medium text-white">{stat.value}</div>
                <div className="mt-1 text-sm text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 pb-24 sm:px-6 lg:px-8 lg:py-16 lg:pb-32">
        <div className="mb-10 max-w-2xl">
          <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Everything connected</div>
          <h2 className="mt-3 text-3xl font-medium tracking-tight text-heading sm:text-4xl">Explore your complete care toolkit</h2>
          <p className="mt-4 text-sm leading-7 text-muted">From a first symptom check to long-term planning, every module is designed to make the next step clearer.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          {features.map((feature) => (
            <IconCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-border bg-white p-6 shadow-card lg:col-span-2">
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Trusted guidance</div>
            <h2 className="mt-3 text-3xl font-medium tracking-tight text-heading">Built to feel like a modern care center</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
              Clean presentation, clear hierarchy, and reassuring tone help users focus on decisions rather than noise.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-heading p-6 text-white shadow-soft">
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-white/70">24/7 AI support</div>
            <h3 className="mt-3 text-2xl font-medium tracking-tight">Always available when questions arrive</h3>
            <p className="mt-4 text-sm leading-7 text-white/80">
              Emergency escalation stays distinct and visible, while everything else remains calm and easy to scan.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingRoute />} />
      <Route
        path="/signin"
        element={
          <GuestOnlyRoute>
            <SignInPage />
          </GuestOnlyRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <GuestOnlyRoute>
            <SignUpPage />
          </GuestOnlyRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <GuestOnlyRoute>
            <ForgotPasswordPage />
          </GuestOnlyRoute>
        }
      />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardHome />} />
        <Route path="/assessment" element={<AssessmentPage />} />
        <Route path="/disease-prediction" element={<DiseasePredictionPage />} />
        <Route path="/navigator" element={<NavigatorPage />} />
        <Route path="/emergency" element={<EmergencyPage />} />
        <Route path="/cost" element={<CostIntelligencePage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/affordability" element={<DashboardFeaturePage title="Treatment Affordability" />} />
        <Route path="/roadmap" element={<DashboardFeaturePage title="Roadmap" />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
