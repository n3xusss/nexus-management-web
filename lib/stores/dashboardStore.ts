import { create } from 'zustand';

interface DashboardStore {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  activeSection: 'dashboard', // Default section
  setActiveSection: (section) => set({ activeSection: section }),
}));