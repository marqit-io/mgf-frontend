import { createContext, useContext, useReducer, useCallback } from 'react';
import { TokenSearchResult, SearchState } from '../types/token';
import axios from 'axios';

interface SearchContextType {
  state: SearchState;
  search: (query: string) => Promise<void>;
  clearSearch: () => void;
}

const initialState: SearchState = {
  query: '',
  results: [],
  isLoading: false,
  error: null
};

type SearchAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_RESULTS'; payload: { query: string; results: TokenSearchResult[] } }
  | { type: 'CLEAR_SEARCH' };

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_RESULTS':
      return {
        ...state,
        query: action.payload.query,
        results: action.payload.results,
        isLoading: false,
        error: null
      };
    case 'CLEAR_SEARCH':
      return initialState;
    default:
      return state;
  }
}

const SearchContext = createContext<SearchContextType | null>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(searchReducer, initialState);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      dispatch({ type: 'CLEAR_SEARCH' });
      return;
    }

    console.log(query);

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await axios.get(`https://api.moneyglitch.fun/v1/tokens/search?query=${query}`);
      console.log('After API call, response:', response);

      if (!response.data) {
        console.log('No response data');
        throw new Error('Search failed');
      }

      // Transform the response data to include only required fields
      const results: TokenSearchResult[] = response.data.map((token: any) => ({
        name: token.name,
        symbol: token.symbol,
        address: token.mint // assuming 'mint' is the field name for address
      }));

      console.log('Results:', results);

      dispatch({
        type: 'SET_RESULTS',
        payload: { query, results }
      });
    } catch (error) {
      console.log('Error caught:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Search failed'
      });
    }
  }, []);

  const clearSearch = useCallback(() => {
    dispatch({ type: 'CLEAR_SEARCH' });
  }, []);

  return (
    <SearchContext.Provider value={{ state, search, clearSearch }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}