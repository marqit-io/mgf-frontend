import { createContext, useReducer, useState, useEffect, useCallback } from 'react';
import { TokenState, TokenUpdate } from '../types/token';

interface TokenContextType {
  state: TokenState;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
}

const initialState: TokenState = {
  tokens: {},
  isLoading: false,
  error: null,
  lastUpdated: null,
};

type TokenAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'UPDATE_TOKEN'; payload: TokenUpdate }
  | { type: 'CLEAR_TOKENS' };

function tokenReducer(state: TokenState, action: TokenAction): TokenState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'UPDATE_TOKEN':
      switch (action.payload.type) {
        case 'ADD':
        case 'UPDATE':
          return {
            ...state,
            tokens: {
              ...state.tokens,
              [action.payload.data.id]: action.payload.data,
            },
            lastUpdated: new Date(),
          };
        case 'REMOVE':
          const { [action.payload.data.id]: _, ...remainingTokens } = state.tokens;
          return {
            ...state,
            tokens: remainingTokens,
            lastUpdated: new Date(),
          };
        default:
          return state;
      }
    case 'CLEAR_TOKENS':
      return { ...initialState };
    default:
      return state;
  }
}

const TokenContext = createContext<TokenContextType | null>(null);

export function TokenProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(tokenReducer, initialState);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const connect = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // This will be replaced by the actual WebSocket connection
      // provided by the backend developer
      const ws = new WebSocket('wss://api.example.com/tokens');

      ws.onmessage = (event) => {
        const update: TokenUpdate = JSON.parse(event.data);
        dispatch({ type: 'UPDATE_TOKEN', payload: update });
      };

      ws.onerror = () => {
        dispatch({ type: 'SET_ERROR', payload: 'WebSocket error occurred' });
      };

      setSocket(ws);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to connect to token feed' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
      dispatch({ type: 'CLEAR_TOKENS' });
    }
  }, [socket]);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  return (
    <TokenContext.Provider
      value={{
        state,
        connect,
        disconnect,
        isConnected: socket !== null && socket.readyState === WebSocket.OPEN,
      }}
    >
      {children}
    </TokenContext.Provider>
  );
}

export { TokenContext }