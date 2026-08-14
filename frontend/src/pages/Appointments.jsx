import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  ClockIcon,
  VideoCameraIcon,
  UserGroupIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline';

import bookingConfirmedIllustration from '../assets/illustrations/booking-confirmed.png';
import appointmentBanner from '../assets/illustrations/appointment.jpeg';
import { API_BASE_URL } from '../lib/api';
import useCareContext from '../store/useCareContext';

const emptyForm = {
  hospital_id: '',
  doctor_id: '',
  hospital_name: '',
  doctor_name: '',
  specialization: '',
  consultation_fee: '',
  appointment_date: '',
  time_slot: '',
  appointment_type: 'In-person',
  reason_for_visit: ''
};

function formatCurrency(value) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function formatDate(dateValue) {
  if (!dateValue) return '—';
  return new Intl.DateTimeFormat('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(`${dateValue}T00:00:00`));
}

function getMinDate() {
  return new Date().toISOString().split('T')[0];
}

function getDayLabel(dateValue) {
  if (!dateValue) return '';
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(`${dateValue}T00:00:00`));
}

function getAppointmentTypeTone(type) {
  return type === 'Video call'
    ? 'border-sky-200 bg-sky-50 text-sky-700'
    : 'border-teal-200 bg-teal-50 text-teal-700';
}

export default function AppointmentsPage() {
  const location = useLocation();
  const storedAppointmentSelection = useCareContext((state) => state.appointmentSelection);
  const pendingSelection = location.state?.appointmentSelection || storedAppointmentSelection;
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [hospitalSort, setHospitalSort] = useState('rating');
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [bookings, setBookings] = useState([]);
  const [fetchingBookings, setFetchingBookings] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [successBooking, setSuccessBooking] = useState(null);
  const [recommendedSpecialist, setRecommendedSpecialist] = useState('');

  useEffect(() => {
    const specialist = pendingSelection?.recommended_specialist || '';
    setRecommendedSpecialist(specialist);
    const catalogUrl = specialist
      ? `${API_BASE_URL}/appointments/catalog?recommended_specialist=${encodeURIComponent(specialist)}`
      : `${API_BASE_URL}/appointments/catalog`;
    fetch(catalogUrl)
      .then((response) => response.json())
      .then((data) => {
        const loadedHospitals = Array.isArray(data.hospitals) ? data.hospitals : [];
        const loadedDoctors = Array.isArray(data.doctors) ? data.doctors : [];
        setHospitals(loadedHospitals);
        setDoctors(loadedDoctors);
        if (!pendingSelection?.hospital_id || !pendingSelection?.doctor_id) return;
        const matchedHospital = loadedHospitals.find((item) => item.id === pendingSelection.hospital_id) || null;
        const matchedDoctor = loadedDoctors.find((item) => item.id === pendingSelection.doctor_id && item.hospital_id === pendingSelection.hospital_id) || null;
        if (!matchedHospital || !matchedDoctor) return;
      setSelectedHospital(matchedHospital);
      setSelectedDoctor(matchedDoctor);
      setFormData((current) => ({
        ...current,
        hospital_id: matchedHospital.id,
        doctor_id: matchedDoctor.id,
        hospital_name: matchedHospital.name,
        doctor_name: matchedDoctor.name,
        specialization: matchedDoctor.specialization,
        consultation_fee: matchedDoctor.consultation_fee,
      }));
      }).catch(() => { setHospitals([]); setDoctors([]); });
  }, [pendingSelection?.hospital_id, pendingSelection?.doctor_id, pendingSelection?.recommended_specialist]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/appointments/my-appointments`)
      .then((response) => response.json())
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setBookings([]))
      .finally(() => setFetchingBookings(false));
  }, []);

  const filteredHospitals = useMemo(() => {
    return [...hospitals].sort((a, b) => {
      if (hospitalSort === 'distance') return a.distance_km - b.distance_km;
      if (hospitalSort === 'affordability') return a.consultation_fee - b.consultation_fee;
      return b.rating - a.rating;
    });
  }, [hospitalSort, hospitals]);

  const filteredDoctors = useMemo(() => {
    const query = doctorSearch.trim().toLowerCase();
    return doctors.filter((doctor) => {
      const matchesSearch = !query || [doctor.name, doctor.specialization, doctor.hospital_name].some((value) => value.toLowerCase().includes(query));
      const matchesHospital = !selectedHospital || doctor.hospital_id === selectedHospital.id;
      return matchesSearch && matchesHospital;
    });
  }, [doctorSearch, doctors, selectedHospital]);

  const hospitalBadges = useMemo(() => {
    if (!selectedHospital || !hospitals.length) return [];
    const badges = [];
    if (selectedHospital.rating === Math.max(...hospitals.map((item) => item.rating))) badges.push('Best Match');
    if (selectedHospital.consultation_fee === Math.min(...hospitals.map((item) => item.consultation_fee))) badges.push('Most Affordable');
    if (selectedHospital.distance_km === Math.min(...hospitals.map((item) => item.distance_km))) badges.push('Nearest');
    if (selectedHospital.waiting_time_minutes === Math.min(...hospitals.map((item) => item.waiting_time_minutes))) badges.push('Fastest Appointment');
    return badges;
  }, [selectedHospital, hospitals]);

  const selectedDay = useMemo(() => getDayLabel(formData.appointment_date), [formData.appointment_date]);
  const isDoctorAvailable = Boolean(selectedDoctor && selectedDay && selectedDoctor.available_days.includes(selectedDay));

  const availableSlots = useMemo(() => {
    if (!selectedDoctor || !selectedDay || !selectedDoctor.available_days.includes(selectedDay)) return [];
    return selectedDoctor.time_slots;
  }, [selectedDoctor, selectedDay]);

  const handleHospitalPick = (hospital) => {
    if (!hospital) {
      setSelectedHospital(null);
      setSelectedDoctor(null);
      setFormData(emptyForm);
      return;
    }
    setSelectedHospital(hospital);
    setFormData((current) => ({
      ...current,
      hospital_id: hospital.id,
      doctor_id: '',
      hospital_name: hospital.name,
      doctor_name: '',
      specialization: '',
      consultation_fee: '',
      time_slot: ''
    }));
    setSelectedDoctor(null);
  };

  const handleDoctorPick = (doctor) => {
    setSelectedDoctor(doctor);
    setFormData((current) => ({
      ...current,
      hospital_id: doctor.hospital_id,
      doctor_id: doctor.id,
      hospital_name: doctor.hospital_name,
      doctor_name: doctor.name,
      specialization: doctor.specialization,
      consultation_fee: doctor.consultation_fee,
      time_slot: ''
    }));
    const hospital = hospitals.find((item) => item.id === doctor.hospital_id) || null;
    setSelectedHospital(hospital);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBookingLoading(true);
    setError('');
    setSuccessBooking(null);

    try {
      const response = await fetch(`${API_BASE_URL}/appointments/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          hospital_id: formData.hospital_id,
          doctor_id: formData.doctor_id,
          appointment_date: formData.appointment_date,
          time_slot: formData.time_slot,
          appointment_type: formData.appointment_type,
          reason_for_visit: formData.reason_for_visit
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.detail || 'Unable to book appointment.');
      }

      setSuccessBooking(data);
      setBookings((current) => [data, ...current]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to book appointment.');
    } finally {
      setBookingLoading(false);
    }
  };

  const heroSummary = selectedDoctor
    ? `${selectedDoctor.name} at ${selectedDoctor.hospital_name} is ready for booking.`
    : 'Choose a hospital and doctor from the available care options, or book directly if your selection was prefilled from Navigator.';

  return (
    <div className="space-y-8">
      <section className="relative h-44 overflow-hidden rounded-[28px] border border-slate-200 shadow-soft sm:h-52 lg:h-64 xl:h-72">
        <img
          src={appointmentBanner}
          alt="Doctor discussing care with a patient"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/65 to-slate-900/5" />
        <div className="relative flex h-full flex-col justify-end p-4 sm:p-6 lg:p-8">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md sm:px-4 sm:py-2 sm:text-sm">
            <CalendarDaysIcon className="h-4 w-4" />
            Simple, secure booking
          </div>
          <h1 className="mt-3 max-w-xl text-2xl font-medium tracking-[-0.035em] text-white sm:text-3xl lg:text-4xl">
            Better care starts with the right appointment.
          </h1>
          <p className="mt-2 hidden max-w-xl text-sm leading-6 text-white/85 sm:block">
            Choose a trusted hospital, find the right specialist, and reserve a time that works for you—all in one clear flow.
          </p>
          <a href="#book-appointment" className="mt-3 hidden w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-teal-50 lg:inline-flex">
            Book an appointment
            <CalendarDaysIcon className="h-4 w-4" />
          </a>
        </div>
      </section>

      {selectedDoctor ? (
        <section className="rounded-[28px] border border-teal-200 bg-teal-50 p-6 shadow-card sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-card">
              <CheckBadgeIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Prefilled selection</div>
              <h2 className="mt-2 text-2xl font-medium tracking-tight text-heading">{selectedDoctor.name}</h2>
              <p className="mt-2 text-sm leading-7 text-muted">{heroSummary}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-white p-4 shadow-card">
              <div className="text-xs uppercase tracking-[0.2em] text-muted">Hospital</div>
              <div className="mt-2 font-medium text-heading">{selectedDoctor.hospital_name}</div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-card">
              <div className="text-xs uppercase tracking-[0.2em] text-muted">Specialty</div>
              <div className="mt-2 font-medium text-heading">{selectedDoctor.specialization}</div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-card">
              <div className="text-xs uppercase tracking-[0.2em] text-muted">Consultation fee</div>
              <div className="mt-2 font-medium text-heading">{formatCurrency(selectedDoctor.consultation_fee)}</div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-card">
              <div className="text-xs uppercase tracking-[0.2em] text-muted">Available days</div>
              <div className="mt-2 font-medium text-heading">{selectedDoctor.available_days.join(', ')}</div>
            </div>
          </div>
        </section>
      ) : null}

      <div id="book-appointment" className="grid scroll-mt-6 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-6 rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
          <div>
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Choose hospital</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px]">
              <select value={selectedHospital?.id || ''} onChange={(event) => handleHospitalPick(hospitals.find((item) => item.id === event.target.value))} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-heading outline-none focus:border-primary">
                <option value="">Choose a hospital</option>
                {filteredHospitals.map((hospital) => <option key={hospital.id} value={hospital.id}>{hospital.name} — {hospital.city}</option>)}
              </select>
              <select value={hospitalSort} onChange={(event) => setHospitalSort(event.target.value)} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-heading outline-none focus:border-primary">
                <option value="rating">Rating</option><option value="distance">Distance</option><option value="affordability">Affordability</option>
              </select>
            </div>
          </div>

          {selectedHospital ? <div className="rounded-[24px] border border-primary/20 bg-teal-50/40 p-5">
            <div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-medium text-heading">{selectedHospital.name}</h3><p className="mt-2 flex items-center gap-2 text-sm text-muted"><MapPinIcon className="h-4 w-4" />{selectedHospital.area}, {selectedHospital.city} · {selectedHospital.distance_km} km</p><div className="mt-3 flex flex-wrap gap-2">{hospitalBadges.map((badge) => <span key={badge} className="rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-medium text-primary">{badge}</span>)}</div></div><div className="rounded-full bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">★ {selectedHospital.rating}</div></div>
            <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-white px-3 py-1 text-xs text-heading">Insurance: {selectedHospital.insurance_accepted.join(', ')}</span><span className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-700">{selectedHospital.has_emergency_services ? 'Emergency services available' : 'No emergency services'}</span></div>
            <div className="mt-5"><div className="text-sm font-medium text-heading">Specialties available at this hospital</div><div className="mt-2 flex flex-wrap gap-2">{selectedHospital.specialists_available.map((specialty) => <span key={specialty} className="rounded-full border border-border bg-white px-3 py-1 text-xs text-muted">{specialty}</span>)}</div></div>
          </div> : null}

          <div>
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Choose doctor</div>
            {recommendedSpecialist ? <p className="mt-2 text-sm text-muted">Recommended for your assessment: <span className="font-medium text-primary">{recommendedSpecialist}</span>. Matching doctors appear first.</p> : null}
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-slate-50 px-4 py-3">
              <MagnifyingGlassIcon className="h-4 w-4 text-muted" />
              <input
                value={doctorSearch}
                onChange={(event) => setDoctorSearch(event.target.value)}
                placeholder="Search doctors or specialization"
                className="w-full bg-transparent text-sm text-heading outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4">
            {filteredDoctors.map((doctor) => (
              <button
                key={doctor.id}
                type="button"
                onClick={() => handleDoctorPick(doctor)}
                className={`rounded-[24px] border p-5 text-left transition ${selectedDoctor?.id === doctor.id ? 'border-primary bg-primary/5 shadow-card' : 'border-border bg-white hover:border-primary/40'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-primary">
                      <UserGroupIcon className="h-3.5 w-3.5" />
                      {doctor.specialization}
                    </div>
                    {doctor.is_recommended ? <div className="ml-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Recommended match</div> : null}
                    <div className="mt-3 text-lg font-medium text-heading">{doctor.name}</div>
                    <div className="mt-2 text-sm text-muted">{doctor.hospital_name}</div>
                  </div>
                  <div className="rounded-full bg-slate-50 px-3 py-1 text-sm font-medium text-heading">
                    {formatCurrency(doctor.consultation_fee)}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
                  {doctor.available_days.map((day) => (
                    <span key={day} className="rounded-full border border-border bg-slate-50 px-3 py-1">
                      {day}
                    </span>
                  ))}
                </div>
                <div className="mt-4 space-y-1 text-xs leading-5 text-muted">
                  <div><span className="font-medium text-heading">Qualification:</span> {doctor.qualification || doctor.qualifications}</div>
                  <div><span className="font-medium text-heading">Experience:</span> {doctor.years_experience} years · <span className="font-medium text-heading">Rating:</span> {doctor.rating}</div>
                  <div><span className="font-medium text-heading">Languages:</span> {doctor.languages_spoken.join(', ')}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CalendarDaysIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-2xl font-medium tracking-tight text-heading">Booking form</h3>
              <p className="text-sm text-muted">Fill the visit details and confirm your appointment.</p>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {selectedHospital ? (
              <div className="rounded-[24px] border border-border bg-slate-50 p-4">
                <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Booking summary</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white p-4 shadow-card">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted">Hospital</div>
                    <div className="mt-2 font-medium text-heading">{formData.hospital_name || selectedHospital.name}</div>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-card">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted">Doctor</div>
                    <div className="mt-2 font-medium text-heading">{formData.doctor_name || 'Select a doctor'}</div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-muted">
                <span className="mb-2 block font-medium text-heading">Appointment date</span>
                <input
                  type="date"
                  value={formData.appointment_date}
                  min={getMinDate()}
                  onChange={(event) => setFormData((current) => ({ ...current, appointment_date: event.target.value, time_slot: '' }))}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-heading outline-none focus:border-primary"
                  required
                />
              </label>
              <label className="block text-sm text-muted">
                <span className="mb-2 block font-medium text-heading">Time slot</span>
                <select
                  value={formData.time_slot}
                  onChange={(event) => setFormData((current) => ({ ...current, time_slot: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-heading outline-none focus:border-primary"
                  required
                  disabled={!isDoctorAvailable}
                >
                  <option value="">Choose a slot</option>
                  {availableSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {selectedDoctor && selectedDay && !isDoctorAvailable ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {selectedDoctor.name} isn't available on this day — available days: {selectedDoctor.available_days.join(', ')}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: 'In-person', icon: CheckCircleIcon },
                { label: 'Video call', icon: VideoCameraIcon }
              ].map(({ label, icon: Icon }) => {
                const active = formData.appointment_type === label;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setFormData((current) => ({ ...current, appointment_type: label }))}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-left text-sm font-medium transition ${active ? 'border-primary bg-primary text-white shadow-soft' : 'border-border bg-white text-heading hover:border-primary/40'}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            <label className="block text-sm text-muted">
              <span className="mb-2 block font-medium text-heading">Reason for visit</span>
              <textarea
                rows="4"
                value={formData.reason_for_visit}
                onChange={(event) => setFormData((current) => ({ ...current, reason_for_visit: event.target.value }))}
                placeholder="Tell the doctor why you are booking this appointment"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-heading outline-none focus:border-primary"
              />
            </label>

            <div className="rounded-2xl border border-border bg-slate-50 px-4 py-4 text-sm text-muted">
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium text-heading">Consultation fee</span>
                <span className="font-medium text-heading">{formData.consultation_fee ? formatCurrency(formData.consultation_fee) : 'PKR 0'}</span>
              </div>
              {selectedDay ? <div className="mt-2">Selected day: {selectedDay}</div> : null}
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={bookingLoading || !formData.hospital_id || !formData.doctor_id || !isDoctorAvailable || !formData.time_slot}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-white shadow-soft transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {bookingLoading ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Booking appointment...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  Confirm appointment
                </>
              )}
            </button>
          </form>
        </section>
      </div>

      {successBooking ? (
        <section className="grid gap-6 rounded-[32px] border border-emerald-200 bg-emerald-50 p-6 shadow-card lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
          <div className="flex items-center justify-center rounded-[28px] bg-white p-4 shadow-card">
            <img src={bookingConfirmedIllustration} alt="Patient and doctor celebrating a confirmed appointment" className="max-h-[320px] w-full rounded-[20px] object-cover" />
          </div>
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-emerald-700 shadow-card">
              <CheckCircleIcon className="h-4 w-4" />
              Appointment confirmed
            </div>
            <h2 className="mt-5 text-3xl font-medium tracking-tight text-heading sm:text-4xl">Your appointment is booked</h2>
            <div className="mt-5 rounded-[24px] border border-emerald-200 bg-white p-5 shadow-card">
              <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Confirmation message</div>
              <p className="mt-3 text-sm leading-7 text-heading">{successBooking.confirmation_message}</p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <SummaryCard label="Doctor" value={successBooking.doctor_name} />
              <SummaryCard label="Hospital" value={successBooking.hospital_name} />
              <SummaryCard label="Date" value={formatDate(successBooking.appointment_date)} />
              <SummaryCard label="Time" value={successBooking.time_slot} />
              <SummaryCard label="Fee" value={formatCurrency(successBooking.consultation_fee)} />
              <SummaryCard label="Type" value={successBooking.appointment_type} />
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">My Appointments</div>
            <h3 className="mt-2 text-2xl font-medium tracking-tight text-heading">Upcoming bookings</h3>
            <p className="mt-2 text-sm text-muted">Your in-session appointments appear here right away.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-heading">
            {bookings.length} total
          </div>
        </div>

        {fetchingBookings ? (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-slate-50 px-4 py-4 text-sm text-muted">
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
            Loading appointments...
          </div>
        ) : bookings.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-border bg-slate-50 p-6 text-sm text-muted">
            No appointments booked yet.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {bookings.map((booking) => (
              <article key={booking.appointment_id} className="rounded-[24px] border border-border bg-slate-50 p-5 shadow-card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-medium text-heading">{booking.doctor_name}</div>
                    <div className="mt-1 text-sm text-muted">{booking.specialization}</div>
                  </div>
                  <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                    {booking.status}
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-muted">
                  <div className="flex items-center gap-2"><BuildingOffice2Icon className="h-4 w-4" /> {booking.hospital_name}</div>
                  <div className="flex items-center gap-2"><CalendarDaysIcon className="h-4 w-4" /> {formatDate(booking.appointment_date)} · {booking.time_slot}</div>
                  <div className="flex items-center gap-2"><CurrencyDollarIcon className="h-4 w-4" /> {formatCurrency(booking.consultation_fee)}</div>
                  <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getAppointmentTypeTone(booking.appointment_type)}`}>
                    {booking.appointment_type}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-card">
      <div className="text-xs uppercase tracking-[0.2em] text-muted">{label}</div>
      <div className="mt-2 font-medium text-heading">{value}</div>
    </div>
  );
}
