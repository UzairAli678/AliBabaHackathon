import { Link } from 'react-router-dom';
import {
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  ChartBarSquareIcon,
  HeartIcon,
  ShieldCheckIcon,
  SparklesIcon,
  WalletIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

const featureCards = [
  {
    title: 'Health Assessment',
    description: 'Capture symptoms and get structured next-step guidance.',
    to: '/assessment',
    icon: HeartIcon,
    tint: 'bg-teal-50'
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
    title: 'Treatment Affordability',
    description: 'Track affordability and make care plans easier to manage.',
    to: '/affordability',
    icon: ShieldCheckIcon,
    tint: 'bg-emerald-50'
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
  },
  {
    title: 'Health Roadmap',
    description: 'Follow your care plan and milestones over time.',
    to: '/roadmap',
    icon: ChartBarSquareIcon,
    tint: 'bg-indigo-50'
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
      <section className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-tealSoft px-4 py-2 text-sm font-medium text-primary">
              <BellAlertIcon className="h-4 w-4" />
              Emergency support is always visible in the sidebar
            </div>
            <h2 className="mt-5 text-3xl font-medium tracking-tight text-heading sm:text-4xl">
              {getGreeting()}, {name}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
              Welcome to your secure CareLedger AI dashboard. Use the tools below to manage care, planning, and support in one place.
            </p>
          </div>
          <Link
            to="/assessment"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-white shadow-soft transition hover:opacity-90"
          >
            Start assessment
          </Link>
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
