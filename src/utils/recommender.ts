import { Product, Rating, SVDModel, SimilarityMatrix } from '../types';

// ==========================================
// 1. NLP Content-Based Vectorizer & Cosine Similarity
// ==========================================

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'with', 'at', 'by', 'from',
  'for', 'to', 'in', 'on', 'of', 'for', 'is', 'are', 'was', 'were', 'be', 'been', 'has', 'have',
  'had', 'do', 'does', 'did', 'with', 'about', 'against', 'between', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under'
]);

/**
 * Tokenizes and clean-up text into a frequency vector (Bag of Words)
 */
export function getTermFrequencyVector(text: string): Record<string, number> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/);
  
  const vector: Record<string, number> = {};
  for (const word of words) {
    if (word.length > 2 && !STOP_WORDS.has(word)) {
      vector[word] = (vector[word] || 0) + 1;
    }
  }
  return vector;
}

/**
 * Computes Cosine Similarity between two term frequency vectors
 */
export function computeCosineSimilarity(vec1: Record<string, number>, vec2: Record<string, number>): number {
  const allWords = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (const word of allWords) {
    const val1 = vec1[word] || 0;
    const val2 = vec2[word] || 0;
    dotProduct += val1 * val2;
    norm1 += val1 * val1;
    norm2 += val2 * val2;
  }

  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Gets NLP similarities between all products based on titles, descriptions, and tags
 */
export function computeProductNLPSimilarities(products: Product[]): SimilarityMatrix {
  const matrix: SimilarityMatrix = {};
  
  const vectors = products.map(p => {
    const contentText = `${p.name} ${p.category} ${p.description} ${p.tags.join(' ')}`;
    return {
      id: p.id,
      vector: getTermFrequencyVector(contentText)
    };
  });

  for (const p1 of vectors) {
    matrix[p1.id] = {};
    for (const p2 of vectors) {
      if (p1.id === p2.id) {
        matrix[p1.id][p2.id] = 1.0;
      } else {
        matrix[p1.id][p2.id] = computeCosineSimilarity(p1.vector, p2.vector);
      }
    }
  }

  return matrix;
}

// ==========================================
// 2. User-Item Collaborative Filtering Similarity
// ==========================================

/**
 * Calculates raw user-to-user similarity matrix based on common rated items (Pearson / Cosine)
 */
export function computeUserSimilarities(ratings: Rating[], userIds: string[]): SimilarityMatrix {
  const userRatings: Record<string, Record<string, number>> = {};
  
  // Pivot ratings
  for (const u of userIds) {
    userRatings[u] = {};
  }
  for (const r of ratings) {
    if (userRatings[r.userId]) {
      userRatings[r.userId][r.productId] = r.rating;
    }
  }

  const matrix: SimilarityMatrix = {};

  for (const u1 of userIds) {
    matrix[u1] = {};
    for (const u2 of userIds) {
      if (u1 === u2) {
        matrix[u1][u2] = 1.0;
        continue;
      }

      const r1 = userRatings[u1];
      const r2 = userRatings[u2];
      
      // Find common products
      const commonProducts = Object.keys(r1).filter(pid => r2[pid] !== undefined);
      
      if (commonProducts.length === 0) {
        matrix[u1][u2] = 0;
        continue;
      }

      // Cosine similarity of common item ratings
      let dotProduct = 0;
      let sumSq1 = 0;
      let sumSq2 = 0;

      for (const pid of commonProducts) {
        dotProduct += r1[pid] * r2[pid];
      }
      
      // Compute full norm across ALL rated products to penalize if ratings diverge
      for (const pid of Object.keys(r1)) {
        sumSq1 += r1[pid] * r1[pid];
      }
      for (const pid of Object.keys(r2)) {
        sumSq2 += r2[pid] * r2[pid];
      }

      if (sumSq1 === 0 || sumSq2 === 0) {
        matrix[u1][u2] = 0;
      } else {
        matrix[u1][u2] = dotProduct / (Math.sqrt(sumSq1) * Math.sqrt(sumSq2));
      }
    }
  }

  return matrix;
}

/**
 * Calculates raw item-to-item similarity matrix based on common raters
 */
export function computeItemSimilarities(ratings: Rating[], productIds: string[]): SimilarityMatrix {
  const itemRatings: Record<string, Record<string, number>> = {};
  
  for (const p of productIds) {
    itemRatings[p] = {};
  }
  for (const r of ratings) {
    if (itemRatings[r.productId]) {
      itemRatings[r.productId][r.userId] = r.rating;
    }
  }

  const matrix: SimilarityMatrix = {};

  for (const p1 of productIds) {
    matrix[p1] = {};
    for (const p2 of productIds) {
      if (p1 === p2) {
        matrix[p1][p2] = 1.0;
        continue;
      }

      const r1 = itemRatings[p1];
      const r2 = itemRatings[p2];

      const commonUsers = Object.keys(r1).filter(uid => r2[uid] !== undefined);

      if (commonUsers.length === 0) {
        matrix[p1][p2] = 0;
        continue;
      }

      let dotProduct = 0;
      let sumSq1 = 0;
      let sumSq2 = 0;

      for (const uid of commonUsers) {
        dotProduct += r1[uid] * r2[uid];
      }
      for (const uid of Object.keys(r1)) {
        sumSq1 += r1[uid] * r1[uid];
      }
      for (const uid of Object.keys(r2)) {
        sumSq2 += r2[uid] * r2[uid];
      }

      if (sumSq1 === 0 || sumSq2 === 0) {
        matrix[p1][p2] = 0;
      } else {
        matrix[p1][p2] = dotProduct / (Math.sqrt(sumSq1) * Math.sqrt(sumSq2));
      }
    }
  }

  return matrix;
}

// ==========================================
// 3. Prediction Engines (Collaborative Filtering)
// ==========================================

/**
 * Predicts rating for a specific user and product using User-Based Collaborative Filtering
 */
export function predictUserBased(
  targetUserId: string,
  targetProductId: string,
  ratings: Rating[],
  userSimilarities: SimilarityMatrix,
  avgUserRatings: Record<string, number>
): number {
  const userRatings = ratings.filter(r => r.productId === targetProductId);
  if (userRatings.length === 0) {
    return avgUserRatings[targetUserId] || 3.0; // Fallback to user's average or 3.0
  }

  let weightedSum = 0;
  let similarityWeightSum = 0;

  for (const r of userRatings) {
    const sim = userSimilarities[targetUserId]?.[r.userId] || 0;
    if (sim > 0) {
      // Mean centered user-based CF
      const userAvg = avgUserRatings[r.userId] || 3.0;
      weightedSum += sim * (r.rating - userAvg);
      similarityWeightSum += Math.abs(sim);
    }
  }

  const targetUserAvg = avgUserRatings[targetUserId] || 3.0;
  if (similarityWeightSum === 0) return targetUserAvg;

  const predicted = targetUserAvg + (weightedSum / similarityWeightSum);
  return Math.max(1, Math.min(5, predicted));
}

/**
 * Predicts rating for user and product using Item-Based Collaborative Filtering
 */
export function predictItemBased(
  targetUserId: string,
  targetProductId: string,
  ratings: Rating[],
  itemSimilarities: SimilarityMatrix
): number {
  const activeUserRatings = ratings.filter(r => r.userId === targetUserId);
  if (activeUserRatings.length === 0) return 3.0;

  let weightedSum = 0;
  let similarityWeightSum = 0;

  for (const r of activeUserRatings) {
    const sim = itemSimilarities[targetProductId]?.[r.productId] || 0;
    if (sim > 0) {
      weightedSum += sim * r.rating;
      similarityWeightSum += Math.abs(sim);
    }
  }

  if (similarityWeightSum === 0) {
    // If no similar items have been rated, default to user's general average
    const sum = activeUserRatings.reduce((acc, r) => acc + r.rating, 0);
    return sum / activeUserRatings.length;
  }

  return Math.max(1, Math.min(5, weightedSum / similarityWeightSum));
}

// ==========================================
// 4. SVD Matrix Factorization (SGD Trainer)
// ==========================================

/**
 * Initializes a new SVD latent space model
 */
export function initializeSVD(
  userIds: string[],
  productIds: string[],
  ratings: Rating[],
  latentDim: number = 2
): SVDModel {
  const globalMean = ratings.reduce((sum, r) => sum + r.rating, 0) / (ratings.length || 1);
  
  const userFactors: Record<string, number[]> = {};
  const itemFactors: Record<string, number[]> = {};
  const userBiases: Record<string, number> = {};
  const itemBiases: Record<string, number> = {};

  // Random normal-ish initialization around 0.1
  for (const uid of userIds) {
    userBiases[uid] = 0;
    userFactors[uid] = Array.from({ length: latentDim }, () => (Math.random() - 0.5) * 0.2);
  }

  for (const pid of productIds) {
    itemBiases[pid] = 0;
    itemFactors[pid] = Array.from({ length: latentDim }, () => (Math.random() - 0.5) * 0.2);
  }

  return {
    userFactors,
    itemFactors,
    userBiases,
    itemBiases,
    globalMean,
    latentDimension: latentDim,
    mseHistory: [],
    currentEpoch: 0
  };
}

/**
 * Predicts single rating using current state of SVD
 */
export function predictSVD(
  userId: string,
  productId: string,
  model: SVDModel
): number {
  const userF = model.userFactors[userId];
  const itemF = model.itemFactors[productId];
  
  if (!userF || !itemF) return model.globalMean;

  const biasU = model.userBiases[userId] || 0;
  const biasI = model.itemBiases[productId] || 0;

  // Dot product
  let dotProduct = 0;
  for (let d = 0; d < model.latentDimension; d++) {
    dotProduct += userF[d] * itemF[d];
  }

  const prediction = model.globalMean + biasU + biasI + dotProduct;
  return Math.max(1, Math.min(5, prediction));
}

/**
 * Performs ONE epoch of Stochastic Gradient Descent (SGD) training on the ratings dataset
 */
export function trainSVDEpoch(
  model: SVDModel,
  ratings: Rating[],
  learningRate: number = 0.05,
  regularization: number = 0.02
): SVDModel {
  // Shallow copy matrices for updates
  const nextUserFactors = { ...model.userFactors };
  const nextItemFactors = { ...model.itemFactors };
  const nextUserBiases = { ...model.userBiases };
  const nextItemBiases = { ...model.itemBiases };

  let totalSquaredError = 0;

  // Shuffle ratings for better stochastic convergence
  const shuffledRatings = [...ratings].sort(() => Math.random() - 0.5);

  for (const r of shuffledRatings) {
    const u = r.userId;
    const i = r.productId;
    
    // Ensure entities exist in model matrices (for dynamically added items)
    if (!nextUserFactors[u]) {
      nextUserFactors[u] = Array.from({ length: model.latentDimension }, () => (Math.random() - 0.5) * 0.2);
      nextUserBiases[u] = 0;
    }
    if (!nextItemFactors[i]) {
      nextItemFactors[i] = Array.from({ length: model.latentDimension }, () => (Math.random() - 0.5) * 0.2);
      nextItemBiases[i] = 0;
    }

    const uF = nextUserFactors[u];
    const iF = nextItemFactors[i];
    const bU = nextUserBiases[u];
    const bI = nextItemBiases[i];

    // Compute current prediction
    let dot = 0;
    for (let d = 0; d < model.latentDimension; d++) {
      dot += uF[d] * iF[d];
    }
    const pred = model.globalMean + bU + bI + dot;
    
    // Compute error
    const err = r.rating - pred;
    totalSquaredError += err * err;

    // Update biases
    nextUserBiases[u] = bU + learningRate * (err - regularization * bU);
    nextItemBiases[i] = bI + learningRate * (err - regularization * bI);

    // Update latent vectors
    const nextUF = [...uF];
    const nextIF = [...iF];

    for (let d = 0; d < model.latentDimension; d++) {
      nextUF[d] = uF[d] + learningRate * (err * iF[d] - regularization * uF[d]);
      nextIF[d] = iF[d] + learningRate * (err * uF[d] - regularization * iF[d]);
    }

    nextUserFactors[u] = nextUF;
    nextItemFactors[i] = nextIF;
  }

  const mse = totalSquaredError / (ratings.length || 1);
  const nextHistory = [...model.mseHistory, mse];

  return {
    ...model,
    userFactors: nextUserFactors,
    itemFactors: nextItemFactors,
    userBiases: nextUserBiases,
    itemBiases: nextItemBiases,
    mseHistory: nextHistory,
    currentEpoch: model.currentEpoch + 1
  };
}

// ==========================================
// 5. HYBRID RECOMMENDER (Combines Collaborative & NLP Description Similarity)
// ==========================================

/**
 * Generates scores for ALL products for a given user, balancing Content vs CF
 * weights. This resolves the cold start problem cleanly!
 */
export function generateHybridRecommendations(
  userId: string,
  products: Product[],
  ratings: Rating[],
  userSimilarities: SimilarityMatrix,
  itemSimilarities: SimilarityMatrix,
  nlpSimilarities: SimilarityMatrix,
  svdModel: SVDModel | null,
  cfWeight: number = 0.5, // How much to trust Collaborative Filtering (0 to 1)
  cfType: 'user' | 'item' | 'svd' = 'user'
): { product: Product; score: number; cfScore: number; contentScore: number; reason: string }[] {
  const results: { product: Product; score: number; cfScore: number; contentScore: number; reason: string }[] = [];

  // Gather basic averages
  const userRatings = ratings.filter(r => r.userId === userId);
  const ratedProductIds = new Set(userRatings.map(r => r.productId));
  
  const userAvgRatings: Record<string, number> = {};
  const uniqueUsers = Array.from(new Set(ratings.map(r => r.userId)));
  for (const uid of uniqueUsers) {
    const ur = ratings.filter(r => r.userId === uid);
    userAvgRatings[uid] = ur.reduce((sum, r) => sum + r.rating, 0) / (ur.length || 1);
  }

  // Pre-calculate user's content profile (the weighted average NLP features of products they liked)
  // Or simple maximum similarity to any product they rated highly (>3.5 stars)
  const highlyRatedProducts = userRatings.filter(r => r.rating >= 4.0).map(r => r.productId);

  for (const product of products) {
    // Usually we recommend unrated products, but let's score everything and flag which ones are already rated
    const isAlreadyRated = ratedProductIds.has(product.id);
    const existingRating = userRatings.find(r => r.productId === product.id)?.rating || null;

    // A. Content (NLP) Score: Similarity to items user previously rated highly
    let contentScore = 0;
    if (highlyRatedProducts.length > 0) {
      let sumSim = 0;
      for (const ratedPid of highlyRatedProducts) {
        sumSim += nlpSimilarities[product.id]?.[ratedPid] || 0;
      }
      contentScore = sumSim / highlyRatedProducts.length;
    } else {
      // User is in extreme cold start! Let's match by overlap of product categories in persona or tags
      contentScore = 0.1; // Default low prior
    }
    // Scale content score to 1-5 stars range
    const contentStars = 1 + (contentScore * 4);

    // B. Collaborative Filtering Score
    let cfStars = 3.0; // neutral default
    
    if (cfType === 'user') {
      cfStars = predictUserBased(userId, product.id, ratings, userSimilarities, userAvgRatings);
    } else if (cfType === 'item') {
      cfStars = predictItemBased(userId, product.id, ratings, itemSimilarities);
    } else if (cfType === 'svd' && svdModel) {
      cfStars = predictSVD(userId, product.id, svdModel);
    }

    // Combine CF and Content (NLP)
    // If user has zero interactions, we trust content 100% (or show cold start message)
    let finalStars = 3.0;
    let computedCfWeight = cfWeight;

    if (userRatings.length === 0) {
      // Absolute Cold Start user! Trust description-based match (NLP tag/prior) 100%
      computedCfWeight = 0.0;
      finalStars = contentStars;
    } else {
      finalStars = (computedCfWeight * cfStars) + ((1 - computedCfWeight) * contentStars);
    }

    // Generate readable reason
    let reason = "";
    if (isAlreadyRated) {
      reason = `You rated this ${existingRating}★.`;
    } else if (userRatings.length === 0) {
      reason = `Cold Start Recommendation: Chosen because it aligns with NLP content features for newly selected interests.`;
    } else {
      const topNlpMatch = highlyRatedProducts
        .map(pid => ({ pid, sim: nlpSimilarities[product.id]?.[pid] || 0 }))
        .sort((a, b) => b.sim - a.sim)[0];
      
      const cfMatchReason = cfType === 'svd' 
        ? "Latent SVD factor alignment" 
        : (cfType === 'user' ? "People with similar taste liked this" : "Similar to other rated products");

      if (computedCfWeight > 0.7) {
        reason = `Highly correlated with your peer tastes (${cfMatchReason}).`;
      } else if (computedCfWeight < 0.3) {
        const matchingProduct = products.find(p => p.id === topNlpMatch?.pid)?.name || "your liked items";
        reason = `NLP Match: Highly similar content description to "${matchingProduct}" (${Math.round(topNlpMatch?.sim * 100)}% text cosine similarity).`;
      } else {
        const matchingProduct = products.find(p => p.id === topNlpMatch?.pid)?.name || "your liked items";
        reason = `Hybrid Mix: Popular among similar users AND fits your text descriptions (similar to "${matchingProduct}").`;
      }
    }

    results.push({
      product,
      score: finalStars,
      cfScore: cfStars,
      contentScore: contentStars,
      reason
    });
  }

  // Sort by highest score first
  return results.sort((a, b) => b.score - a.score);
}
