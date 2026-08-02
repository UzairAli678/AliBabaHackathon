import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, ArrowRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import CircularGauge from '../components/CircularGauge';

const questions = [
  {
    id: 'severity',
    title: 'How intense are your current symptoms?',
    subtitle: 'Choose the option that best matches how you feel right now.',
    options: [
      { id: 'none', label: 'No symptoms', score: 0, summary: 'No active symptoms reported.' },
      { id: 'mild', label: 'Mild and manageable', score: 6, summary: 'Mild symptoms are present.' },
      { id: 'moderate', label: 'Noticeable and distracting', score: 14, summary: 'Moderate symptoms are affecting daily comfort.' },
      { id: 'severe', label: 'Severe or worsening', score: 26, summary: 'Symptoms are severe or worsening.' }
    ]
  },
  {
    id: 'breathing',
    title: 'Are you having chest pain or trouble breathing?',
    subtitle: 'These are important red-flag symptoms.',
    options: [
      {
        id: 'no',
        label: 'No',
        score: 0
      },
      {
        id: 'yes',
        label: 'Yes',
        score: 45,
        urgent: true,
        summary: 'Breathing difficulty or chest pain.'
      }
    ]
  },
  {
    id: 'fever',
    title: 'How would you describe your temperature today?',
    subtitle: 'Fever can change how quickly you should seek care.',
    options: [
      { id: 'none', label: 'No fever', score: 0 },
      { id: 'low', label: 'Low-grade fever', score: 6, summary: 'Low-grade fever.' },
      { id: 'moderate', label: 'Fever', score: 12, summary: 'Fever is present.' },
      { id: 'high', label: 'High fever', score: 20, summary: 'High fever.' }
    ]
  },
  {
    id: 'duration',
    title: 'How long have the symptoms been present?',
    subtitle: 'Longer lasting symptoms deserve closer attention.',
    options: [
      { id: 'under-day', label: 'Less than 24 hours', score: 2 },
      { id: 'one-three', label: '1-3 days', score: 5 },
      { id: 'four-seven', label: '4-7 days', score: 9 },
      { id: 'over-week', label: 'More than 1 week', score: 14, summary: 'Symptoms have lasted more than a week.' }
    ]
  },
  {
    id: 'fluids',
    title: 'How well are you keeping fluids down?',
    subtitle: 'Hydration changes the urgency of care.',
    options: [
      { id: 'good', label: 'Well hydrated', score: 0 },
      { id: 'somewhat', label: 'Somewhat limited', score: 4, summary: 'Fluid intake is somewhat limited.' },
      { id: 'poor', label: 'Not keeping up', score: 10, summary: 'Fluid intake is not keeping up.' },
      { id: 'none', label: 'Unable to keep fluids down', score: 18, urgent: true, summary: 'Unable to keep fluids down.' }
    ]
  },
  {
    id: 'dizziness',
    title: 'Do you feel dizzy, faint, or confused?',
    subtitle: 'These symptoms can signal that you should escalate care.',
    options: [
      { id: 'no', label: 'No', score: 0 },
      { id: 'mild', label: 'A little dizzy', score: 5, summary: 'Mild dizziness.' },
      { id: 'recurring', label: 'Recurring dizziness', score: 14, summary: 'Recurring dizziness or lightheadedness.' },
      { id: 'yes', label: 'I fainted or feel confused', score: 28, urgent: true, summary: 'Fainting or confusion.' }
    ]
  },
  {
    id: 'sleep',
    title: 'How restful has your sleep been recently?',
    subtitle: 'Sleep changes can affect recovery and resilience.',
    options: [
      { id: 'good', label: 'Restful', score: 0 },
      { id: 'short', label: 'A bit short', score: 3, summary: 'Sleep has been a bit short.' },
      { id: 'poor', label: 'Poor', score: 7, summary: 'Sleep quality has been poor.' },
      { id: 'disrupted', label: 'Very disrupted', score: 12, summary: 'Sleep has been very disrupted.' }
    ]
  },
  {
    id: 'activity',
    title: 'How much are symptoms affecting your usual activity?',
    subtitle: 'This helps estimate how much care support may be useful.',
    options: [
      { id: 'normal', label: 'No change', score: 0 },
      { id: 'reduced', label: 'I am slowing down', score: 5, summary: 'Activity has been reduced.' },
      { id: 'resting', label: 'Mostly resting', score: 10, summary: 'Mostly resting because of symptoms.' },
      { id: 'unable', label: 'I cannot complete normal activities', score: 16, summary: 'Normal activities are difficult to complete.' }
    ]
  },
  {
    id: 'conditions',
    title: 'Do you have any chronic health conditions?',
    subtitle: 'Ongoing conditions can change the level of follow-up you need.',
    options: [
      { id: 'none', label: 'None', score: 0 },
      { id: 'one', label: 'One well-controlled condition', score: 6, summary: 'One well-controlled chronic condition.' },
      { id: 'some', label: 'One condition is not well controlled', score: 14, summary: 'A condition is not well controlled.' },
      { id: 'multiple', label: 'Multiple or complex conditions', score: 22, summary: 'Multiple or complex chronic conditions.' }
    ]
  }
];

function determineRisk(score) {
  if (score >= 80) {
    return { riskLevel: 'low', tone: 'positive', suggestion: 'Rest and monitor. Stay hydrated and keep an eye on any changes.' };
  }

  if (score >= 50) {
    return { riskLevel: 'medium', tone: 'caution', suggestion: 'Consider consulting a doctor soon, especially if symptoms continue or worsen.' };
  }

  return { riskLevel: 'high', tone: 'critical', suggestion: 'Seek care soon. If symptoms are getting worse, use Emergency Mode right away.' };
}

function calculateAssessment(answers) {
  let score = 100;
  const symptomClues = [];
  let urgent = false;

  questions.forEach((question) => {
    const selectedOption = question.options.find((option) => option.id === answers[question.id]);

    if (!selectedOption) {
      return;
    }

    score -= selectedOption.score;

    if (selectedOption.summary) {
      symptomClues.push(selectedOption.summary);
    }

    if (selectedOption.urgent) {
      urgent = true;
    }
  });

  score = Math.max(0, Math.min(100, score));
  const risk = determineRisk(score);

  return {
    score,
    urgent: urgent || score < 30,
    symptoms: symptomClues.length > 0 ? symptomClues : ['General symptoms and wellness review.'],
    ...risk
  };
}

export default function AssessmentPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [result, setResult] = useState(null);

  const currentQuestion = questions[currentStep];
  const progressPercent = Math.round(((currentStep + 1) / questions.length) * 100);
  const isFinalStep = currentStep === questions.length - 1;

  useEffect(() => {
    setSelectedOptionId(answers[currentQuestion.id] || '');
  }, [answers, currentQuestion.id]);

  const handleOptionSelect = (optionId) => {
    setSelectedOptionId(optionId);
  };

  const handleContinue = () => {
    if (!selectedOptionId) {
      return;
    }

    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: selectedOptionId
    };

    setAnswers(nextAnswers);

    if (isFinalStep) {
      setResult(calculateAssessment(nextAnswers));
      return;
    }

    setCurrentStep((step) => step + 1);
  };

  const handleBack = () => {
    setResult(null);
    setCurrentStep((step) => Math.max(0, step - 1));
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers({});
    setSelectedOptionId('');
    setResult(null);
  };

  const assessmentPayload = useMemo(() => {
    if (!result) {
      return null;
    }

    return {
      score: result.score,
      riskLevel: result.riskLevel,
      urgency: result.urgent ? 'immediate' : result.riskLevel === 'high' ? 'needs attention' : result.riskLevel === 'medium' ? 'needs attention' : 'mild',
      suggestion: result.suggestion,
      symptoms: result.symptoms
    };
  }, [result]);

  if (result && assessmentPayload) {
    const riskColors = {
      low: 'text-positive bg-mintSoft border-green-200',
      medium: 'text-caution bg-amberSoft border-amber-200',
      high: 'text-critical bg-rose-50 border-red-200'
    };

    return (
      <div className="space-y-6">
        <section className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl space-y-4">
              <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${riskColors[result.riskLevel]}`}>
                {result.riskLevel.charAt(0).toUpperCase() + result.riskLevel.slice(1)} risk
              </div>
              <h2 className="text-3xl font-medium tracking-tight text-heading sm:text-4xl">Assessment complete</h2>
              <p className="text-sm leading-7 text-muted">
                Based on your answers, here is a quick summary of your current health risk and the safest next step.
              </p>
              <div className="rounded-3xl bg-slate-50 p-5 text-sm leading-7 text-heading">
                <div className="font-medium text-heading">Suggested next step</div>
                <p className="mt-2 text-muted">{result.suggestion}</p>
              </div>
            </div>

            <div className="flex justify-center">
              <CircularGauge value={result.score} label="Health score" tone={result.tone} />
            </div>
          </div>
        </section>

        {result.urgent ? (
          <section className="rounded-[28px] border border-red-200 bg-rose-50 p-6 shadow-card">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-critical text-white">
                <ExclamationTriangleIcon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-medium tracking-tight text-heading">Emergency attention recommended</h3>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
                  Your answers included red-flag symptoms. If you are in immediate danger or the symptoms are worsening, use Emergency Mode now.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    to="/emergency"
                    className="inline-flex items-center justify-center rounded-full bg-critical px-5 py-3 text-sm font-medium text-white shadow-soft transition hover:opacity-90"
                  >
                    View emergency mode
                  </Link>
                  <button
                    type="button"
                    onClick={() => navigate('/navigator', { state: { assessment: assessmentPayload } })}
                    className="inline-flex items-center justify-center rounded-full border border-border bg-white px-5 py-3 text-sm font-medium text-heading transition hover:bg-slate-50"
                  >
                    View care options
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {result.riskLevel === 'high' && !result.urgent ? (
          <div className="rounded-[28px] border border-red-200 bg-white p-6 shadow-card">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-lg font-medium tracking-tight text-heading">Next care options are available</div>
                <p className="mt-2 text-sm leading-7 text-muted">See the best care path for your current symptoms.</p>
              </div>
              <Link
                to="/navigator"
                state={{ assessment: assessmentPayload }}
                className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-white shadow-soft transition hover:opacity-90"
              >
                View care options
              </Link>
            </div>
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Responses</div>
            <div className="mt-4 space-y-3 text-sm leading-7 text-muted">
              {questions.map((question) => {
                const selectedOption = question.options.find((option) => option.id === answers[question.id]);
                return (
                  <div key={question.id} className="rounded-2xl bg-slate-50 p-4">
                    <div className="font-medium text-heading">{question.title}</div>
                    <div className="mt-1">{selectedOption?.label || 'Not answered'}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Your notes</div>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-muted">
              {result.symptoms.map((symptom) => (
                <li key={symptom} className="rounded-2xl bg-slate-50 p-4 text-heading">
                  {symptom}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={handleRestart}
              className="mt-6 inline-flex items-center justify-center rounded-full border border-border bg-white px-5 py-3 text-sm font-medium text-heading transition hover:bg-slate-50"
            >
              Retake assessment
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <section className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Health Assessment</div>
            <h2 className="mt-2 text-3xl font-medium tracking-tight text-heading">Quick check-in</h2>
            <p className="mt-2 text-sm leading-7 text-muted">
              Answer a few multiple-choice questions to estimate your health score and the safest next step.
            </p>
          </div>
          <div className="text-right text-sm text-muted">
            <div className="font-medium text-heading">Question {currentStep + 1} of {questions.length}</div>
            <div className="mt-1">{progressPercent}% complete</div>
          </div>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="rounded-[24px] bg-slate-50 p-6 sm:p-8">
          <h3 className="text-2xl font-medium tracking-tight text-heading">{currentQuestion.title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">{currentQuestion.subtitle}</p>

          <div className="mt-6 grid gap-3">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOptionId === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleOptionSelect(option.id)}
                  className={`rounded-2xl border px-4 py-4 text-left text-sm font-medium transition ${
                    isSelected
                      ? 'border-primary bg-white text-heading shadow-card'
                      : 'border-border bg-white/70 text-muted hover:border-primary/40 hover:bg-white'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-white px-5 py-3 text-sm font-medium text-heading transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={!selectedOptionId}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-white shadow-soft transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isFinalStep ? 'See results' : 'Continue'}
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
