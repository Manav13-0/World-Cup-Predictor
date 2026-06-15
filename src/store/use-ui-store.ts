import { create } from "zustand";

type UiStore = {
  matchStatusFilter: string;
  setMatchStatusFilter: (status: string) => void;
};

export const useUiStore = create<UiStore>((set) => ({
  matchStatusFilter: "ALL",
  setMatchStatusFilter: (matchStatusFilter) => set({ matchStatusFilter })
}));
