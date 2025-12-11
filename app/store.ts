import { create } from 'zustand'
import { PhaseId } from './models/types';


interface AppState{
    activePhase: PhaseId;
    setActivePhase: (phaseId: PhaseId) => void

  

}

export const useAppState = create<AppState>((set) => ({
    activePhase: 'discovery',
    setActivePhase: (phaseId) => set({activePhase: phaseId}),

}));