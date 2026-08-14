import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCareContext = create(persist(
  (set) => ({
    latestCareContext: null,
    selectedHospital: null,
    appointmentSelection: null,
    diseasePredictionSession: { selectedSymptoms: [], result: null },
    setLatestCareContext: (latestCareContext) => set({ latestCareContext }),
    clearLatestCareContext: () => set({ latestCareContext: null }),
    setSelectedHospital: (selectedHospital) => set({ selectedHospital }),
    clearSelectedHospital: () => set({ selectedHospital: null }),
    setAppointmentSelection: (appointmentSelection) => set({ appointmentSelection }),
    clearAppointmentSelection: () => set({ appointmentSelection: null }),
    setDiseasePredictionSession: (diseasePredictionSession) => set({ diseasePredictionSession }),
    clearDiseasePredictionSession: () => set({ diseasePredictionSession: { selectedSymptoms: [], result: null } })
  }),
  { name: 'careledger-latest-care-context', storage: { getItem: (name) => JSON.parse(sessionStorage.getItem(name)), setItem: (name, value) => sessionStorage.setItem(name, JSON.stringify(value)), removeItem: (name) => sessionStorage.removeItem(name) } }
));

export default useCareContext;
