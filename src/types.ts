export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  imageUrl: string;
  tags: string[];
}

export interface UserPersona {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  preferredCategories: string[];
}

export interface Rating {
  userId: string;
  productId: string;
  rating: number; // 1 to 5
  timestamp: number;
}

export interface Interaction {
  id: string;
  userId: string;
  productId: string;
  type: 'view' | 'click' | 'cart' | 'purchase';
  timestamp: number;
}

// Result of recommendations
export interface RecommendationResult {
  product: Product;
  score: number;
  reasons: {
    collaborativeScore: number;
    contentScore: number;
    explanation: string;
  };
}

// SVD latent state
export interface SVDModel {
  userFactors: Record<string, number[]>; // userId -> number[]
  itemFactors: Record<string, number[]>; // productId -> number[]
  userBiases: Record<string, number>;
  itemBiases: Record<string, number>;
  globalMean: number;
  latentDimension: number;
  mseHistory: number[];
  currentEpoch: number;
}

// Similarity maps
export type SimilarityMatrix = Record<string, Record<string, number>>;
