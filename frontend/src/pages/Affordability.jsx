import { useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const emptyForm = {
  treatment_type: '',
  hospital: '',
  estimated_cost: '',
  insurance_coverage: '',
  monthly_income: '',
  monthly_budget: '',
  existing_debt: ''
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
      label: 'Affordable',
      badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      ringClass: 'border-emerald-500/20 bg-emerald-50'
    };
  }

  if (score >= 60) {
    return {
      label: 'Manageable',
      badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
      ringClass: 'border-amber-500/20 bg-amber-50'
    };
  }

  return {
    label: 'Needs attention',
    badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
    ringClass: 'border-rose-500/20 bg-rose-50'
  };
}

export default function AffordabilityPage() {
  const [formData, setFormData] = useState(emptyForm);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const scoreTone = useMemo(() => (result ? getScoreTone(result.affordability_score) : null), [result]);

  async function loadHistory() {
    try {
      const response = await fetch(`${API_BASE_URL}/treatment-affordability-score`);
      if (!response.ok) {
        throw new Error('Unable to load previous affordability analyses.');
      }

      const payload = await response.json();
      const nextHistory = Array.isArray(payload) ? payload : [];
      setHistory(nextHistory);
      localStorage.setItem('careledger_affordability_history', JSON.stringify(nextHistory));
    } catch (loadError) {
      const savedHistory = localStorage.getItem('careledger_affordability_history');
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory));
        } catch {
          setHistory([]);
        }
      }
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        treatment_type: formData.treatment_type,
        hospital: formData.hospital,
        estimated_cost: Number(formData.estimated_cost) || 0,
        insurance_coverage: Number(formData.insurance_coverage) || 0,
        monthly_income: Number(formData.monthly_income) || 0,
        monthly_budget: Number(formData.monthly_budget) || 0,
        existing_debt: Number(formData.existing_debt) || 0
      };

      const response = await fetch(`${API_BASE_URL}/treatment-affordability-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('The affordability analysis could not be completed.');
      }

      const nextResult = await response.json();
      setResult(nextResult);
      setHistory((current) => {
        const updated = [nextResult, ...current.filter((item) => item.id !== nextResult.id)];
        localStorage.setItem('careledger_affordability_history', JSON.stringify(updated.slice(0, 6)));
        return updated.slice(0, 6);
      });
      setFormData(emptyForm);
    } catch (submitError) {
      setError(submitError.message || 'Something went wrong while creating the affordability assessment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-primary">
              <ShieldCheckIcon className="h-4 w-4" />
              Make care costs easier to understand
            </div>
            <h2 className="mt-4 text-3xl font-medium tracking-tight text-heading sm:text-4xl">
              Cost Intelligence planner
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              Enter the treatment details you are reviewing so CareLedger AI can show the likely out-of-pocket cost,
              affordability score, and practical ways to reduce the burden.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-slate-50 px-4 py-3 text-sm text-muted">
            <div className="font-medium text-heading">Suggested inputs</div>
            <div className="mt-2">Treatment type, hospital, estimate, insurance, and monthly budget.</div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CurrencyDollarIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-medium text-heading">Cost intake</h3>
              <p className="text-sm text-muted">A clear snapshot before you commit to care.</p>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-muted">
                <span className="mb-2 block font-medium text-heading">Treatment type</span>
                <input
                  type="text"
                  name="treatment_type"
                  value={formData.treatment_type}
                  onChange={handleChange}
                  placeholder="MRI scan"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-heading outline-none ring-0 focus:border-primary"
                  required
                />
              </label>
              <label className="text-sm text-muted">
                <span className="mb-2 block font-medium text-heading">Hospital or clinic</span>
                <input
                  type="text"
                  name="hospital"
                  value={formData.hospital}
                  onChange={handleChange}
                  placeholder="City General Hospital"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-heading outline-none ring-0 focus:border-primary"
                  required
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-muted">
                <span className="mb-2 block font-medium text-heading">Estimated treatment cost</span>
                <input
                  type="number"
                  name="estimated_cost"
                  value={formData.estimated_cost}
                  onChange={handleChange}
                  placeholder="12000"
                  min="0"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-heading outline-none ring-0 focus:border-primary"
                  required
                />
              </label>
              <label className="text-sm text-muted">
                <span className="mb-2 block font-medium text-heading">Insurance coverage</span>
                <input
                  type="number"
                  name="insurance_coverage"
                  value={formData.insurance_coverage}
                  onChange={handleChange}
                  placeholder="6000"
                  min="0"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-heading outline-none ring-0 focus:border-primary"
                  required
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-muted">
                <span className="mb-2 block font-medium text-heading">Monthly income</span>
                <input
                  type="number"
                  name="monthly_income"
                  value={formData.monthly_income}
                  onChange={handleChange}
                  placeholder="4200"
                  min="0"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-heading outline-none ring-0 focus:border-primary"
                  required
                />
              </label>
              <label className="text-sm text-muted">
                <span className="mb-2 block font-medium text-heading">Monthly budget for care</span>
                <input
                  type="number"
                  name="monthly_budget"
                  value={formData.monthly_budget}
                  onChange={handleChange}
                  placeholder="500"
                  min="0"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-heading outline-none ring-0 focus:border-primary"
                  required
                />
              </label>
            </div>

            <label className="block text-sm text-muted">
              <span className="mb-2 block font-medium text-heading">Existing debt or payment plans</span>
              <input
                type="number"
                name="existing_debt"
                value={formData.existing_debt}
                onChange={handleChange}
                placeholder="800"
                min="0"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-heading outline-none ring-0 focus:border-primary"
                required
              />
            </label>

            {error ? (
              <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <ExclamationCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-white shadow-soft transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4" />
                  Review affordability
                </>
              )}
            </button>
          </form>
        </section>

        <section className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
          {result ? (
            <div className="space-y-5">
              <div className={`rounded-[24px] border p-5 ${scoreTone?.ringClass || 'border-border bg-slate-50'}`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${scoreTone?.badgeClass || 'border-border bg-white text-heading'}`}>
                      {scoreTone?.label || 'Review'}
                    </div>
                    <h3 className="mt-3 text-2xl font-medium tracking-tight text-heading">Affordability score</h3>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      {result.summary}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-white px-4 py-4 text-center shadow-card">
                    <div className="text-4xl font-medium text-heading">{result.affordability_score}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.3em] text-muted">/ 100</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-muted">Out-of-pocket</div>
                  <div className="mt-2 text-xl font-medium text-heading">{formatCurrency(result.cost_breakdown.out_of_pocket_cost)}</div>
                </div>
                <div className="rounded-2xl border border-border bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-muted">Monthly burden</div>
                  <div className="mt-2 text-xl font-medium text-heading">{formatCurrency(result.cost_breakdown.monthly_burden)}</div>
                </div>
                <div className="rounded-2xl border border-border bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-muted">Monthly budget gap</div>
                  <div className="mt-2 text-xl font-medium text-heading">{formatCurrency(result.cost_breakdown.budget_gap)}</div>
                </div>
              </div>

              <div className="rounded-[24px] border border-border bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-sm font-medium text-heading">
                  <CheckCircleIcon className="h-5 w-5 text-primary" />
                  Recommended next steps
                </div>
                <div className="mt-4 space-y-3">
                  {result.recommendations.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-border bg-white p-3 text-sm text-muted">
                      <div className="font-medium text-heading">{item.title}</div>
                      <div className="mt-1 leading-6">{item.detail}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[24px] border border-border p-5">
                  <div className="text-sm font-medium text-heading">Cheaper alternatives</div>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
                    {result.alternatives.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-[24px] border border-border p-5">
                  <div className="text-sm font-medium text-heading">Financial insights</div>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
                    {result.financial_insights.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-[24px] border border-dashed border-border bg-slate-50 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheckIcon className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-xl font-medium text-heading">No affordability analysis yet</h3>
              <p className="mt-2 max-w-md text-sm leading-7 text-muted">
                Submit the treatment details to see a structured affordability breakdown, practical suggestions, and a clear score.
              </p>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-medium text-heading">Recent affordability reviews</h3>
            <p className="mt-2 text-sm text-muted">Saved locally and backed by the backend history endpoint.</p>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-border bg-slate-50 p-6 text-sm text-muted">
            Your recent affordability reviews will appear here after you submit one.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {history.map((entry) => (
              <div key={entry.id} className="rounded-[24px] border border-border p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-lg font-medium text-heading">{entry.treatment_type}</div>
                    <div className="mt-1 text-sm text-muted">{entry.hospital}</div>
                  </div>
                  <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                    {entry.affordability_score}/100
                  </div>
                </div>
                <div className="mt-4 text-sm leading-7 text-muted">
                  Estimated cost: {formatCurrency(entry.cost_breakdown.out_of_pocket_cost)} · Monthly burden: {formatCurrency(entry.cost_breakdown.monthly_burden)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
