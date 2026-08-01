import { create } from "zustand";

const useAppStore = create((set) => ({
  userProfile: null,
  latestAssessment: null,
  setUserProfile: (userProfile) => set({ userProfile }),
  setLatestAssessment: (latestAssessment) => set({ latestAssessment })
}));

export default useAppStore;
