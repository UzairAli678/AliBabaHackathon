import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRightIcon, SparklesIcon, CurrencyDollarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import CircularGauge from '../components/CircularGauge';
import { API_BASE_URL as backendBaseUrl } from '../lib/api';
import useCareContext from '../store/useCareContext';

const treatmentOptions = [
  'Consultation only',
  'Consultation and labs',
  'Consultation and medication',
  'Minor procedure',
  'Major procedure/surgery',
  'Diagnostic imaging (X-ray/MRI/CT)',
  'Physical therapy',
  'Emergency treatment'
];

const emptyCostForm = {
  predicted_disease: '',
  treatment_type: '',
  selected_hospital: ''
};

const emptyAffordabilityForm = {
  total_cost_estimate: '',
  monthly_income: '',
  existing_savings: '',
  insurance_coverage_percent: 0
};

function formatCurrency(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0
  }).format(amount);
}

function getScoreTone(score) {
  if (score >= 80) {
    return {
      label: 'Easily affordable',
      badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      accentClass: 'bg-emerald-500'
    };
  }

  if (score >= 55) {
    return {
      label: 'Manageable',
      badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
      accentClass: 'bg-amber-500'
    };
  }

  return {
    label: 'Significant strain',
    badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
    accentClass: 'bg-rose-500'
  };
}

export default function CostIntelligencePage() {
  const latestCareContext = useCareContext((state) => state.latestCareContext);
  const storedHospital = useCareContext((state) => state.selectedHospital);
  const [costForm, setCostForm] = useState(() => ({
    ...emptyCostForm,
    predicted_disease: latestCareContext?.disease || '',
    selected_hospital: storedHospital?.id || ''
  }));
  const [hospitals, setHospitals] = useState([]);
  const [hospitalCatalogLoading, setHospitalCatalogLoading] = useState(true);
  const [hospitalCatalogError, setHospitalCatalogError] = useState('');
  const [costResult, setCostResult] = useState(null);
  const [costLoading, setCostLoading] = useState(false);
  const [costError, setCostError] = useState('');

  const [affordabilityForm, setAffordabilityForm] = useState(emptyAffordabilityForm);
  const [affordabilityResult, setAffordabilityResult] = useState(null);
  const [affordabilityLoading, setAffordabilityLoading] = useState(false);
  const [affordabilityError, setAffordabilityError] = useState('');
  const costResultRef = useRef(null);
  const affordabilityResultRef = useRef(null);

  useEffect(() => {
    fetch(`${backendBaseUrl}/medical-cost-intelligence/hospitals`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.detail || 'Unable to load hospitals.');
        const loadedHospitals = Array.isArray(payload.hospitals) ? payload.hospitals : [];
        setHospitals(loadedHospitals);
        if (!storedHospital?.id && storedHospital?.name) {
          const match = loadedHospitals.find((hospital) => hospital.name === storedHospital.name);
          if (match) setCostForm((current) => ({ ...current, selected_hospital: match.id }));
        }
      })
      .catch((error) => setHospitalCatalogError(error instanceof Error ? error.message : 'Unable to load hospitals.'))
      .finally(() => setHospitalCatalogLoading(false));
  }, [storedHospital]);

  useEffect(() => {
    if (costResult) {
      requestAnimationFrame(() => costResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
    }
  }, [costResult]);

  useEffect(() => {
    if (affordabilityResult) {
      requestAnimationFrame(() => affordabilityResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
    }
  }, [affordabilityResult]);

  const scoreTone = useMemo(() => {
    if (!affordabilityResult) {
      return null;
    }

    return getScoreTone(affordabilityResult.affordability_score);
  }, [affordabilityResult]);

  const handleCostChange = (event) => {
    const { name, value } = event.target;
    setCostForm((current) => ({ ...current, [name]: value }));
  };

  const handleAffordabilityChange = (event) => {
    const { name, value } = event.target;
    setAffordabilityForm((current) => ({ ...current, [name]: value }));
  };

  const handleEstimate = async (event) => {
    event.preventDefault();
    setCostLoading(true);
    setCostError('');

    try {
      const response = await fetch(`${backendBaseUrl}/medical-cost-intelligence/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          predicted_disease: costForm.predicted_disease,
          treatment_type: costForm.treatment_type,
          selected_hospital: costForm.selected_hospital || null
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.detail || 'Unable to estimate cost.');
      }

      setCostResult(data);
      setAffordabilityForm((current) => ({
        ...current,
        total_cost_estimate: data.cost_breakdown?.total_range?.max ?? current.total_cost_estimate
      }));
    } catch (error) {
      setCostError(error instanceof Error ? error.message : 'Unable to estimate cost.');
    } finally {
      setCostLoading(false);
    }
  };

  const handleAffordabilityCheck = async (event) => {
    event.preventDefault();
    setAffordabilityLoading(true);
    setAffordabilityError('');

    try {
      const response = await fetch(`${backendBaseUrl}/medical-cost-intelligence/affordability-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          total_cost_estimate: Number(affordabilityForm.total_cost_estimate) || 0,
          monthly_income: Number(affordabilityForm.monthly_income) || 0,
          existing_savings: Number(affordabilityForm.existing_savings) || 0,
          insurance_coverage_percent: Number(affordabilityForm.insurance_coverage_percent) || 0,
          cost_breakdown: costResult?.cost_breakdown || null,
          treatment_type: costForm.treatment_type || undefined,
          predicted_disease: costForm.predicted_disease || undefined,
          selected_hospital: costForm.selected_hospital || undefined
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.detail || 'Unable to analyze affordability.');
      }

      setAffordabilityResult(data);
    } catch (error) {
      setAffordabilityError(error instanceof Error ? error.message : 'Unable to analyze affordability.');
    } finally {
      setAffordabilityLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-tealSoft px-4 py-2 text-sm font-medium text-primary">
              <CurrencyDollarIcon className="h-4 w-4" />
              Finance Module
            </div>
            <h2 className="mt-5 text-3xl font-medium tracking-tight text-heading sm:text-4xl">Cost Intelligence</h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              Estimate likely care costs first, then check whether the plan feels manageable against monthly income,
              savings, and insurance coverage.
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 px-5 py-4 text-sm leading-7 text-heading">
            <div className="font-medium text-heading">Merged flow</div>
            <p className="mt-1 text-muted">Step 1: cost breakdown. Step 2: affordability check on the same page.</p>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <section className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <SparklesIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-medium text-heading">Step 1: Cost breakdown</h3>
              <p className="text-sm text-muted">Tell us the disease and treatment type to estimate likely spending.</p>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleEstimate}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-muted">
                <span className="mb-2 block font-medium text-heading">Predicted disease</span>
                <input
                  type="text"
                  name="predicted_disease"
                  value={costForm.predicted_disease}
                  onChange={handleCostChange}
                  placeholder="Heart attack"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-heading outline-none ring-0 focus:border-primary"
                  required
                />
              </label>
              <label className="text-sm text-muted">
                <span className="mb-2 block font-medium text-heading">Treatment type</span>
                <select
                  name="treatment_type"
                  value={costForm.treatment_type}
                  onChange={handleCostChange}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-heading outline-none ring-0 focus:border-primary"
                  required
                >
                  <option value="">Choose a treatment type</option>
                  {treatmentOptions.map((treatment) => (
                    <option key={treatment} value={treatment}>{treatment}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="text-sm text-muted">
              <span className="mb-2 block font-medium text-heading">Selected hospital (optional)</span>
              <select
                name="selected_hospital"
                value={costForm.selected_hospital}
                onChange={handleCostChange}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-heading outline-none ring-0 focus:border-primary"
              >
                <option value="">{hospitalCatalogLoading ? 'Loading hospitals...' : 'Choose a hospital'}</option>
                {hospitals.map((hospital) => (
                  <option key={hospital.id} value={hospital.id}>
                    {hospital.name} — {hospital.city}
                  </option>
                ))}
              </select>
              {hospitalCatalogError ? <span className="mt-2 block text-sm text-critical">{hospitalCatalogError}</span> : null}
            </label>

            <button
              type="submit"
              disabled={costLoading}
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-white shadow-soft transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {costLoading ? 'Estimating...' : 'Estimate cost'}
            </button>
          </form>

          {costError ? <div className="mt-4 rounded-2xl border border-critical/20 bg-rose-50 px-4 py-3 text-sm text-critical">{costError}</div> : null}

          {costResult ? (
            <div ref={costResultRef} className="mt-5 animate-[pulse_700ms_ease-out_1] scroll-mt-24 rounded-[24px] border border-primary/30 bg-teal-50/40 p-5 shadow-card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Estimated range</div>
                  <h4 className="mt-1 text-2xl font-medium tracking-tight text-heading">
                    {formatCurrency(costResult.cost_breakdown?.total_range?.min)} - {formatCurrency(costResult.cost_breakdown?.total_range?.max)}
                  </h4>
                </div>
                <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-heading shadow-card">
                  Specialist: {costResult.specialist}{costResult.matched_doctor ? ` · ${costResult.matched_doctor}` : ''}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ['Consultation', costResult.cost_breakdown?.consultation],
                  ['Labs', costResult.cost_breakdown?.labs],
                  ['Medication', costResult.cost_breakdown?.medication],
                  ['Procedure', costResult.cost_breakdown?.procedure]
                ].map(([label, range]) => (
                  <div key={label} className="rounded-2xl border border-border bg-white p-4">
                    <div className="text-sm font-medium text-heading">{label}</div>
                    <div className="mt-1 text-sm text-muted">
                      {formatCurrency(range?.min)} - {formatCurrency(range?.max)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-primary">
              <ShieldCheckIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-medium text-heading">Step 2: Affordability check</h3>
              <p className="text-sm text-muted">Use the estimate above, then compare it against your real monthly budget.</p>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleAffordabilityCheck}>
            <label className="text-sm text-muted">
              <span className="mb-2 block font-medium text-heading">Total cost estimate</span>
              <input
                type="number"
                name="total_cost_estimate"
                min="0"
                value={affordabilityForm.total_cost_estimate}
                onChange={handleAffordabilityChange}
                placeholder="e.g. 12000"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-heading outline-none ring-0 focus:border-primary"
                required
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-muted">
                <span className="mb-2 block font-medium text-heading">Monthly income</span>
                <input
                  type="number"
                  name="monthly_income"
                  min="1"
                  value={affordabilityForm.monthly_income}
                  onChange={handleAffordabilityChange}
                  placeholder="e.g. 45000"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-heading outline-none ring-0 focus:border-primary"
                  required
                />
              </label>
              <label className="text-sm text-muted">
                <span className="mb-2 block font-medium text-heading">Existing savings (optional)</span>
                <input
                  type="number"
                  name="existing_savings"
                  min="0"
                  value={affordabilityForm.existing_savings}
                  onChange={handleAffordabilityChange}
                  placeholder="e.g. 15000"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-heading outline-none ring-0 focus:border-primary"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-border bg-slate-50 px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <label className="text-sm font-medium text-heading">Insurance coverage</label>
                <span className="text-sm text-muted">{Number(affordabilityForm.insurance_coverage_percent || 0)}%</span>
              </div>
              <input
                type="range"
                name="insurance_coverage_percent"
                min="0"
                max="100"
                step="5"
                value={affordabilityForm.insurance_coverage_percent}
                onChange={handleAffordabilityChange}
                className="mt-3 w-full accent-teal-700"
              />
            </div>

            <button
              type="submit"
              disabled={affordabilityLoading}
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-white shadow-soft transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {affordabilityLoading ? 'Checking affordability...' : 'Check affordability'}
            </button>
          </form>

          {affordabilityError ? <div className="mt-4 rounded-2xl border border-critical/20 bg-rose-50 px-4 py-3 text-sm text-critical">{affordabilityError}</div> : null}

          {affordabilityResult ? (
            <div ref={affordabilityResultRef} className="mt-5 animate-[pulse_700ms_ease-out_1] scroll-mt-24 space-y-5 rounded-[28px] ring-2 ring-primary/10">
              <div className="flex flex-col items-center gap-4 rounded-[28px] border border-border bg-slate-50 px-6 py-6 text-center">
                <CircularGauge
                  value={affordabilityResult.affordability_score}
                  label={scoreTone?.label || affordabilityResult.score_label}
                  tone={affordabilityResult.affordability_score >= 80 ? 'positive' : affordabilityResult.affordability_score >= 55 ? 'caution' : 'critical'}
                />
                <div className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium ${scoreTone?.badgeClass || ''}`}>
                  {affordabilityResult.score_label}
                </div>
                <div className="text-sm text-muted">
                  Effective out-of-pocket cost: <span className="font-medium text-heading">{formatCurrency(affordabilityResult.effective_out_of_pocket_cost)}</span>
                </div>
              </div>

              <div className="rounded-[24px] border border-primary/20 bg-teal-50 p-5 shadow-card">
                <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">AI insight</div>
                <p className="mt-3 text-sm leading-7 text-heading">{affordabilityResult.ai_summary}</p>
              </div>

              <div className="rounded-[24px] border border-border bg-white p-5 shadow-card">
                <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Personalized suggestions</div>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-muted">
                  {affordabilityResult.ai_suggestions.map((suggestion, index) => (
                    <li key={`${suggestion}-${index}`} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-heading">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {affordabilityResult.affordability_score < 55 ? (
                <a
                  href="/navigator"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-white shadow-soft transition hover:opacity-90"
                >
                  Explore affordable options
                  <ArrowRightIcon className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}
