import { useEffect, useMemo, useState } from 'react';
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

import doctorIllustration from '../assets/illustrations/doctor.svg';
import nurseIllustration from '../assets/illustrations/nurse.svg';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const defaultHospitals = [
  {
    name: 'City Care Hospital',
    address: 'Main Boulevard, Lahore',
    rating: 4.8,
    style: 'Specialty',
    distance_km: 2.1
  },
  {
    name: 'Sunrise Clinic',
    address: 'DHA Phase 6, Lahore',
    rating: 4.6,
    style: 'Community',
    distance_km: 4.7
  },
  {
    name: 'Teal Medical Center',
    address: 'Gulberg III, Lahore',
    rating: 4.7,
    style: 'Academic',
    distance_km: 6.2
  }
];

const defaultDoctors = [
  {
    id: 'dr-amina-khan',
    name: 'Dr. Amina Khan',
    specialization: 'Cardiology',
    hospital_name: 'City Care Hospital',
    consultation_fee: 3500,
    available_days: ['Mon', 'Wed', 'Fri'],
    time_slots: ['09:00 AM', '10:30 AM', '02:00 PM']
  },
  {
    id: 'dr-sara-fatima',
    name: 'Dr. Sara Fatima',
    specialization: 'Neurology',
    hospital_name: 'Teal Medical Center',
    consultation_fee: 4200,
    available_days: ['Tue', 'Thu', 'Sat'],
    time_slots: ['08:30 AM', '11:00 AM', '03:30 PM']
  },
  {
    id: 'dr-bilal-hassan',
    name: 'Dr. Bilal Hassan',
    specialization: 'Orthopedics',
    hospital_name: 'Sunrise Clinic',
    consultation_fee: 3000,
    available_days: ['Mon', 'Thu', 'Sun'],
    time_slots: ['09:30 AM', '01:00 PM', '04:00 PM']
  }
];

const emptyForm = {
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
  const [hospitals, setHospitals] = useState(defaultHospitals);
  const [doctors, setDoctors] = useState(defaultDoctors);
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [bookings, setBookings] = useState([]);
  const [fetchingBookings, setFetchingBookings] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [successBooking, setSuccessBooking] = useState(null);

  useEffect(() => {
    const pendingSelection = window.history.state?.usr?.appointmentSelection || null;
    if (!pendingSelection) return;

    const hospital = pendingSelection.hospital_name || pendingSelection.hospitalName;
    const doctor = pendingSelection.doctor_name || pendingSelection.doctorName;
    const fee = pendingSelection.consultation_fee || pendingSelection.consultationFee;
    const specialization = pendingSelection.specialization || pendingSelection.specialty || '';

    if (hospital && doctor) {
      const matchedHospital = defaultHospitals.find((item) => item.name === hospital) || null;
      const matchedDoctor = defaultDoctors.find((item) => item.name === doctor) || null;
      setSelectedHospital(matchedHospital);
      setSelectedDoctor(matchedDoctor);
      setFormData((current) => ({
        ...current,
        hospital_name: hospital,
        doctor_name: doctor,
        specialization,
        consultation_fee: fee || matchedDoctor?.consultation_fee || '',
      }));
    }
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/appointments/my-appointments`)
      .then((response) => response.json())
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setBookings([]))
      .finally(() => setFetchingBookings(false));
  }, []);

  const filteredHospitals = useMemo(() => {
    const query = hospitalSearch.trim().toLowerCase();
    if (!query) return hospitals;
    return hospitals.filter((hospital) =>
      [hospital.name, hospital.address, hospital.style].some((value) => value.toLowerCase().includes(query))
    );
  }, [hospitalSearch, hospitals]);

  const filteredDoctors = useMemo(() => {
    const query = doctorSearch.trim().toLowerCase();
    return doctors.filter((doctor) => {
      const matchesSearch = !query || [doctor.name, doctor.specialization, doctor.hospital_name].some((value) => value.toLowerCase().includes(query));
      const matchesHospital = !selectedHospital || doctor.hospital_name === selectedHospital.name;
      return matchesSearch && matchesHospital;
    });
  }, [doctorSearch, doctors, selectedHospital]);

  const availableSlots = useMemo(() => {
    if (!selectedDoctor) return [];
    return selectedDoctor.time_slots;
  }, [selectedDoctor]);

  const selectedDay = useMemo(() => getDayLabel(formData.appointment_date), [formData.appointment_date]);

  const handleHospitalPick = (hospital) => {
    setSelectedHospital(hospital);
    setFormData((current) => ({
      ...current,
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
      hospital_name: doctor.hospital_name,
      doctor_name: doctor.name,
      specialization: doctor.specialization,
      consultation_fee: doctor.consultation_fee,
      time_slot: ''
    }));
    const hospital = hospitals.find((item) => item.name === doctor.hospital_name) || null;
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
          hospital_name: formData.hospital_name,
          doctor_name: formData.doctor_name,
          specialization: formData.specialization,
          consultation_fee: Number(formData.consultation_fee) || 0,
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
      <section className="grid gap-8 rounded-[32px] border border-border bg-white p-6 shadow-card lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <div className="flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-tealSoft px-4 py-2 text-sm font-medium text-primary">
            <CalendarDaysIcon className="h-4 w-4" />
            Appointments
          </div>
          <h1 className="mt-5 max-w-2xl text-4xl font-medium tracking-tight text-heading sm:text-5xl">
            Book your appointment
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
            Pick a hospital, a doctor, and a time that works for you. Confirm the visit in a single flow with a clear summary and a warm booking confirmation.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-slate-50 px-4 py-4">
              <div className="text-sm font-medium text-heading">PKR pricing</div>
              <div className="mt-1 text-sm text-muted">Consultation fees are shown in local currency.</div>
            </div>
            <div className="rounded-2xl border border-border bg-slate-50 px-4 py-4">
              <div className="text-sm font-medium text-heading">Warm confirmation</div>
              <div className="mt-1 text-sm text-muted">Gemini message or a static fallback.</div>
            </div>
            <div className="rounded-2xl border border-border bg-slate-50 px-4 py-4">
              <div className="text-sm font-medium text-heading">Session bookings</div>
              <div className="mt-1 text-sm text-muted">My Appointments updates instantly.</div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center rounded-[28px] border border-border bg-gradient-to-br from-teal-50 to-slate-50 p-4">
          <img src={doctorIllustration} alt="Doctor illustration" className="max-h-[360px] w-full object-contain" />
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

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-6 rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
          <div>
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Choose hospital</div>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-slate-50 px-4 py-3">
              <MagnifyingGlassIcon className="h-4 w-4 text-muted" />
              <input
                value={hospitalSearch}
                onChange={(event) => setHospitalSearch(event.target.value)}
                placeholder="Search hospitals"
                className="w-full bg-transparent text-sm text-heading outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4">
            {filteredHospitals.map((hospital) => (
              <button
                key={hospital.name}
                type="button"
                onClick={() => handleHospitalPick(hospital)}
                className={`rounded-[24px] border p-5 text-left transition ${selectedHospital?.name === hospital.name ? 'border-primary bg-primary/5 shadow-card' : 'border-border bg-white hover:border-primary/40'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-muted">
                      <BuildingOffice2Icon className="h-3.5 w-3.5" />
                      {hospital.style}
                    </div>
                    <div className="mt-3 text-lg font-medium text-heading">{hospital.name}</div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted">
                      <MapPinIcon className="h-4 w-4" />
                      {hospital.address}
                    </div>
                  </div>
                  <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">{hospital.rating}</div>
                </div>
              </button>
            ))}
          </div>

          <div>
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Choose doctor</div>
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
                  onChange={(event) => setFormData((current) => ({ ...current, appointment_date: event.target.value }))}
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
                  disabled={!selectedDoctor}
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
              disabled={bookingLoading || !formData.hospital_name || !formData.doctor_name || !formData.appointment_date || !formData.time_slot}
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
            <img src={nurseIllustration} alt="Nurse illustration" className="max-h-[320px] w-full object-contain" />
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
