import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import {
  getProspects,
  getProspectById,
  searchProspects,
  getCalibratedProspects,
  upsertProspects,
} from '../services/database';
import type { Prospect } from '../types';

interface ProspectState {
  prospects: Prospect[];
  filteredProspects: Prospect[];
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
}

type ProspectAction =
  | { type: 'SET_PROSPECTS'; payload: Prospect[] }
  | { type: 'SET_FILTERED_PROSPECTS'; payload: Prospect[] }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: ProspectState = {
  prospects: [],
  filteredProspects: [],
  searchQuery: '',
  isLoading: false,
  error: null,
};

function prospectReducer(state: ProspectState, action: ProspectAction): ProspectState {
  switch (action.type) {
    case 'SET_PROSPECTS':
      return { ...state, prospects: action.payload, filteredProspects: action.payload };
    case 'SET_FILTERED_PROSPECTS':
      return { ...state, filteredProspects: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

interface ProspectContextType extends ProspectState {
  loadProspects: () => Promise<void>;
  searchProspectsAction: (query: string) => Promise<void>;
  getCalibratedList: () => Promise<Prospect[]>;
  getProspect: (id: string) => Promise<Prospect | null>;
  updateProspectsFromServer: (prospects: Prospect[]) => Promise<void>;
  clearError: () => void;
}

const ProspectContext = createContext<ProspectContextType | undefined>(undefined);

export function ProspectProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(prospectReducer, initialState);

  const loadProspects = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const prospects = await getProspects();
      dispatch({ type: 'SET_PROSPECTS', payload: prospects });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const searchProspectsAction = useCallback(async (query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
    if (!query.trim()) {
      dispatch({ type: 'SET_FILTERED_PROSPECTS', payload: state.prospects });
      return;
    }
    try {
      const results = await searchProspects(query);
      dispatch({ type: 'SET_FILTERED_PROSPECTS', payload: results });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [state.prospects]);

  const getCalibratedList = useCallback(async (): Promise<Prospect[]> => {
    return getCalibratedProspects();
  }, []);

  const getProspect = useCallback(async (id: string): Promise<Prospect | null> => {
    return getProspectById(id);
  }, []);

  const updateProspectsFromServer = useCallback(async (prospects: Prospect[]) => {
    try {
      await upsertProspects(prospects);
      dispatch({ type: 'SET_PROSPECTS', payload: prospects });
      dispatch({ type: 'SET_FILTERED_PROSPECTS', payload: prospects });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      loadProspects,
      searchProspectsAction,
      getCalibratedList,
      getProspect,
      updateProspectsFromServer,
      clearError,
    }),
    [
      state,
      loadProspects,
      searchProspectsAction,
      getCalibratedList,
      getProspect,
      updateProspectsFromServer,
      clearError,
    ],
  );

  return <ProspectContext.Provider value={value}>{children}</ProspectContext.Provider>;
}

export function useProspect(): ProspectContextType {
  const context = useContext(ProspectContext);
  if (!context) {
    throw new Error('useProspect must be used within a ProspectProvider');
  }
  return context;
}
