import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, ArrowRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import CircularGauge from '../components/CircularGauge';
import useCareContext from '../store/useCareContext';

const assessmentQuestions = [
  {
    id: 'symptomIntensity',
    title: 'How intense is your main symptom right now?',
    subtitle: 'Pick the option that best reflects how you feel today.',
    options: [
      { label: 'Mild and easy to ignore', value: 'mild', points: 0 },
      { label: 'Noticeable but manageable', value: 'moderate', points: 1 },
      { label: 'Strong or hard to ignore', value: 'severe', points: 3 }
    ]
  },
  {
    id: 'breathing',
    title: 'Are you having trouble breathing or feeling chest tightness?',
    subtitle: 'Breathing changes can raise the urgency of the check-in.',
    options: [
      { label: 'No', value: 'none', points: 0 },
      { label: 'Only during activity or mild exertion', value: 'light', points: 2 },
      { label: 'Yes, at rest or it feels severe', value: 'severe', points: 5, urgent: true }
    ]
  },
  {
    id: 'fever',
    title: 'Do you have a fever or chills?',
    subtitle: 'Temperature changes help separate routine symptoms from more serious ones.',
    options: [
      { label: 'No fever or chills', value: 'none', points: 0 },
      { label: 'Low-grade fever or mild chills', value: 'low', points: 2 },
      { label: 'High fever or shaking chills', value: 'high', points: 4 }
    ]
  },
  {
    id: 'hydration',
    title: 'Can you keep fluids down?',
    subtitle: 'Dehydration risk matters when nausea or vomiting is involved.',
    options: [
      { label: 'Yes, no problem', value: 'yes', points: 0 },
      { label: 'Some nausea or reduced appetite', value: 'some', points: 2 },
      { label: 'No, vomiting or unable to drink', value: 'no', points: 5, urgent: true }
    ]
  },
  {
    id: 'dizziness',
    title: 'Are you feeling dizzy, faint, or confused?',
    subtitle: 'Lightheadedness can point to a higher-risk situation.',
    options: [
      { label: 'No', value: 'none', points: 0 },
      { label: 'Occasional dizziness', value: 'occasional', points: 2 },
      { label: 'Fainting, confusion, or trouble staying alert', value: 'severe', points: 5, urgent: true }
    ]
  },
  {
    id: 'duration',
    title: 'How long have the symptoms been going on?',
    subtitle: 'Longer lasting symptoms deserve closer attention.',
    options: [
      { label: 'Less than a day', value: 'short', points: 0 },
      { label: '1 to 3 days', value: 'medium', points: 1 },
      { label: 'More than 3 days', value: 'long', points: 3 }
    ]
  },
  {
    id: 'trend',
    title: 'Are your symptoms improving or getting worse?',
    subtitle: 'A worsening trend raises the level of concern.',
    options: [
      { label: 'Improving', value: 'improving', points: 0 },
      { label: 'About the same', value: 'stable', points: 1 },
      { label: 'Getting worse', value: 'worsening', points: 3 }
    ]
  },
  {
    id: 'dailyActivity',
    title: 'How much are your daily activities affected?',
    subtitle: 'We use this to estimate how disruptive the symptoms are.',
    options: [
      { label: 'Barely affected', value: 'light', points: 0 },
      { label: 'Some tasks are harder', value: 'moderate', points: 1 },
      { label: 'Most tasks are difficult', value: 'heavy', points: 3 }
    ]
  },
  {
    id: 'skinChanges',
    title: 'Do you have rash, swelling, or unusual skin changes?',
    subtitle: 'Skin changes can help separate minor issues from higher-risk ones.',
    options: [
      { label: 'No', value: 'none', points: 0 },
      { label: 'Mild or localized changes', value: 'mild', points: 1 },
      { label: 'Widespread rash or swelling', value: 'severe', points: 4, urgent: true }
    ]
  }
];

function deriveSeverity(totalScore, hasUrgentFlag) {
  if (hasUrgentFlag || totalScore >= 80) {
    return {
      severity: 'urgent',
      tone: 'critical',
      urgent: true,
      suggestion: 'Use Emergency Mode or seek urgent medical care now, especially if the symptoms are worsening.'
    };
  }

  if (totalScore >= 60) {
    return {
      severity: 'high',
      tone: 'critical',
      urgent: false,
      suggestion: 'Seek medical care soon. If symptoms escalate, move to Emergency Mode.'
    };
  }

  if (totalScore >= 35) {
    return {
      severity: 'moderate',
      tone: 'caution',
      urgent: false,
      suggestion: 'Consider booking a clinician visit soon and keep monitoring your symptoms.'
    };
  }

  return {
    severity: 'mild',
    tone: 'positive',
    urgent: false,
    suggestion: 'Rest, hydrate, and monitor for changes. Book follow-up care if symptoms linger.'
  };
}

function buildAssessmentResult(answers) {
  const answerEntries = assessmentQuestions.map((question) => {
    const selectedOption = question.options.find((option) => option.value === answers[question.id]) || question.options[0];
    return {
      question: question.title,
      answer: selectedOption.label,
      urgent: Boolean(selectedOption.urgent),
      points: selectedOption.points
    };
  });

  const maxPoints = assessmentQuestions.reduce((sum, question) => {
    return sum + Math.max(...question.options.map((option) => option.points));
  }, 0);
  const totalPoints = answerEntries.reduce((sum, entry) => sum + entry.points, 0);
  const score = Math.round((totalPoints / maxPoints) * 100);
  const urgentFlag = answerEntries.some((entry) => entry.urgent);
  const severityResult = deriveSeverity(score, urgentFlag);

  return {
    score,
    ...severityResult,
    answers: answerEntries,
    completedAt: new Date().toISOString()
  };
}

export default function AssessmentPage() {
  const navigate = useNavigate();
  const setLatestCareContext = useCareContext((state) => state.setLatestCareContext);
  const savedAssessmentSession = useCareContext((state) => state.healthAssessmentSession);
  const setHealthAssessmentSession = useCareContext((state) => state.setHealthAssessmentSession);
  const clearHealthAssessmentSession = useCareContext((state) => state.clearHealthAssessmentSession);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState(() => savedAssessmentSession?.answers || {});
  const [result, setResult] = useState(() => savedAssessmentSession?.result || null);

  useEffect(() => {
    setHealthAssessmentSession({ answers, result });
  }, [answers, result, setHealthAssessmentSession]);

  const totalSteps = assessmentQuestions.length;
  const currentQuestion = assessmentQuestions[currentStep];
  const selectedValue = answers[currentQuestion.id] || '';
  // Progress represents questions the user has completed, not the question
  // currently being displayed. The first question therefore starts at 0%.
  const progressPercent = Math.round((currentStep / totalSteps) * 100);
  const isFinalStep = currentStep === totalSteps - 1;

  const selectedAnswer = useMemo(() => {
    return currentQuestion.options.find((option) => option.value === selectedValue) || null;
  }, [currentQuestion, selectedValue]);

  const assessmentPayload = useMemo(() => {
    if (!result) {
      return null;
    }

    return {
      score: result.score,
      riskLevel: result.severity,
      urgency: result.urgent ? 'immediate' : result.severity === 'high' ? 'needs attention' : result.severity === 'moderate' ? 'needs attention' : 'mild',
      suggestion: result.suggestion,
      symptoms: result.answers.map((entry) => `${entry.question}: ${entry.answer}`),
      topDisease: 'Quick check-in summary'
    };
  }, [result]);

  const saveAssessmentContext = () => {
    if (!assessmentPayload) return;
    setLatestCareContext({ disease: assessmentPayload.topDisease, specialist: 'General Physician', riskLevel: assessmentPayload.riskLevel, confidence: assessmentPayload.score, symptoms: assessmentPayload.symptoms, source: 'Health Assessment' });
  };

  const handleOptionSelect = (option) => {
    setAnswers((current) => ({
      ...current,
      [currentQuestion.id]: option.value
    }));
  };

  const handleContinue = () => {
    if (!selectedAnswer) {
      return;
    }

    if (isFinalStep) {
      setResult(buildAssessmentResult(answers));
      return;
    }

    setCurrentStep((step) => step + 1);
  };

  const handleBack = () => {
    setCurrentStep((step) => Math.max(0, step - 1));
  };

  const handleRestart = () => {
    clearHealthAssessmentSession();
    setCurrentStep(0);
    setAnswers({});
    setResult(null);
  };

  if (result && assessmentPayload) {
    const riskColors = {
      mild: 'text-positive bg-mintSoft border-green-200',
      moderate: 'text-caution bg-amberSoft border-amber-200',
      high: 'text-critical bg-rose-50 border-red-200',
      urgent: 'text-critical bg-rose-50 border-red-200'
    };

    return (
      <div className="space-y-6">
        <section className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl space-y-4">
              <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${riskColors[result.severity]}`}>
                {result.severity.charAt(0).toUpperCase() + result.severity.slice(1)} severity
              </div>
              <h2 className="text-3xl font-medium tracking-tight text-heading sm:text-4xl">Assessment complete</h2>
              <p className="text-sm leading-7 text-muted">
                Based on your answers, here is a quick summary of your current risk level and the safest next step.
              </p>
              <div className="rounded-3xl bg-slate-50 p-5 text-sm leading-7 text-heading">
                <div className="font-medium text-heading">Suggested next step</div>
                <p className="mt-2 text-muted">{result.suggestion}</p>
              </div>
            </div>

            <div className="flex justify-center">
              <CircularGauge value={result.score} label="Risk score" tone={result.tone} />
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
                    onClick={() => { saveAssessmentContext(); navigate('/navigator', { state: { assessment: assessmentPayload } }); }}
                    className="inline-flex items-center justify-center rounded-full border border-border bg-white px-5 py-3 text-sm font-medium text-heading transition hover:bg-slate-50"
                  >
                    View care options
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {result.severity === 'high' && !result.urgent ? (
          <section className="rounded-[28px] border border-red-200 bg-white p-6 shadow-card">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-lg font-medium tracking-tight text-heading">Next care options are available</div>
                <p className="mt-2 text-sm leading-7 text-muted">See the best care path for your current symptoms.</p>
              </div>
              <Link
                to="/navigator"
                state={{ assessment: assessmentPayload }}
                onClick={saveAssessmentContext}
                className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-white shadow-soft transition hover:opacity-90"
              >
                View care options
              </Link>
            </div>
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Responses</div>
            <div className="mt-4 space-y-3 text-sm leading-7 text-muted">
              {result.answers.map((entry) => (
                <div key={entry.question} className="rounded-2xl bg-slate-50 p-4">
                  <div className="font-medium text-heading">{entry.question}</div>
                  <div className="mt-1">{entry.answer}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Your notes</div>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-muted">
              {result.answers.map((entry) => (
                <li key={entry.question} className="rounded-2xl bg-slate-50 p-4 text-heading">
                  {entry.answer}
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
              Answer 9 short questions to get a risk score, severity level, and suggested next step.
            </p>
          </div>
          <div className="text-right text-sm text-muted">
            <div className="font-medium text-heading">Question {currentStep + 1} of {totalSteps}</div>
            <div className="mt-1">{progressPercent}% complete</div>
          </div>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="rounded-[24px] bg-slate-50 p-6 sm:p-8">
          <h3 className="text-2xl font-medium tracking-tight text-heading">{currentQuestion.title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">{currentQuestion.subtitle}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-1 lg:grid-cols-1">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedAnswer?.value === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleOptionSelect(option)}
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

          <div className="mt-5 rounded-2xl bg-white px-4 py-3 text-sm text-muted">
            Selected answer:{' '}
            <span className="font-medium text-heading">{selectedAnswer ? selectedAnswer.label : 'none yet'}</span>
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
            disabled={!selectedAnswer}
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
