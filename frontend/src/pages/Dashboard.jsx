import { Link } from 'react-router-dom';
import {
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  BeakerIcon,
  HeartIcon,
  ShieldCheckIcon,
  SparklesIcon,
  WalletIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import dashboardBanner from '../assets/illustrations/dashboard.jpeg';

const featureCards = [
  {
    title: 'Health Assessment',
    description: 'Capture symptoms and get structured next-step guidance.',
    to: '/assessment',
    icon: HeartIcon,
    tint: 'bg-teal-50'
  },
  {
    title: 'Disease Prediction',
    description: 'Search symptoms and see likely conditions from the AI model.',
    to: '/disease-prediction',
    icon: BeakerIcon,
    tint: 'bg-violet-50'
  },
  {
    title: 'Smart Care Navigator',
    description: 'Find the right care path with calm AI guidance.',
    to: '/navigator',
    icon: SparklesIcon,
    tint: 'bg-sky-50'
  },
  {
    title: 'Cost Intelligence',
    description: 'See transparent estimates before you commit to care.',
    to: '/cost',
    icon: WalletIcon,
    tint: 'bg-amber-50'
  },
  {
    title: 'Appointments',
    description: 'Keep your visits organized in one place.',
    to: '/appointments',
    icon: CalendarDaysIcon,
    tint: 'bg-slate-50'
  },
  {
    title: 'AI Chat',
    description: 'Ask follow-up questions and get quick support.',
    to: '/chat',
    icon: ChatBubbleLeftRightIcon,
    tint: 'bg-cyan-50'
  }
];

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardHome() {
  const { user } = useAuth();
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there';

  return (
    <div className="space-y-8">
      <section className="grid overflow-hidden rounded-[32px] border border-border bg-white shadow-soft lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-11">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-tealSoft px-4 py-2 text-sm font-medium text-primary">
              <BellAlertIcon className="h-4 w-4" />
              Your health, all in one place
            </div>
            <h2 className="mt-6 text-4xl font-medium tracking-[-0.035em] text-heading sm:text-5xl">
              {getGreeting()}, {name}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted sm:text-base">
              A calmer way to understand your health, plan care, and stay connected with the support your family needs.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/assessment"
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-white shadow-soft transition hover:-translate-y-0.5 hover:opacity-90"
              >
                Start assessment
              </Link>
              <Link to="/appointments" className="inline-flex items-center justify-center rounded-full border border-border bg-white px-6 py-3 text-sm font-medium text-heading transition hover:border-primary/40 hover:bg-slate-50">
                Book appointment
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-5 text-xs font-medium text-muted">
              <span className="inline-flex items-center gap-2"><ShieldCheckIcon className="h-4 w-4 text-primary" /> Private & secure</span>
              <span className="inline-flex items-center gap-2"><SparklesIcon className="h-4 w-4 text-primary" /> AI-powered guidance</span>
            </div>
        </div>
        <div className="relative min-h-[300px] overflow-hidden lg:min-h-[460px]">
          <img src={dashboardBanner} alt="Doctor caring for a child with his parent" className="absolute inset-0 h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent lg:bg-gradient-to-r lg:from-white/20 lg:to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/30 bg-white/85 p-4 shadow-xl backdrop-blur-md sm:left-auto sm:w-64">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-primary"><HeartIcon className="h-5 w-5" /></div>
              <div><div className="text-sm font-semibold text-heading">Care that connects</div><div className="mt-0.5 text-xs text-muted">For you and your family</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {featureCards.map(({ title, description, to, icon: Icon, tint }) => (
          <Link
            key={title}
            to={to}
            className="rounded-2xl border border-border bg-white p-5 shadow-card transition-transform duration-200 hover:-translate-y-1"
          >
            <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${tint}`}>
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-medium tracking-tight text-heading">{title}</h3>
            <p className="mt-2 text-sm leading-7 text-muted">{description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
