import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowTopRightOnSquareIcon, MapPinIcon, StarIcon } from '@heroicons/react/24/outline';
import TextField from '../components/TextField';

const symptomPresets = [
  'fever',
  'throat pain',
  'ear pain',
  'sinus pressure',
  'stomach pain',
  'nausea',
  'rash',
  'breathing trouble',
  'dizziness',
  'chest pain',
  'joint pain'
]

const nearbyOptions = [
  { name: 'Northside General Clinic', distance: '1.2 mi', rating: 4.8, cost: '$85-$120' },
  { name: 'Harbor Urgent Care', distance: '2.0 mi', rating: 4.6, cost: '$110-$160' },
  { name: 'Cedar Family Medicine', distance: '3.4 mi', rating: 4.9, cost: '$95-$140' },
  { name: 'City Specialty Center', distance: '4.1 mi', rating: 4.7, cost: '$140-$220' }
];

function inferUrgency(sourceText) {
  const lowerText = sourceText.toLowerCase();

  if (lowerText.includes('breathing') || lowerText.includes('chest pain') || lowerText.includes('faint') || lowerText.includes('confused')) {
    return 'immediate';
  }

  if (lowerText.includes('high fever') || lowerText.includes('unable to keep fluids down') || lowerText.includes('severe')) {
    return 'immediate';
  }

  if (lowerText.includes('fever') || lowerText.includes('pain') || lowerText.includes('dizziness') || lowerText.includes('rash')) {
    return 'needs attention';
  }

  return 'mild';
}

function inferSpecialist(sourceText) {
  const lowerText = sourceText.toLowerCase();

  if (lowerText.includes('ear') || lowerText.includes('throat') || lowerText.includes('sinus') || lowerText.includes('voice')) {
    return 'ENT Specialist';
  }

  if (lowerText.includes('stomach') || lowerText.includes('nausea') || lowerText.includes('vomiting') || lowerText.includes('diarrhea')) {
    return 'General Physician';
  }

  if (lowerText.includes('rash') || lowerText.includes('itch') || lowerText.includes('skin')) {
    return 'Dermatologist';
  }

  if (lowerText.includes('joint') || lowerText.includes('back') || lowerText.includes('muscle')) {
    return 'Orthopedic Specialist';
  }

  if (lowerText.includes('breathing') || lowerText.includes('chest') || lowerText.includes('cough')) {
    return 'General Physician';
  }

  return 'General Physician';
}

function buildGuidance(urgency) {
  if (urgency === 'immediate') {
    return 'Get in front of a clinician as soon as possible. If symptoms are severe or worsening, seek emergency care first.';
  }

  if (urgency === 'needs attention') {
    return 'Book a visit soon and keep monitoring your symptoms. If anything gets worse, move to emergency care.';
  }

  return 'This looks suitable for routine care. Monitor at home, stay hydrated, and book follow-up if symptoms linger.';
}

export default function NavigatorPage() {
  const location = useLocation();
  const assessment = location.state?.assessment || null;
  const [symptomText, setSymptomText] = useState(assessment?.symptoms?.join(', ') || '');
  const [selectedPreset, setSelectedPreset] = useState('');

  const sourceText = useMemo(() => {
    const parts = [selectedPreset, symptomText].filter(Boolean);
    return parts.join(' ').trim();
  }, [assessment?.symptoms, selectedPreset, symptomText]);

  const urgency = assessment?.urgency || inferUrgency(sourceText);
  const specialist = assessment?.suggestedSpecialist || inferSpecialist(sourceText);
  const guidance = buildGuidance(urgency);

  const summaryText = assessment
    ? `Based on your assessment, your risk level is ${assessment.riskLevel} and the current urgency is ${assessment.urgency}.`
    : 'Enter symptoms directly to get a suggested care path and nearby options.';

  const searchContext = sourceText || 'general symptoms';

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Smart Care Navigator</div>
            <h2 className="mt-2 text-3xl font-medium tracking-tight text-heading sm:text-4xl">Find the right care path</h2>
            <p className="mt-3 text-sm leading-7 text-muted">{summaryText}</p>
          </div>
          {assessment ? (
            <div className="rounded-3xl bg-slate-50 px-5 py-4 text-sm leading-7 text-heading">
              <div className="font-medium text-heading">Assessment summary</div>
              <p className="mt-1 text-muted">Score {assessment.score} with {assessment.riskLevel} risk.</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Symptoms</div>
            <h3 className="mt-2 text-2xl font-medium tracking-tight text-heading">Enter or select symptoms</h3>
            <p className="mt-2 text-sm leading-7 text-muted">
              Use one or more words. You can also start from the assessment result and refine the details here.
            </p>

            <div className="mt-5">
              <TextField
                label="Symptoms"
                placeholder="e.g. sore throat, fever, cough"
                value={symptomText}
                onChange={(event) => setSymptomText(event.target.value)}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {symptomPresets.map((preset) => {
                const isActive = selectedPreset === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSelectedPreset((current) => (current === preset ? '' : preset))}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      isActive ? 'border-primary bg-primary text-white' : 'border-border bg-white text-muted hover:border-primary hover:text-heading'
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {nearbyOptions.map((option) => (
              <article key={option.name} className="rounded-[24px] border border-border bg-white p-5 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-medium tracking-tight text-heading">{option.name}</h4>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted">
                      <MapPinIcon className="h-4 w-4" />
                      {option.distance}
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-caution">
                    <StarIcon className="h-4 w-4" />
                    {option.rating}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted">Estimated cost</div>
                    <div className="mt-1 font-medium text-heading">{option.cost}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted">Care type</div>
                    <div className="mt-1 font-medium text-heading">{specialist}</div>
                  </div>
                </div>
                <a
                  href="/"
                  onClick={(event) => event.preventDefault()}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  View location details
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </a>
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Recommended care</div>
            <h3 className="mt-2 text-2xl font-medium tracking-tight text-heading">{specialist}</h3>
            <div className="mt-4 inline-flex rounded-full border border-border bg-slate-50 px-4 py-2 text-sm font-medium text-heading">
              Urgency: {urgency}
            </div>
            <p className="mt-4 text-sm leading-7 text-muted">{guidance}</p>
          </section>

          <section className="rounded-[28px] border border-border bg-slate-50 p-6 shadow-card">
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">What to do next</div>
            <p className="mt-3 text-sm leading-7 text-heading">
              Search context: <span className="font-medium">{searchContext}</span>
            </p>
            <p className="mt-3 text-sm leading-7 text-muted">
              Use the suggested care type to compare nearby options, or move to Emergency Mode if the symptoms are immediate.
            </p>
          </section>
        </aside>
      </section>
    </div>
  );
}
