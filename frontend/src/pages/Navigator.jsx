import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDaysIcon, ExclamationTriangleIcon, MapPinIcon, StarIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { API_BASE_URL } from '../lib/api';
import useCareContext from '../store/useCareContext';

const formatPKR = (value) => new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0
}).format(value || 0);

const URGENT_CONDITION_PATTERN = /\b(heart attack|cardiac arrest|stroke|meningitis|pulmonary embolism|sepsis|anaphylaxis|severe asthma)\b/i;

export default function NavigatorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const storedContext = useCareContext((state) => state.latestCareContext);
  const rememberSelectedHospital = useCareContext((state) => state.setSelectedHospital);
  const rememberAppointmentSelection = useCareContext((state) => state.setAppointmentSelection);
  const routeAssessment = location.state?.assessment;
  const careContext = location.state?.careContext || storedContext || (routeAssessment ? {
    disease: routeAssessment.topDisease,
    specialist: location.state?.specialist || routeAssessment.suggestedSpecialist || 'General Physician',
    riskLevel: routeAssessment.riskLevel,
    confidence: routeAssessment.score,
    source: 'Recent assessment'
  } : null);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const [warningDismissed, setWarningDismissed] = useState(false);

  const isCriticalQuickCheck = careContext?.source === 'Health Assessment'
    && String(careContext?.riskLevel).toLowerCase() === 'critical';
  const shouldShowAttentionWarning = careContext?.source === 'Disease Prediction'
    && (URGENT_CONDITION_PATTERN.test(careContext?.disease || '') || Number(careContext?.confidence) >= 75);

  useEffect(() => {
    setWarningDismissed(false);
  }, [careContext?.disease, careContext?.confidence]);

  useEffect(() => {
    if (isCriticalQuickCheck) {
      navigate('/emergency', { replace: true });
      return;
    }
    if (!careContext) return;
    fetch(`${API_BASE_URL}/smart-care-navigator/personalized`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        disease: careContext.disease,
        specialist: careContext.specialist,
        risk_level: careContext.riskLevel
      })
    }).then(async (response) => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || 'Unable to load recommendations.');
      setData(payload);
      setSelectedHospitalId(payload.featured_hospital?.id || '');
      if (payload.featured_hospital) {
        rememberSelectedHospital({ id: payload.featured_hospital.id, name: payload.featured_hospital.name });
      }
    }).catch((requestError) => setError(requestError.message));
  }, [careContext?.disease, careContext?.specialist, careContext?.riskLevel, isCriticalQuickCheck, navigate, rememberSelectedHospital]);

  const rememberBookingHandoff = (hospital, doctor) => {
    rememberSelectedHospital({ id: hospital.id, name: hospital.name });
    rememberAppointmentSelection({
      hospital_id: hospital.id,
      doctor_id: doctor.id,
      recommended_specialist: careContext.specialist
    });
  };

  const topRecommendations = useMemo(() => {
    if (!data) return [];
    const recommendations = data.nearby_hospitals.slice(0, 3).map((hospital) => ({
      hospital,
      doctor: data.doctors.find((doctor) => doctor.hospital_id === hospital.id)
    })).filter((item) => item.doctor);

    if (!recommendations.length) return [];
    const badges = new Map([[recommendations[0].hospital.id, 'Best Match']]);
    const remaining = recommendations.slice(1);
    if (remaining.length) {
      const affordable = [...remaining].sort((a, b) => a.doctor.consultation_fee - b.doctor.consultation_fee)[0];
      badges.set(affordable.hospital.id, 'Most Affordable');
      remaining.filter((item) => item.hospital.id !== affordable.hospital.id).forEach((item) => {
        badges.set(item.hospital.id, 'Nearest');
      });
    }
    return recommendations.map((item) => ({ ...item, badge: badges.get(item.hospital.id) }));
  }, [data]);

  const selectedHospital = useMemo(
    () => data?.nearby_hospitals?.find((item) => item.id === selectedHospitalId),
    [data, selectedHospitalId]
  );
  const selectedDoctors = useMemo(
    () => data?.doctors?.filter((doctor) => doctor.hospital_id === selectedHospitalId) || [],
    [data, selectedHospitalId]
  );

  if (!careContext) {
    return (
      <section className="rounded-[28px] border border-border bg-white p-8 shadow-card">
        <h2 className="text-3xl font-medium text-heading">Complete an assessment first</h2>
        <p className="mt-3 text-muted">Disease Prediction or Health Assessment will create your personalized care recommendation.</p>
        <Link to="/disease-prediction" className="mt-5 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-medium text-white">Open Disease Prediction</Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {shouldShowAttentionWarning && !warningDismissed ? (
        <section className="flex flex-col gap-4 rounded-[24px] border border-amber-300 bg-amber-50 p-5 text-amber-950 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" />
            <div>
              <h2 className="font-semibold">Prompt medical attention may be appropriate</h2>
              <p className="mt-1 text-sm leading-6 text-amber-900">This condition may require prompt medical attention — consider Emergency Mode if symptoms are severe or worsening.</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link to="/emergency" className="inline-flex rounded-full bg-critical px-4 py-2.5 text-sm font-medium text-white">Emergency Mode</Link>
            <button type="button" onClick={() => setWarningDismissed(true)} aria-label="Dismiss medical attention warning" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-amber-800 transition hover:bg-amber-100">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </section>
      ) : null}

      <section className="rounded-[28px] border border-primary/20 bg-white p-6 shadow-card sm:p-8">
        <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Based on your recent assessment</div>
        <h2 className="mt-3 text-3xl font-medium text-heading">{careContext.disease} — Recommended: {careContext.specialist}</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-teal-50 px-3 py-1 text-sm text-primary">Risk: {careContext.riskLevel}</span>
          {careContext.confidence != null ? <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-heading">Confidence: {careContext.confidence}%</span> : null}
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-rose-50 p-4 text-sm text-red-700">{error}</div> : null}
      {!data ? <div className="rounded-[28px] bg-white p-8 text-muted shadow-card">Preparing your personalized recommendation...</div> : (
        <>
          <section>
            <div className="mb-4">
              <h3 className="text-2xl font-medium tracking-tight text-heading">Top care recommendations</h3>
              <p className="mt-2 text-sm text-muted">Compare the strongest hospital and specialist matches for your assessment.</p>
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              {topRecommendations.map(({ hospital, doctor, badge }) => (
                <article key={hospital.id} className="flex h-full flex-col rounded-[28px] border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-6 shadow-soft">
                  <div className="inline-flex w-fit rounded-full bg-primary px-3 py-1 text-xs font-medium text-white">{badge}</div>
                  <h4 className="mt-4 text-2xl font-medium tracking-tight text-heading">{hospital.name}</h4>
                  <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-muted"><MapPinIcon className="mt-1 h-4 w-4 shrink-0" />{hospital.area}, {hospital.city}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm">
                    <span className="inline-flex items-center gap-1 text-amber-700"><StarIcon className="h-4 w-4" />{hospital.rating}</span>
                    <span className="text-muted">{hospital.distance_km} km away</span>
                  </div>
                  <div className="mt-5 flex-1 rounded-[22px] bg-white p-5 shadow-card">
                    <div className="text-lg font-medium text-heading">{doctor.name}</div>
                    <div className="mt-1 text-sm font-medium text-primary">{doctor.specialization}</div>
                    <div className="mt-3 text-sm font-medium text-heading">{formatPKR(doctor.consultation_fee)}</div>
                  </div>
                  <Link
                    to="/appointments"
                    state={{ appointmentSelection: { hospital_id: hospital.id, doctor_id: doctor.id, recommended_specialist: careContext.specialist } }}
                    onClick={() => rememberBookingHandoff(hospital, doctor)}
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-white"
                  >
                    <CalendarDaysIcon className="h-4 w-4" />
                    Book Appointment
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <article className="rounded-[28px] border border-border bg-white p-6 shadow-card"><h3 className="text-xl font-medium text-heading">What to expect</h3><ul className="mt-4 space-y-3 text-sm leading-7 text-muted">{data.what_to_expect.map((item) => <li key={item} className="rounded-2xl bg-slate-50 p-3">{item}</li>)}</ul></article>
            <article className="rounded-[28px] border border-border bg-white p-6 shadow-card"><h3 className="text-xl font-medium text-heading">Estimated cost preview</h3><p className="mt-5 text-2xl font-medium text-heading">{formatPKR(data.cost_preview.min)} – {formatPKR(data.cost_preview.max)}</p><p className="mt-2 text-sm text-muted">Rough consultation and labs estimate.</p><Link to="/cost" onClick={() => { if (selectedHospital) rememberSelectedHospital({ id: selectedHospital.id, name: selectedHospital.name }); }} className="mt-5 inline-flex text-sm font-medium text-primary hover:underline">See full cost breakdown</Link></article>
            <article className="rounded-[28px] border border-border bg-white p-6 shadow-card"><h3 className="text-xl font-medium text-heading">Questions to ask your doctor</h3><ul className="mt-4 space-y-3 text-sm leading-6 text-muted">{data.questions_to_ask.map((item) => <li key={item} className="flex gap-2"><span className="text-primary">•</span>{item}</li>)}</ul></article>
          </section>

          <section className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
            <h3 className="text-2xl font-medium text-heading">Browse alternative hospitals</h3>
            <select value={selectedHospitalId} onChange={(event) => {
              const hospitalId = event.target.value;
              const hospital = data.nearby_hospitals.find((item) => item.id === hospitalId);
              setSelectedHospitalId(hospitalId);
              if (hospital) {
                rememberSelectedHospital({ id: hospital.id, name: hospital.name });
                rememberAppointmentSelection(null);
              }
            }} className="mt-4 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary">
              {data.nearby_hospitals.map((hospital) => <option key={hospital.id} value={hospital.id}>{hospital.name} — {hospital.city}</option>)}
            </select>
            {selectedHospital ? (
              <div className="mt-5 rounded-[24px] bg-slate-50 p-5">
                <div className="flex justify-between gap-3"><div><h4 className="text-xl font-medium text-heading">{selectedHospital.name}</h4><p className="mt-1 text-sm text-muted">{selectedHospital.area}, {selectedHospital.city}</p></div><span className="text-amber-700">★ {selectedHospital.rating}</span></div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">{selectedDoctors.map((doctor) => <div key={doctor.id} className="rounded-2xl bg-white p-4 shadow-card"><div className="font-medium text-heading">{doctor.name}</div><div className="mt-1 text-sm text-primary">{doctor.specialization}</div><div className="mt-2 text-sm text-muted">{doctor.qualification} · {doctor.years_experience} years</div><Link to="/appointments" state={{ appointmentSelection: { hospital_id: selectedHospital.id, doctor_id: doctor.id, recommended_specialist: careContext.specialist } }} onClick={() => rememberBookingHandoff(selectedHospital, doctor)} className="mt-3 inline-flex text-sm font-medium text-primary hover:underline">Book this doctor</Link></div>)}</div>
              </div>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}
