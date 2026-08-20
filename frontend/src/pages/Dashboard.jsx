import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  BeakerIcon,
  HeartIcon,
  ShieldCheckIcon,
  SparklesIcon,
  WalletIcon,
  BellAlertIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import LogoMark from '../components/LogoMark';
import { listChatSessions } from '../api/chatHistory';
import useCareContext from '../store/useCareContext';
import dashboardBanner from '../assets/illustrations/dashboard.jpeg';
import dashboardVideo from '../assets/illustrations/Dashboard video.mp4';
import healthAssessmentImage from '../assets/illustrations/Health assessment selected.jpg.jpeg';
import diseasePredictionImage from '../assets/illustrations/Disease prediction selected.png';
import careNavigatorImage from '../assets/illustrations/care navigator selected.png';
import costIntelligenceImage from '../assets/illustrations/cost intelligence selected.png';
import treatmentAffordabilityImage from '../assets/illustrations/Treatment affordability selected.jpg.jpeg';
import appointmentsImage from '../assets/illustrations/Appointments selected.jpg.jpeg';
import aiChatImage from '../assets/illustrations/Ai chat selected.png';
import healthRoadmapImage from '../assets/illustrations/Health roadmap selected.jpg.jpeg';

const featureCards = [
  {
    title: 'Health Assessment',
    description: 'Capture symptoms and get structured next-step guidance.',
    details: 'Answer a focused set of health questions to receive a clear risk score and severity summary. Your latest result stays available as you move through the app.',
    to: '/assessment',
    icon: HeartIcon,
    tint: 'bg-teal-50',
    image: healthAssessmentImage
  },
  {
    title: 'Disease Prediction',
    description: 'Search symptoms and see likely conditions from the AI model.',
    details: 'Select the symptoms that best match how you feel and review ranked possibilities with confidence information. Use the result to make your next care decision more informed.',
    to: '/disease-prediction',
    icon: BeakerIcon,
    tint: 'bg-violet-50',
    image: diseasePredictionImage
  },
  {
    title: 'Smart Care Navigator',
    description: 'Find the right care path with calm AI guidance.',
    details: 'Turn your assessment or prediction into practical recommendations for specialists and providers. It helps you understand where to go and what to do next.',
    to: '/navigator',
    icon: SparklesIcon,
    tint: 'bg-sky-50',
    image: careNavigatorImage
  },
  {
    title: 'Cost Intelligence',
    description: 'See transparent estimates before you commit to care.',
    details: 'Compare expected treatment and consultation costs across care options. Clear estimates help you plan ahead and avoid unnecessary financial surprises.',
    to: '/cost',
    icon: WalletIcon,
    tint: 'bg-amber-50',
    image: costIntelligenceImage
  },
  {
    title: 'Treatment Affordability',
    description: 'Track affordability and make care plans easier to manage.',
    details: 'Understand how a recommended care plan fits your available budget. Personalized guidance highlights practical ways to make treatment more manageable.',
    to: '/affordability',
    icon: ShieldCheckIcon,
    tint: 'bg-emerald-50',
    image: treatmentAffordabilityImage
  },
  {
    title: 'Appointments',
    description: 'Keep your visits organized in one place.',
    details: 'Choose a provider, date, and time without leaving your care journey. Upcoming bookings remain easy to review whenever you return.',
    to: '/appointments',
    icon: CalendarDaysIcon,
    tint: 'bg-slate-50',
    image: appointmentsImage
  },
  {
    title: 'AI Chat',
    description: 'Ask follow-up questions and get quick support.',
    details: 'Discuss general health questions in a calm, conversational space backed by saved chat history. Safety prompts help surface situations that may need urgent attention.',
    to: '/chat',
    icon: ChatBubbleLeftRightIcon,
    tint: 'bg-cyan-50',
    image: aiChatImage
  },
  {
    title: 'Health Roadmap',
    description: 'Follow your care plan and milestones over time.',
    details: 'Keep important next steps and longer-term health goals visible in one place. A structured roadmap makes ongoing care easier to understand and follow.',
    to: '/roadmap',
    icon: SparklesIcon,
    tint: 'bg-sky-50',
    image: healthRoadmapImage
  }
];

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatActivityDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-PK', { day: 'numeric', month: 'short' }).format(date);
}

export default function DashboardHome() {
  const { user } = useAuth();
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there';
  const healthAssessment = useCareContext((state) => state.healthAssessmentSession?.result);
  const diseasePrediction = useCareContext((state) => state.diseasePredictionSession?.result);
  const lastBookedAppointment = useCareContext((state) => state.lastBookedAppointment);
  const [latestChat, setLatestChat] = useState(null);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!user?.id) {
      setActivityLoading(false);
      return undefined;
    }

    listChatSessions(user.id)
      .then((sessions) => { if (active) setLatestChat(sessions[0] || null); })
      .catch(() => { if (active) setLatestChat(null); })
      .finally(() => { if (active) setActivityLoading(false); });

    return () => { active = false; };
  }, [user?.id]);

  const recentActivities = useMemo(() => {
    const activities = [];

    if (healthAssessment) {
      const severity = healthAssessment.severity
        ? `${healthAssessment.severity.charAt(0).toUpperCase()}${healthAssessment.severity.slice(1)} risk`
        : `${healthAssessment.score}% risk score`;
      activities.push({
        id: 'assessment',
        title: 'Health Assessment',
        summary: `${severity}${healthAssessment.completedAt ? `, completed ${formatActivityDate(healthAssessment.completedAt)}` : ''}`,
        to: '/assessment',
        icon: HeartIcon,
        timestamp: healthAssessment.completedAt || ''
      });
    }

    const topPrediction = diseasePrediction?.predictions?.[0];
    if (topPrediction) {
      activities.push({
        id: 'prediction',
        title: 'Disease Prediction',
        summary: `${topPrediction.disease} · ${topPrediction.confidence}% confidence${diseasePrediction.completedAt ? `, ${formatActivityDate(diseasePrediction.completedAt)}` : ''}`,
        to: '/disease-prediction',
        icon: BeakerIcon,
        timestamp: diseasePrediction.completedAt || ''
      });
    }

    if (latestChat) {
      activities.push({
        id: 'chat',
        title: 'AI Chat',
        summary: `${latestChat.title} · updated ${formatActivityDate(latestChat.updated_at)}`,
        to: '/chat',
        icon: ChatBubbleLeftRightIcon,
        timestamp: latestChat.updated_at || ''
      });
    }

    if (lastBookedAppointment) {
      activities.push({
        id: 'appointment',
        title: 'Appointment booked',
        summary: `${lastBookedAppointment.doctor_name}, ${formatActivityDate(`${lastBookedAppointment.appointment_date}T00:00:00`)} at ${lastBookedAppointment.time_slot}`,
        to: '/appointments',
        icon: CalendarDaysIcon,
        timestamp: lastBookedAppointment.bookedAt || lastBookedAppointment.appointment_date || ''
      });
    }

    return activities.sort((left, right) => new Date(right.timestamp || 0) - new Date(left.timestamp || 0));
  }, [diseasePrediction, healthAssessment, lastBookedAppointment, latestChat]);

  return (
    <div className="space-y-8">
      <section className="relative isolate min-h-[520px] overflow-hidden rounded-[32px] border border-border bg-heading shadow-soft">
        <video
          className="absolute inset-0 h-full w-full object-cover object-center"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={dashboardBanner}
          aria-hidden="true"
        >
          <source src={dashboardVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/65 to-slate-950/20" />
        <div className="relative flex min-h-[520px] max-w-3xl flex-col justify-center p-6 sm:p-10 lg:p-14">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-md">
              <BellAlertIcon className="h-4 w-4" />
              Your health, all in one place
            </div>
            <h2 className="mt-6 text-4xl font-medium tracking-[-0.035em] text-white sm:text-5xl">
              {getGreeting()}, {name}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/80 sm:text-base">
              A calmer way to understand your health, plan care, and stay connected with the support your family needs.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/assessment"
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-white shadow-soft transition hover:-translate-y-0.5 hover:opacity-90"
              >
                Start assessment
              </Link>
              <Link to="/appointments" className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/15 px-6 py-3 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/25">
                Book appointment
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-5 text-xs font-medium text-white/75">
              <span className="inline-flex items-center gap-2"><ShieldCheckIcon className="h-4 w-4 text-teal-300" /> Private & secure</span>
              <span className="inline-flex items-center gap-2"><SparklesIcon className="h-4 w-4 text-teal-300" /> AI-powered guidance</span>
            </div>
        </div>
        <div className="absolute bottom-5 right-5 hidden rounded-2xl border border-white/30 bg-white/85 p-4 shadow-xl backdrop-blur-md sm:block sm:w-64">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-primary"><HeartIcon className="h-5 w-5" /></div>
              <div><div className="text-sm font-semibold text-heading">Care that connects</div><div className="mt-0.5 text-xs text-muted">For you and your family</div></div>
            </div>
        </div>
      </section>

      <section className="grid gap-x-8 gap-y-10 md:grid-cols-2">
        {featureCards.map(({ title, description, details, to, icon: Icon, tint, image }) => (
          <Link
            key={title}
            to={to}
            className="group flex overflow-hidden rounded-2xl border border-border bg-white shadow-card transition-transform duration-200 hover:-translate-y-1 hover:shadow-soft"
          >
            <article className="flex w-full flex-col">
              <div className="aspect-video overflow-hidden border-b border-border bg-slate-100">
                <img src={image} alt="" loading="lazy" className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.025]" />
              </div>
              <div className="flex flex-1 flex-col bg-white p-6 sm:p-7">
              <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${tint} ring-1 ring-primary/10`}>
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 text-xl font-medium tracking-tight text-heading">{title}</h3>
              <p className="mt-2 text-sm font-medium leading-7 text-heading/80">{description}</p>
              <p className="mt-3 text-sm leading-7 text-muted">{details}</p>
              </div>
            </article>
          </Link>
        ))}
      </section>

      <section className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
        <div>
          <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Your care journey</div>
          <h2 className="mt-2 text-3xl font-medium tracking-tight text-heading">Recent Activity</h2>
        </div>

        {activityLoading ? (
          <div className="mt-6 rounded-2xl bg-slate-50 px-5 py-6 text-sm text-muted">Loading your recent activity...</div>
        ) : recentActivities.length ? (
          <div className="mt-6 divide-y divide-border overflow-hidden rounded-2xl border border-border">
            {recentActivities.map(({ id, title, summary, to, icon: ActivityIcon }) => (
              <div key={id} className="flex flex-col gap-4 bg-white p-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:p-5">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-primary">
                    <ActivityIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-heading">{title}</div>
                    <div className="mt-1 text-sm leading-6 text-muted">{summary}</div>
                  </div>
                </div>
                <Link to={to} className="inline-flex items-center gap-2 self-start text-sm font-semibold text-primary hover:underline sm:self-auto">
                  View <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-slate-50 p-6 sm:p-8">
            <p className="text-sm leading-7 text-muted">Your recent activity will show up here once you start using CareLedger AI</p>
            <Link to="/assessment" className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-white shadow-soft transition hover:opacity-90">
              Start Health Assessment <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      <footer className="border-t border-border px-1 pb-6 pt-10 sm:pb-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-3">
            <LogoMark className="h-10 w-auto" />
            <div>
              <div className="font-medium text-heading">CareLedger AI</div>
              <div className="mt-1 text-sm text-muted">Hospital-grade guidance, simplified</div>
            </div>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-muted" aria-label="Footer navigation">
            <a href="#about" className="transition hover:text-primary">About</a>
            <a href="#privacy" className="transition hover:text-primary">Privacy</a>
            <a href="mailto:support@careledger.ai" className="transition hover:text-primary">Contact / Support</a>
          </nav>
        </div>
        <p className="mt-8 max-w-4xl text-xs leading-6 text-muted">
          CareLedger AI provides AI-assisted guidance and is not a substitute for professional medical advice. In an emergency, contact Rescue 1122 immediately.
        </p>
      </footer>
    </div>
  );
}
