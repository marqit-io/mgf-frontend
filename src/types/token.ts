export interface TokenData {
  id: string;
  name: string;
  symbol: string;
  price: number;
  priceChange24h: number;
  holders: number;
  revenue: number;
  allocation: {
    total: number;
    format: string;
  };
  share: number;
  monthlyRevenue: number;
  marketCap: number;
  volume24h: number;
  lastUpdated: Date;
  address: string;
  poolAddress?: string;
  image?: string;
  tax?: {
    enabled: boolean;
    total: number;
    distribution: {
      burn: number;
      reward: number;
    };
  };
}

export interface TokenSearchResult {
  name: string;
  symbol: string;
  address: string;
}

export interface TokenUpdate {
  type: 'ADD' | 'UPDATE' | 'REMOVE';
  data: TokenData;
}

export interface TokenState {
  tokens: Record<string, TokenData>;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface SearchState {
  query: string;
  results: TokenSearchResult[];
  isLoading: boolean;
  error: string | null;
}

export interface LiveFeedItem {
  id: string;
  timestamp: string;
  name: string;
  symbol: string;
  image: string;
  creator: string;
  tax: {
    enabled: boolean;
    total: number;
    distribution: {
      burn: number;
      reward: number;
    };
  };
}