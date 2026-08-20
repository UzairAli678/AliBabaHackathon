import { create } from 'zustand';

const initialCareState = {
  latestCareContext: null,
  selectedHospital: null,
  appointmentSelection: null,
  diseasePredictionSession: { selectedSymptoms: [], result: null },
  healthAssessmentSession: { answers: {}, result: null },
  lastBookedAppointment: null
};

const useCareContext = create(
  (set) => ({
    ...initialCareState,
    setLatestCareContext: (latestCareContext) => set({ latestCareContext }),
    clearLatestCareContext: () => set({ latestCareContext: null }),
    setSelectedHospital: (selectedHospital) => set({ selectedHospital }),
    clearSelectedHospital: () => set({ selectedHospital: null }),
    setAppointmentSelection: (appointmentSelection) => set({ appointmentSelection }),
    clearAppointmentSelection: () => set({ appointmentSelection: null }),
    setDiseasePredictionSession: (diseasePredictionSession) => set({ diseasePredictionSession }),
    clearDiseasePredictionSession: () => set({ diseasePredictionSession: { selectedSymptoms: [], result: null } }),
    setHealthAssessmentSession: (healthAssessmentSession) => set({ healthAssessmentSession }),
    clearHealthAssessmentSession: () => set({ healthAssessmentSession: { answers: {}, result: null } }),
    setLastBookedAppointment: (lastBookedAppointment) => set({ lastBookedAppointment }),
    clearCareHistory: () => set(initialCareState)
  })
);

export default useCareContext;
