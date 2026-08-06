import { useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const doctors = [
  { id: 'dr-khan', name: 'Dr. Amina Khan', specialty: 'Cardiology', availableSlots: ['09:00', '10:30', '14:00'] },
  { id: 'dr-fatima', name: 'Dr. Sara Fatima', specialty: 'Neurology', availableSlots: ['08:30', '11:00', '15:30'] },
  { id: 'dr-hassan', name: 'Dr. Bilal Hassan', specialty: 'Orthopedics', availableSlots: ['09:30', '13:00', '16:00'] }
];

const initialForm = {
  doctorId: doctors[0].id,
  appointmentDate: '',
  appointmentTime: '',
  mode: 'in-person',
  notes: ''
};

function formatDate(dateValue) {
  if (!dateValue) {
    return '—';
  }

  const date = new Date(`${dateValue}T00:00:00`);
  return new Intl.DateTimeFormat('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function getMinDate() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export default function AppointmentsPage() {
  const [formData, setFormData] = useState(initialForm);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedDoctor, setSelectedDoctor] = useState(doctors[0]);

  const selectedDate = useMemo(() => formData.appointmentDate, [formData.appointmentDate]);
  const availableSlots = useMemo(() => {
    if (!selectedDoctor) {
      return [];
    }

    const booked = new Set(appointments
      .filter((entry) => entry.doctor_id === selectedDoctor.id && entry.appointment_date === selectedDate && entry.status === 'scheduled')
      .map((entry) => entry.appointment_time));

    return selectedDoctor.availableSlots.filter((slot) => !booked.has(slot));
  }, [appointments, selectedDate, selectedDoctor]);

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments`);
      if (!response.ok) {
        throw new Error('Unable to load appointments.');
      }

      const nextAppointments = await response.json();
      setAppointments(nextAppointments);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Unable to load appointments.' });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue = value;

    setFormData((current) => ({
      ...current,
      [name]: nextValue
    }));

    if (name === 'doctorId') {
      const doctor = doctors.find((entry) => entry.id === nextValue);
      setSelectedDoctor(doctor || doctors[0]);
      setFormData((current) => ({ ...current, appointmentTime: '' }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: formData.doctorId,
          doctor_name: selectedDoctor.name,
          specialty: selectedDoctor.specialty,
          appointment_date: formData.appointmentDate,
          appointment_time: formData.appointmentTime,
          mode: formData.mode,
          notes: formData.notes,
          user_email: 'patient@example.com'
        })
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.detail || 'Unable to book the appointment.');
      }

      const created = await response.json();
      setAppointments((current) => [created, ...current]);
      setFormData({ ...initialForm, doctorId: formData.doctorId });
      setMessage({ type: 'success', text: `Appointment booked with ${created.doctor_name} on ${formatDate(created.appointment_date)} at ${created.appointment_time}.` });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Booking failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, status) => {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Unable to update appointment.');
      }

      const updated = await response.json();
      setAppointments((current) => current.map((item) => (item.id === appointmentId ? updated : item)));
      setMessage({ type: 'success', text: `Appointment ${status === 'cancelled' ? 'cancelled' : 'updated'}.` });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Update failed.' });
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-primary">
              <CalendarDaysIcon className="h-4 w-4" />
              Book care with confidence
            </div>
            <h2 className="mt-4 text-3xl font-medium tracking-tight text-heading sm:text-4xl">Appointment scheduling</h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              Choose a specialist, a future date, and a confirmed slot. Only open slots remain visible to prevent double booking.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-slate-50 px-4 py-3 text-sm text-muted">
            <div className="font-medium text-heading">Need help?</div>
            <div className="mt-2">We highlight only available times and keep your booking record up to date.</div>
          </div>
        </div>
      </section>

      {message.text ? (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
          {message.text}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CalendarDaysIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-medium text-heading">Book an appointment</h3>
              <p className="text-sm text-muted">Select the doctor, date, and a time slot that is still open.</p>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm text-muted">
              <span className="mb-2 block font-medium text-heading">Doctor or specialist</span>
              <select
                name="doctorId"
                value={formData.doctorId}
                onChange={handleChange}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-heading outline-none focus:border-primary"
              >
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} · {doctor.specialty}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-muted">
                <span className="mb-2 block font-medium text-heading">Appointment date</span>
                <input
                  type="date"
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleChange}
                  min={getMinDate()}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-heading outline-none focus:border-primary"
                  required
                />
              </label>

              <label className="block text-sm text-muted">
                <span className="mb-2 block font-medium text-heading">Time slot</span>
                <select
                  name="appointmentTime"
                  value={formData.appointmentTime}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-heading outline-none focus:border-primary"
                  required
                  disabled={!formData.appointmentDate}
                >
                  <option value="">Choose a slot</option>
                  {availableSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-sm text-muted">
              <span className="mb-2 block font-medium text-heading">Visit mode</span>
              <select
                name="mode"
                value={formData.mode}
                onChange={handleChange}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-heading outline-none focus:border-primary"
              >
                <option value="in-person">In person</option>
                <option value="virtual">Virtual</option>
              </select>
            </label>

            <label className="block text-sm text-muted">
              <span className="mb-2 block font-medium text-heading">Notes</span>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Mention symptoms or reasons for the visit"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-heading outline-none focus:border-primary"
              />
            </label>

            {formData.appointmentDate && selectedDoctor && availableSlots.length === 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                No open slots are available for this doctor on the selected date. Please choose another day.
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading || !formData.appointmentDate || !formData.appointmentTime}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-white shadow-soft transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Booking...
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

        <section className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-medium text-heading">Upcoming appointments</h3>
              <p className="mt-2 text-sm text-muted">Track booked visits and update them as needed.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-medium text-heading">
              {appointments.filter((item) => item.status === 'scheduled').length} active
            </div>
          </div>

          {fetching ? (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-slate-50 px-4 py-4 text-sm text-muted">
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              Loading appointments...
            </div>
          ) : appointments.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-border bg-slate-50 p-6 text-sm text-muted">
              No appointments yet. Book one to get started.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {appointments.map((appointment) => (
                <article key={appointment.id} className="rounded-[24px] border border-border p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-medium text-heading">{appointment.doctor_name}</div>
                      <div className="mt-1 text-sm text-muted">{appointment.specialty}</div>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-sm font-medium ${appointment.status === 'cancelled' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {appointment.status}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm text-muted">
                      <div className="flex items-center gap-2 font-medium text-heading">
                        <CalendarDaysIcon className="h-4 w-4" />
                        {formatDate(appointment.appointment_date)}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <ClockIcon className="h-4 w-4" />
                        {appointment.appointment_time}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm text-muted">
                      <div className="font-medium text-heading">Mode</div>
                      <div className="mt-2">{appointment.mode}</div>
                      <div className="mt-2">Fee estimate: {formatCurrency(appointment.mode === 'virtual' ? 2500 : 5000)}</div>
                    </div>
                  </div>

                  {appointment.notes ? <div className="mt-4 text-sm text-muted">Notes: {appointment.notes}</div> : null}

                  {appointment.status === 'scheduled' ? (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                        className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
                      >
                        <XCircleIcon className="h-4 w-4" />
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(appointment.id, 'scheduled')}
                        className="inline-flex items-center gap-2 rounded-2xl border border-border bg-white px-3 py-2 text-sm font-medium text-heading"
                      >
                        <ExclamationCircleIcon className="h-4 w-4" />
                        Keep as scheduled
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
