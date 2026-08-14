import { Link } from 'react-router-dom';
import { PhoneIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const firstAidGuides = [
  {
    title: 'Burns',
    steps: [
      'Cool the burn under cool running water for 20 minutes.',
      'Remove tight items before swelling starts, if they are not stuck to the skin.',
      'Cover with a clean, non-fluffy dressing. Do not use ice, butter, or ointments.'
    ]
  },
  {
    title: 'Cuts',
    steps: [
      'Apply direct pressure with a clean cloth or bandage.',
      'Raise the area if possible and keep pressure steady until bleeding slows.',
      'Seek urgent care if bleeding is heavy, deep, or will not stop.'
    ]
  },
  {
    title: 'Fainting',
    steps: [
      'Lay the person flat and raise their legs if it is safe to do so.',
      'Loosen tight clothing and check breathing.',
      'If they do not wake quickly or injure themselves, call emergency services.'
    ]
  },
  {
    title: 'Breathing difficulty',
    steps: [
      'Sit the person upright and keep them as calm as possible.',
      'Loosen tight clothing and follow any prescribed rescue medication plan.',
      'Call emergency services immediately if breathing is severe, noisy, or worsening.'
    ]
  },
  {
    title: 'Choking',
    steps: [
      'If they can cough or speak, encourage coughing.',
      'If the airway is blocked, call emergency services and use back blows/abdominal thrusts if trained.',
      'If they become unresponsive, start CPR if you are trained and follow dispatcher instructions.'
    ]
  }
];

export default function EmergencyPage() {
  return (
    <div className="space-y-6 bg-white text-heading">
      <section className="rounded-[28px] border border-red-200 bg-rose-50 p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-critical px-4 py-2 text-sm font-medium text-white">
              <ExclamationTriangleIcon className="h-4 w-4" />
              Emergency Mode
            </div>
            <h2 className="mt-4 text-4xl font-medium tracking-tight text-heading sm:text-5xl">Act now if this is urgent</h2>
            <p className="mt-4 text-sm leading-7 text-muted">
              Keep reading to the minimum needed. If someone is in immediate danger, call emergency services first.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <a
              href="tel:1122"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-critical px-6 py-4 text-base font-medium text-white shadow-soft transition hover:opacity-90"
            >
              <PhoneIcon className="h-5 w-5" />
              Call Rescue 1122
            </a>
            <div className="rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-critical">
              This is not a substitute for professional emergency care. Call emergency services immediately for serious situations.
            </div>
            <p className="text-center text-xs leading-5 text-muted">Emergency numbers shown are for Pakistan.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {firstAidGuides.map((guide) => (
          <details key={guide.title} className="group rounded-[24px] border border-border bg-white p-5 shadow-card">
            <summary className="cursor-pointer list-none text-lg font-medium tracking-tight text-heading">
              <span className="flex items-center justify-between gap-3">
                {guide.title}
                <span className="text-sm font-medium text-critical group-open:hidden">Tap for steps</span>
              </span>
            </summary>
            <ol className="mt-4 space-y-3 text-sm leading-7 text-muted">
              {guide.steps.map((step, index) => (
                <li key={step} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <span className="font-medium text-heading">{index + 1}.</span> {step}
                </li>
              ))}
            </ol>
          </details>
        ))}
      </section>

      <section className="rounded-[28px] border border-red-200 bg-white p-6 shadow-card sm:p-8">
        <div className="text-sm font-medium uppercase tracking-[0.2em] text-critical">Important</div>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          If the situation involves chest pain, severe bleeding, trouble breathing, loss of consciousness, or a rapidly worsening condition, call emergency services immediately and follow the dispatcher’s instructions.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="tel:1122"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-critical px-5 py-3 text-sm font-medium text-white shadow-soft transition hover:opacity-90"
          >
            <PhoneIcon className="h-4 w-4" />
            Call Rescue 1122
          </a>
          <Link
            to="/navigator"
            className="inline-flex items-center justify-center rounded-full border border-border bg-white px-5 py-3 text-sm font-medium text-heading transition hover:bg-slate-50"
          >
            Open care navigator
          </Link>
        </div>
      </section>
    </div>
  );
}
