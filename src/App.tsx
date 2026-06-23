import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  ShoppingBag, 
  Sliders, 
  TrendingUp, 
  BookOpen, 
  Sparkles, 
  Plus, 
  Trash2, 
  RefreshCw, 
  BrainCircuit, 
  CheckCircle,
  HelpCircle,
  Play,
  Pause,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, UserPersona, Rating, SVDModel, SimilarityMatrix } from './types';
import { mockProducts, mockPersonas, initialRatings } from './data/mockData';
import { 
  computeProductNLPSimilarities, 
  computeUserSimilarities, 
  computeItemSimilarities,
  initializeSVD,
  trainSVDEpoch,
  generateHybridRecommendations
} from './utils/recommender';

export default function App() {
  // ==========================================
  // State Management
  // ==========================================
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [personas, setPersonas] = useState<UserPersona[]>(mockPersonas);
  const [ratings, setRatings] = useState<Rating[]>(initialRatings);
  const [selectedUserId, setSelectedUserId] = useState<string>('u1');
  const [activeTab, setActiveTab] = useState<'recommendations' | 'catalog' | 'algorithms' | 'svd' | 'math'>('recommendations');
  
  // Recommender Parameters
  const [cfWeight, setCfWeight] = useState<number>(0.5); // 0.0 (100% NLP) to 1.0 (100% CF)
  const [cfType, setCfType] = useState<'user' | 'item' | 'svd'>('user');
  
  // Custom Product Form
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Electronics');
  const [newProdPrice, setNewProdPrice] = useState('49.99');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdTags, setNewProdTags] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Custom User Form
  const [newUserName, setNewUserName] = useState('');
  const [newUserBio, setNewUserBio] = useState('');
  const [newUserCat, setNewUserCat] = useState('Electronics');
  const [userFormSuccess, setUserFormSuccess] = useState(false);

  // SVD Model State
  const [svdModel, setSvdModel] = useState<SVDModel | null>(null);
  const [isSvdTraining, setIsSvdTraining] = useState(false);
  const [svdLearningRate, setSvdLearningRate] = useState(0.08);
  const [svdRegularization, setSvdRegularization] = useState(0.02);
  const [latentDimension, setLatentDimension] = useState(2); // Fix to 2 for direct 2D coordinate plotting

  // Gemini Explanation State
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Selected cell for similarity heatmap hover/details
  const [selectedSimCell, setSelectedSimCell] = useState<{ id1: string; id2: string; val: number; type: 'user' | 'item' } | null>(null);

  // Get active persona object
  const activeUser = useMemo(() => {
    return personas.find(u => u.id === selectedUserId) || personas[0];
  }, [personas, selectedUserId]);

  // ==========================================
  // Dynamic Recalculations of Similarities
  // ==========================================
  const nlpSimilarities = useMemo(() => {
    return computeProductNLPSimilarities(products);
  }, [products]);

  const userSimilarities = useMemo(() => {
    const userIds = personas.map(p => p.id);
    return computeUserSimilarities(ratings, userIds);
  }, [ratings, personas]);

  const itemSimilarities = useMemo(() => {
    const productIds = products.map(p => p.id);
    return computeItemSimilarities(ratings, productIds);
  }, [ratings, products]);

  // ==========================================
  // SVD Model Autoupdates & Initializations
  // ==========================================
  useEffect(() => {
    const userIds = personas.map(p => p.id);
    const productIds = products.map(p => p.id);
    const model = initializeSVD(userIds, productIds, ratings, latentDimension);
    setSvdModel(model);
    setAiExplanation(null); // Reset explanation on major state changes
  }, [products, personas, ratings, latentDimension]);

  // SVD Training Loop (Animated SGD)
  useEffect(() => {
    let interval: any;
    if (isSvdTraining && svdModel && svdModel.currentEpoch < 150) {
      interval = setInterval(() => {
        setSvdModel(prev => {
          if (!prev || prev.currentEpoch >= 150) return prev;
          return trainSVDEpoch(prev, ratings, svdLearningRate, svdRegularization);
        });
      }, 120); // Smooth animation delay
    }
    return () => clearInterval(interval);
  }, [isSvdTraining, svdModel?.currentEpoch, ratings, svdLearningRate, svdRegularization]);

  // Decoupled effect to auto-stop training when epoch limit is reached
  useEffect(() => {
    if (svdModel && svdModel.currentEpoch >= 150 && isSvdTraining) {
      setIsSvdTraining(false);
    }
  }, [svdModel?.currentEpoch, isSvdTraining]);

  // Reset SVD Model manually
  const handleResetSVD = () => {
    setIsSvdTraining(false);
    const userIds = personas.map(p => p.id);
    const productIds = products.map(p => p.id);
    const model = initializeSVD(userIds, productIds, ratings, latentDimension);
    setSvdModel(model);
  };

  // Run 100 epochs instantly in the background
  const handleTrainSVDHeavy = () => {
    if (!svdModel) return;
    let current = { ...svdModel };
    for (let e = 0; e < 80; e++) {
      current = trainSVDEpoch(current, ratings, svdLearningRate, svdRegularization);
    }
    setSvdModel(current);
  };

  // ==========================================
  // Generating Hybrid Recommendations
  // ==========================================
  const hybridRecommendations = useMemo(() => {
    return generateHybridRecommendations(
      selectedUserId,
      products,
      ratings,
      userSimilarities,
      itemSimilarities,
      nlpSimilarities,
      svdModel,
      cfWeight,
      cfType
    );
  }, [selectedUserId, products, ratings, userSimilarities, itemSimilarities, nlpSimilarities, svdModel, cfWeight, cfType]);

  // ==========================================
  // Rating Interactions
  // ==========================================
  const handleAddOrUpdateRating = (productId: string, ratingValue: number) => {
    setAiExplanation(null);
    setRatings(prev => {
      const existingIdx = prev.findIndex(r => r.userId === selectedUserId && r.productId === productId);
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], rating: ratingValue, timestamp: Date.now() };
        return next;
      } else {
        return [...prev, { userId: selectedUserId, productId, rating: ratingValue, timestamp: Date.now() }];
      }
    });
  };

  const handleRemoveRating = (productId: string) => {
    setAiExplanation(null);
    setRatings(prev => prev.filter(r => !(r.userId === selectedUserId && r.productId === productId)));
  };

  // ==========================================
  // Add Custom Product Form Action
  // ==========================================
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdDesc) return;

    const newId = `p_custom_${Date.now()}`;
    const tagArray = newProdTags.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
    
    // Fallback image based on category
    let image = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400";
    if (newProdCategory === 'Furniture') {
      image = "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=400";
    } else if (newProdCategory === 'Kitchen') {
      image = "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=400";
    } else if (newProdCategory === 'Outdoors') {
      image = "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400";
    }

    const customProd: Product = {
      id: newId,
      name: newProdName,
      category: newProdCategory,
      description: newProdDesc,
      price: parseFloat(newProdPrice) || 29.99,
      imageUrl: image,
      tags: [...tagArray, newProdCategory.toLowerCase()]
    };

    setProducts(prev => [...prev, customProd]);
    setNewProdName('');
    setNewProdDesc('');
    setNewProdTags('');
    setFormSuccess(true);
    setTimeout(() => setFormSuccess(false), 3000);
  };

  // ==========================================
  // Add Custom User Form Action
  // ==========================================
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserBio) return;

    const newId = `u_custom_${Date.now()}`;
    const customUser: UserPersona = {
      id: newId,
      name: `${newUserName} (Custom)`,
      avatar: "👤",
      bio: newUserBio,
      preferredCategories: [newUserCat]
    };

    setPersonas(prev => [...prev, customUser]);
    setSelectedUserId(newId);
    setNewUserName('');
    setNewUserBio('');
    setUserFormSuccess(true);
    setTimeout(() => setUserFormSuccess(false), 3000);
  };

  // ==========================================
  // Request Gemini Explanation
  // ==========================================
  const fetchGeminiExplanation = async () => {
    setIsAiLoading(true);
    setAiError(null);
    setAiExplanation(null);

    // Filter top recommendations for this user
    const topRecs = hybridRecommendations
      .filter(rec => !ratings.some(r => r.userId === selectedUserId && r.productId === rec.product.id))
      .slice(0, 3)
      .map(rec => ({
        name: rec.product.name,
        category: rec.product.category,
        description: rec.product.description,
        price: rec.product.price,
        score: rec.score,
        cfScore: rec.cfScore,
        contentScore: rec.contentScore,
        reason: rec.reason
      }));

    const userHistory = ratings
      .filter(r => r.userId === selectedUserId)
      .map(r => {
        const p = products.find(prod => prod.id === r.productId);
        return {
          name: p?.name || 'Unknown product',
          category: p?.category || 'Unknown',
          rating: r.rating
        };
      });

    try {
      const response = await fetch('/api/gemini/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personaName: activeUser.name,
          personaBio: activeUser.bio,
          history: userHistory,
          recommendations: topRecs
        })
      });

      const data = await response.json();
      if (response.ok && data.explanation) {
        setAiExplanation(data.explanation);
      } else {
        throw new Error(data.error || 'Server returned an empty explanation');
      }
    } catch (err: any) {
      console.error('Failed to load explanation:', err);
      setAiError(err.message || 'Network error requesting AI explanation.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Render helper for Rating Stars
  const renderStars = (stars: number, onClick?: (val: number) => void, onHover?: (val: number) => void) => {
    const fullStars = Math.floor(stars);
    const hasHalf = stars % 1 >= 0.5;
    
    return (
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((idx) => {
          let colorClass = "text-gray-300";
          if (idx <= fullStars) {
            colorClass = "text-amber-400";
          } else if (idx === fullStars + 1 && hasHalf) {
            colorClass = "text-amber-300 opacity-80";
          }
          
          return (
            <button
              key={idx}
              type="button"
              disabled={!onClick}
              onClick={() => onClick && onClick(idx)}
              className={`${colorClass} ${onClick ? 'hover:scale-125 transition-transform cursor-pointer' : ''} focus:outline-none`}
            >
              ★
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans" id="app-root">
      {/* HEADER BAR */}
      <header className="bg-slate-900 text-white shadow-md py-4 px-6 flex flex-wrap justify-between items-center" id="app-header">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-500 rounded-lg text-slate-900 font-bold flex items-center justify-center">
            <BrainCircuit className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">RecEngine Sandbox</h1>
            <p className="text-xs text-slate-400 font-mono">Hybrid NLP &amp; SVD Matrix Factorization</p>
          </div>
        </div>

      </header>

      {/* CORE WORKSPACE GRID */}
      <div className="flex-grow flex flex-col lg:flex-row" id="workspace-container">
        
        {/* SIDEBAR - PERSONA SELECT & WEIGHT CONTROLS */}
        <aside className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-6 flex flex-col space-y-6" id="sidebar-controls">
          
          {/* USER PERSONA MANAGER */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                Active Target User
              </label>
              <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                N={personas.length}
              </span>
            </div>
            
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {personas.map((u) => {
                const isSelected = u.id === selectedUserId;
                const ratedCount = ratings.filter(r => r.userId === u.id).length;
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      setSelectedUserId(u.id);
                      setAiExplanation(null);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-start space-x-3 ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/70 ring-1 ring-amber-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-2xl">{u.avatar}</span>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-sm truncate text-slate-900">{u.name}</h4>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                          {ratedCount} ratings
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{u.bio}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTIVE PERSONA MINICARD */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center space-x-2 text-amber-600 mb-1.5">
              <Award className="w-4.5 h-4.5" />
              <span className="text-xs font-bold uppercase tracking-wider">User Interest Vector</span>
            </div>
            <h5 className="font-semibold text-sm text-slate-800">{activeUser.name}</h5>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed italic">"{activeUser.bio}"</p>
            <div className="mt-2.5 flex flex-wrap gap-1">
              {activeUser.preferredCategories.map(cat => (
                <span key={cat} className="text-[10px] font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                  Category: {cat}
                </span>
              ))}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* HYBRID WEIGHT CONTROLLERS */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sliders className="w-4 h-4" />
              Hybrid Rec Mixture
            </h3>

            {/* SLIDER FOR CO-MATCH WEIGHTS */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 font-mono mb-1">
                <span>Description NLP ({Math.round((1 - cfWeight) * 100)}%)</span>
                <span>Peer CF ({Math.round(cfWeight * 100)}%)</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={cfWeight}
                onChange={(e) => {
                  setCfWeight(parseFloat(e.target.value));
                  setAiExplanation(null);
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                {cfWeight === 0 && "🔌 100% Content Matching: Solves cold-start completely by scanning description texts."}
                {cfWeight > 0 && cfWeight < 1 && "⚖️ Hybrid Balance: Combines text characteristics and user ratings."}
                {cfWeight === 1 && "👥 100% Collaborative: Ignores text. Matches purely on peer rating overlaps."}
              </p>
            </div>

            {/* COLLABORATIVE ALGO TYPE */}
            <div>
              <label className="text-xs text-slate-500 font-medium block mb-1.5">Collaborative Filter Type</label>
              <div className="grid grid-cols-3 gap-1">
                {(['user', 'item', 'svd'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setCfType(type);
                      setAiExplanation(null);
                    }}
                    className={`text-xs py-1.5 px-1 rounded border text-center font-mono transition-all ${
                      cfType === type
                        ? 'border-slate-800 bg-slate-900 text-white font-semibold'
                        : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* QUICK RECALC STATS */}
          <div className="mt-auto pt-4 border-t border-slate-100 text-[10px] text-slate-400 space-y-1 font-mono">
            <div>Interaction Logs: {ratings.length} pairs</div>
            <div>NLP Feature Dimensions: Bag-of-Words</div>
            <div>SVD Dimensions: 2-Latent factors</div>
          </div>
        </aside>

        {/* MAIN DISPLAY WORKBENCH */}
        <main className="flex-grow p-6 flex flex-col space-y-6 overflow-x-hidden" id="main-content">
          
          {/* NAVIGATION TABS */}
          <div className="flex border-b border-slate-200 overflow-x-auto whitespace-nowrap scrollbar-hide space-x-6" id="workbench-tabs">
            {[
              { id: 'recommendations', label: '🎯 Recommendations', icon: Sparkles },
              { id: 'catalog', label: '📦 Catalog & Ratings', icon: ShoppingBag },
              { id: 'algorithms', label: '🧮 Sim Matrices Heatmap', icon: Sliders },
              { id: 'svd', label: '📉 SVD Latent Space', icon: TrendingUp },
              { id: 'math', label: '📝 Math & Logic Explainer', icon: BookOpen },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? 'border-amber-500 text-amber-600 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB WINDOW CONTENT */}
          <div className="flex-grow" id="tab-window-content">
            
            {/* 1. RECOMMENDATIONS TAB */}
            {activeTab === 'recommendations' && (
              <div className="space-y-6" id="tab-recommendations-view">
                
                {/* ACTIVE SUMMARY HEADER */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Custom Recommendations for {activeUser.name}</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Showing hybrid recommendations sorted by score. The slider adjusts the contribution of Collaborative vs Content similarities.
                    </p>
                  </div>
                  
                  {/* AI TRIGGER BUTTON */}
                  <button
                    onClick={fetchGeminiExplanation}
                    disabled={isAiLoading}
                    className="bg-slate-950 hover:bg-slate-800 disabled:bg-slate-300 text-white font-medium text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer"
                  >
                    <Sparkles className={`w-4 h-4 ${isAiLoading ? 'animate-spin' : 'text-amber-400'}`} />
                    {isAiLoading ? 'AI is analyzing algorithms...' : '✨ Generate AI Deep Explanator with Gemini'}
                  </button>
                </div>

                {/* DYNAMIC ERROR IF GEMINI CRASHES */}
                {aiError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-lg text-xs font-medium">
                    ⚠️ {aiError}
                  </div>
                )}

                {/* EXPLANATION POP-IN ZONE */}
                <AnimatePresence>
                  {aiExplanation && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 rounded-xl p-6 shadow-md border border-slate-800 space-y-4"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                        <div className="flex items-center gap-2">
                          <BrainCircuit className="w-5 h-5 text-amber-400 animate-pulse" />
                          <h3 className="font-bold text-sm tracking-wide uppercase">Gemini AI Hybrid Math Explanation</h3>
                        </div>
                        <button 
                          onClick={() => setAiExplanation(null)}
                          className="text-slate-400 hover:text-white text-xs font-mono px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer"
                        >
                          Hide explanation
                        </button>
                      </div>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-slate-200 prose prose-invert max-w-none prose-sm">
                        {aiExplanation}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono text-right border-t border-slate-700/50 pt-2">
                        Powered by Google Gemini 3.5 Flash Model
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* RECOMMENDATIONS CAROUSEL/GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {/* Filter out rated items to only recommend net-new unrated discoveries */}
                  {hybridRecommendations
                    .filter(rec => !ratings.some(r => r.userId === selectedUserId && r.productId === rec.product.id))
                    .slice(0, 6)
                    .map((rec, index) => {
                      const p = rec.product;
                      return (
                        <div 
                          key={p.id} 
                          className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col overflow-hidden relative"
                        >
                          {/* Rank Badge */}
                          <div className="absolute top-2.5 left-2.5 bg-slate-900/80 text-white font-mono text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-xs z-10">
                            #{index + 1}
                          </div>

                          {/* Category Tag */}
                          <div className="absolute top-2.5 right-2.5 bg-amber-500 text-slate-950 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs z-10">
                            Score: {rec.score.toFixed(2)}★
                          </div>

                          <img 
                            src={p.imageUrl} 
                            alt={p.name} 
                            className="w-full h-40 object-cover border-b border-slate-100"
                            referrerPolicy="no-referrer"
                          />

                          <div className="p-4 flex-grow flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start">
                                <h4 className="font-bold text-slate-900 text-sm leading-snug">{p.name}</h4>
                                <span className="text-xs font-mono font-bold text-slate-500">${p.price}</span>
                              </div>
                              
                              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">{p.category}</p>
                              
                              {/* RATING SLIDER BARS */}
                              <div className="mt-3 space-y-1.5">
                                <div>
                                  <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                                    <span>Peer Recommendation Predict</span>
                                    <span>{rec.cfScore.toFixed(1)}★</span>
                                  </div>
                                  <div className="w-full h-1 bg-slate-100 rounded">
                                    <div 
                                      className="h-full bg-slate-500 rounded transition-all"
                                      style={{ width: `${Math.max(1, Math.min(5, rec.cfScore)) * 20}%` }}
                                    ></div>
                                  </div>
                                </div>
                                <div>
                                  <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                                    <span>NLP Text Match (Descriptions)</span>
                                    <span>{rec.contentScore.toFixed(1)}★</span>
                                  </div>
                                  <div className="w-full h-1 bg-slate-100 rounded">
                                    <div 
                                      className="h-full bg-amber-500 rounded transition-all"
                                      style={{ width: `${Math.max(1, Math.min(5, rec.contentScore)) * 20}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>

                              <p className="text-xs text-slate-600 line-clamp-3 mt-3 bg-slate-50/50 p-2 rounded leading-relaxed border border-slate-100">
                                {p.description}
                              </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100">
                              <p className="text-[11px] font-medium text-slate-500 flex items-start gap-1">
                                <span className="inline-block mt-0.5 shrink-0 text-amber-500">💡</span>
                                <span className="leading-normal">{rec.reason}</span>
                              </p>

                              {/* Interactive Instant Rating Tool */}
                              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[10px] font-mono text-slate-400">Add Rating:</span>
                                {renderStars(0, (val) => handleAddOrUpdateRating(p.id, val))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  
                  {/* IF NO NEW ITEMS TO SUGGEST */}
                  {hybridRecommendations.filter(rec => !ratings.some(r => r.userId === selectedUserId && r.productId === rec.product.id)).length === 0 && (
                    <div className="col-span-full bg-slate-100 rounded-xl p-8 text-center text-slate-500">
                      🎉 You have rated all products in the catalog! Add a new product in the "Catalog" tab to test recommendations on fresh items.
                    </div>
                  )}
                </div>

                {/* USER'S PREVIOUSLY RATED HISTORY */}
                <div className="mt-10">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
                    <CheckCircle className="w-4.5 h-4.5 text-emerald-500" />
                    Previously Rated Products by {activeUser.name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ratings
                      .filter(r => r.userId === selectedUserId)
                      .map(r => {
                        const p = products.find(prod => prod.id === r.productId);
                        if (!p) return null;
                        return (
                          <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-800 text-xs truncate">{p.name}</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">{p.category}</p>
                              <div className="mt-2 flex items-center gap-1">
                                <span className="text-[10px] text-slate-400 font-mono">Your Score:</span>
                                {renderStars(r.rating)}
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveRating(p.id)}
                              className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                              title="Delete Rating"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        );
                      })}
                    {ratings.filter(r => r.userId === selectedUserId).length === 0 && (
                      <div className="col-span-full text-center text-xs text-slate-400 bg-white border border-dashed rounded-xl py-6">
                        No ratings yet! Use the catalog tab or the star widgets to start logging interactions and build a collaborative preference profile.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* 2. INTERACTIVE CATALOG & RATINGS */}
            {activeTab === 'catalog' && (
              <div className="space-y-6" id="tab-catalog-view">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  
                  {/* PRODUCT BROWSER (Left Column) */}
                  <div className="xl:col-span-2 space-y-4">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                      <div>
                        <h2 className="text-base font-bold text-slate-800">E-Commerce Product Inventory</h2>
                        <p className="text-xs text-slate-500">Rate items as {activeUser.name} to train SVD and update similarity models.</p>
                      </div>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded font-mono">
                        Count: {products.length} Items
                      </span>
                    </div>

                    <div className="space-y-3">
                      {products.map(p => {
                        const userRating = ratings.find(r => r.userId === selectedUserId && r.productId === p.id)?.rating || null;
                        
                        return (
                          <div 
                            key={p.id} 
                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                          >
                            <div className="flex items-start gap-3.5 min-w-0">
                              <img 
                                src={p.imageUrl} 
                                alt={p.name} 
                                className="w-16 h-16 rounded-lg object-cover shrink-0 border border-slate-100"
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-slate-800 text-sm">{p.name}</h4>
                                  <span className="text-[9px] bg-slate-100 text-slate-500 font-mono px-1.5 py-0.5 rounded">
                                    {p.id}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                                  {p.category} • ${p.price}
                                </p>
                                <p className="text-xs text-slate-600 mt-1 line-clamp-1 leading-normal">
                                  {p.description}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {p.tags.slice(0, 4).map(t => (
                                    <span key={t} className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                                      #{t}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Interaction Slider */}
                            <div className="shrink-0 flex flex-col items-end gap-1.5 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                              <span className="text-[10px] font-mono text-slate-500">
                                {userRating ? `Your Rating: ${userRating}★` : "Unrated by you"}
                              </span>
                              <div className="flex items-center gap-2">
                                {renderStars(userRating || 0, (val) => handleAddOrUpdateRating(p.id, val))}
                                {userRating && (
                                  <button
                                    onClick={() => handleRemoveRating(p.id)}
                                    className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                                    title="Clear rating"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SIDEBAR CREATOR PANEL (Right Column) */}
                  <div className="space-y-6">
                    
                    {/* ADD PRODUCT FORM */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                      <div>
                        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                          <Plus className="w-4 h-4 text-amber-500" />
                          Inject Custom Cold-Start Product
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Create a brand new item with specific keywords. Watch how the NLP matching model recommends it instantly to matching users without any historical ratings.
                        </p>
                      </div>

                      {formSuccess && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded text-xs font-semibold">
                          ✓ Product added successfully to catalog!
                        </div>
                      )}

                      <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
                        <div>
                          <label className="block text-slate-500 mb-1 font-medium">Product Name</label>
                          <input
                            type="text"
                            value={newProdName}
                            onChange={(e) => setNewProdName(e.target.value)}
                            placeholder="e.g. ZenDesk Bamboo Keyboard Case"
                            className="w-full border border-slate-200 rounded p-2 focus:border-amber-500 focus:outline-none"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-slate-500 mb-1 font-medium">Category</label>
                            <select
                              value={newProdCategory}
                              onChange={(e) => setNewProdCategory(e.target.value)}
                              className="w-full border border-slate-200 rounded p-2 focus:border-amber-500 focus:outline-none"
                            >
                              <option value="Electronics">Electronics</option>
                              <option value="Furniture">Furniture</option>
                              <option value="Kitchen">Kitchen</option>
                              <option value="Outdoors">Outdoors</option>
                              <option value="Apparel">Apparel</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1 font-medium">Price ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={newProdPrice}
                              onChange={(e) => setNewProdPrice(e.target.value)}
                              placeholder="49.99"
                              className="w-full border border-slate-200 rounded p-2 focus:border-amber-500 focus:outline-none"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1 font-medium">Product Description (NLP Content Input)</label>
                          <textarea
                            value={newProdDesc}
                            onChange={(e) => setNewProdDesc(e.target.value)}
                            placeholder="e.g. Elegant solid bamboo key shell lined with organic wool felt cushions. Increases workspace aesthetics, dampens tactile click resonance, and provides an eco-friendly desk environment..."
                            rows={3}
                            className="w-full border border-slate-200 rounded p-2 focus:border-amber-500 focus:outline-none leading-relaxed"
                            required
                          ></textarea>
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1 font-medium">Tags (Comma-separated)</label>
                          <input
                            type="text"
                            value={newProdTags}
                            onChange={(e) => setNewProdTags(e.target.value)}
                            placeholder="bamboo, keyboard, custom, eco-friendly"
                            className="w-full border border-slate-200 rounded p-2 focus:border-amber-500 focus:outline-none"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2 rounded transition-colors text-center cursor-pointer"
                        >
                          Inject Product &amp; Recalculate
                        </button>
                      </form>
                    </div>

                    {/* ADD USER FORM */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                      <div>
                        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                          <Plus className="w-4 h-4 text-emerald-500" />
                          Inject Custom User Persona
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Define a custom user persona with a specific biography to test the NLP recommender mapping in action.
                        </p>
                      </div>

                      {userFormSuccess && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded text-xs font-semibold">
                          ✓ User persona injected successfully!
                        </div>
                      )}

                      <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
                        <div>
                          <label className="block text-slate-500 mb-1 font-medium">User Full Name</label>
                          <input
                            type="text"
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            placeholder="e.g. Matcha Matt"
                            className="w-full border border-slate-200 rounded p-2 focus:border-amber-500 focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1 font-medium">Biography &amp; Workflow Preference</label>
                          <textarea
                            value={newUserBio}
                            onChange={(e) => setNewUserBio(e.target.value)}
                            placeholder="e.g. Remote worker who drinks organic ceremonial grade matcha every morning. Values minimalist wool felt aesthetics, silent ergonomic keyboards, and high-hydration water flasks..."
                            rows={3}
                            className="w-full border border-slate-200 rounded p-2 focus:border-amber-500 focus:outline-none leading-relaxed"
                            required
                          ></textarea>
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1 font-medium">Prior Primary Interest Category</label>
                          <select
                            value={newUserCat}
                            onChange={(e) => setNewUserCat(e.target.value)}
                            className="w-full border border-slate-200 rounded p-2 focus:border-amber-500 focus:outline-none"
                          >
                            <option value="Electronics">Electronics</option>
                            <option value="Furniture">Furniture</option>
                            <option value="Kitchen">Kitchen</option>
                            <option value="Outdoors">Outdoors</option>
                            <option value="Apparel">Apparel</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded transition-colors text-center cursor-pointer"
                        >
                          Inject User Persona &amp; Focus
                        </button>
                      </form>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* 3. ALGORITHMS WORKBENCH & HEATMAP */}
            {activeTab === 'algorithms' && (
              <div className="space-y-6" id="tab-algorithms-view">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h2 className="text-base font-bold text-slate-800">Collaborative Cosine Similarity Matrices</h2>
                  <p className="text-xs text-slate-500 mt-1 leading-normal">
                    Below are the dynamic Cosine Similarity Heatmaps calculated in real time. Similarity is computed based on shared rating vectors. 
                    A score of 1.0 (deep red) means perfectly aligned rating patterns, while 0.0 (white/light blue) indicates orthogonal rating vectors.
                  </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  
                  {/* USER SIMILARITY MATRIX */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <div>
                        <h3 className="font-bold text-sm text-slate-800">User-to-User Sim Matrix (Pearson Correlation Equivalent)</h3>
                        <p className="text-[11px] text-slate-400">Formula: sim(A, B) = cos(R_A, R_B)</p>
                      </div>
                      <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-mono font-bold">
                        User Dim: {personas.length}x{personas.length}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-xs font-mono">
                        <thead>
                          <tr>
                            <th className="p-1.5 border bg-slate-50 text-[10px] font-bold text-slate-600 text-left">UID</th>
                            {personas.map(p => (
                              <th key={p.id} className="p-1.5 border bg-slate-50 text-[10px] text-center font-bold text-slate-600 rotate-0" title={p.name}>
                                {p.id}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {personas.map(pRow => (
                            <tr key={pRow.id}>
                              <td className="p-1.5 border font-bold text-slate-700 bg-slate-50" title={pRow.name}>{pRow.id}</td>
                              {personas.map(pCol => {
                                const val = userSimilarities[pRow.id]?.[pCol.id] || 0;
                                const isSelf = pRow.id === pCol.id;
                                
                                // Color scale: Red-yellow gradient based on similarity value
                                let bgStyle = { backgroundColor: `rgba(245, 158, 11, ${val})` };
                                if (isSelf) bgStyle = { backgroundColor: 'rgb(254, 243, 199)' }; // high self color

                                return (
                                  <td
                                    key={pCol.id}
                                    style={bgStyle}
                                    onClick={() => setSelectedSimCell({ id1: pRow.id, id2: pCol.id, val, type: 'user' })}
                                    className="p-3 border text-center font-bold font-mono cursor-pointer transition-transform hover:scale-110 relative"
                                    title={`Similarity between ${pRow.id} and ${pCol.id}: ${val.toFixed(4)}`}
                                  >
                                    {val.toFixed(2)}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ITEM SIMILARITY MATRIX */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <div>
                        <h3 className="font-bold text-sm text-slate-800">Item-to-Item Sim Matrix (Cosine)</h3>
                        <p className="text-[11px] text-slate-400">Formula: sim(i, j) = cos(R_*,i, R_*,j)</p>
                      </div>
                      <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-mono font-bold">
                        Item Dim: {products.length}x{products.length}
                      </span>
                    </div>

                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full border-collapse text-xs font-mono">
                        <thead>
                          <tr>
                            <th className="p-1.5 border bg-slate-50 text-[10px] font-bold text-slate-600 text-left">PID</th>
                            {products.map(p => (
                              <th key={p.id} className="p-1.5 border bg-slate-50 text-[10px] text-center font-bold text-slate-600" title={p.name}>
                                {p.id}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {products.map(pRow => (
                            <tr key={pRow.id}>
                              <td className="p-1.5 border font-bold text-slate-700 bg-slate-50" title={pRow.name}>{pRow.id}</td>
                              {products.map(pCol => {
                                const val = itemSimilarities[pRow.id]?.[pCol.id] || 0;
                                const isSelf = pRow.id === pCol.id;

                                let bgStyle = { backgroundColor: `rgba(245, 158, 11, ${val})` };
                                if (isSelf) bgStyle = { backgroundColor: 'rgb(254, 243, 199)' };

                                return (
                                  <td
                                    key={pCol.id}
                                    style={bgStyle}
                                    onClick={() => setSelectedSimCell({ id1: pRow.id, id2: pCol.id, val, type: 'item' })}
                                    className="p-3 border text-center font-bold font-mono cursor-pointer transition-transform hover:scale-110"
                                    title={`Similarity: ${val.toFixed(4)}`}
                                  >
                                    {val.toFixed(2)}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                {/* SELECTED CELL ANALYZER POP-UP */}
                <AnimatePresence>
                  {selectedSimCell && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-md flex justify-between items-start"
                    >
                      <div>
                        <h4 className="font-bold text-sm text-amber-400 uppercase tracking-wide">
                          Selected Similarity Vector Analysis
                        </h4>
                        
                        {selectedSimCell.type === 'user' ? (
                          <div className="text-xs space-y-1.5 mt-2.5">
                            <p>
                              Comparing user <span className="font-bold text-amber-300">"{personas.find(u => u.id === selectedSimCell.id1)?.name}"</span> 
                              with user <span className="font-bold text-amber-300">"{personas.find(u => u.id === selectedSimCell.id2)?.name}"</span>.
                            </p>
                            <p className="text-slate-300">
                              Calculated Rating Cosine Similarity: <span className="font-mono font-bold bg-slate-800 text-slate-100 px-1.5 py-0.5 rounded">{selectedSimCell.val.toFixed(6)}</span>
                            </p>
                            <p className="text-slate-400 italic leading-relaxed">
                              *Logic: Prediction scores for any user leverage weighted ratings from users with high similarity coefficients.*
                            </p>
                          </div>
                        ) : (
                          <div className="text-xs space-y-1.5 mt-2.5">
                            <p>
                              Comparing product <span className="font-bold text-amber-300">"{products.find(p => p.id === selectedSimCell.id1)?.name}"</span> 
                              with product <span className="font-bold text-amber-300">"{products.find(p => p.id === selectedSimCell.id2)?.name}"</span>.
                            </p>
                            <p className="text-slate-300">
                              Calculated Cosine Rating Correlation: <span className="font-mono font-bold bg-slate-800 text-slate-100 px-1.5 py-0.5 rounded">{selectedSimCell.val.toFixed(6)}</span>
                            </p>
                            <p className="text-slate-400 italic leading-relaxed">
                              *Logic: High similarity represents products frequently rated similarly by the same cohorts.*
                            </p>
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => setSelectedSimCell(null)}
                        className="text-slate-400 hover:text-white font-mono text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded cursor-pointer"
                      >
                        Close
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            )}

            {/* 4. SVD PLAYGROUND */}
            {activeTab === 'svd' && (
              <div className="space-y-6" id="tab-svd-view">
                
                {/* INTRO AND SVD CONTROLS */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-800">SVD Matrix Factorization &amp; Latent Space</h2>
                      <p className="text-xs text-slate-500 mt-1 leading-normal">
                        Matrix Factorization decomposes our ratings matrix into low-rank User Factors and Item Factors ($P$ and $Q$).
                        We use **Stochastic Gradient Descent (SGD)** to train these representations, mapping both users and items into a shared 2-dimensional Latent Space coordinates.
                      </p>
                    </div>

                    {/* SVD TRAINING STATUS BANNER */}
                    <div className="flex items-center gap-2 bg-slate-50 py-1.5 px-3 rounded-lg border font-mono text-xs">
                      <span>Epoch: {svdModel?.currentEpoch || 0}</span>
                      <span>•</span>
                      <span>MSE: {svdModel && svdModel.mseHistory.length > 0 ? svdModel.mseHistory[svdModel.mseHistory.length - 1].toFixed(5) : 'N/A'}</span>
                    </div>
                  </div>

                  {/* SVD CONTROLLER BAR */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100 text-xs">
                    <div>
                      <label className="block text-slate-500 mb-1 font-medium">Learning Rate ($\gamma$)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.005"
                        max="0.5"
                        value={svdLearningRate}
                        onChange={(e) => setSvdLearningRate(parseFloat(e.target.value) || 0.05)}
                        className="w-full border border-slate-200 rounded p-1.5 font-mono focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1 font-medium">Regularization ($\lambda$)</label>
                      <input
                        type="number"
                        step="0.005"
                        min="0.0"
                        max="0.2"
                        value={svdRegularization}
                        onChange={(e) => setSvdRegularization(parseFloat(e.target.value) || 0.02)}
                        className="w-full border border-slate-200 rounded p-1.5 font-mono focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col justify-end">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            if (svdModel) {
                              setSvdModel(trainSVDEpoch(svdModel, ratings, svdLearningRate, svdRegularization));
                            }
                          }}
                          className="bg-slate-100 hover:bg-slate-200 border text-slate-800 font-bold py-1.5 px-2 rounded text-center transition-all cursor-pointer"
                        >
                          +1 Epoch
                        </button>
                        <button
                          onClick={() => setIsSvdTraining(!isSvdTraining)}
                          className={`font-bold py-1.5 px-2 rounded text-center transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            isSvdTraining ? 'bg-amber-500 hover:bg-amber-600 text-slate-900' : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          {isSvdTraining ? (
                            <>
                              <Pause className="w-3.5 h-3.5 fill-current" /> Pause SGD
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" /> Loop SGD
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col justify-end">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handleTrainSVDHeavy}
                          className="bg-slate-100 hover:bg-slate-200 border text-slate-800 font-bold py-1.5 px-2 rounded text-center transition-all cursor-pointer"
                          title="Instantly trains 80 epochs in background"
                        >
                          ⚡ fast-train 80
                        </button>
                        <button
                          onClick={handleResetSVD}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-1.5 px-2 rounded text-center transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Reset weights
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CHARTS CONTAINER GRID */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  
                  {/* CHART 1: MSE LOSS CURVE (Custom SVG) */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                      <TrendingUp className="w-4.5 h-4.5 text-slate-900" />
                      Mean Squared Error (MSE) Optimization Curve
                    </h3>
                    
                    <div className="relative w-full h-64 bg-slate-900 rounded-lg overflow-hidden border p-4 flex flex-col justify-between">
                      {svdModel && svdModel.mseHistory.length > 0 ? (
                        <div className="relative flex-grow w-full">
                          {/* Grid Lines */}
                          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                            {[0, 1, 2, 3, 4].map(idx => (
                              <div key={idx} className="w-full border-t border-white"></div>
                            ))}
                          </div>

                          {/* SVG Plot */}
                          <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150" preserveAspectRatio="none">
                            {(() => {
                              const history = svdModel.mseHistory;
                              const maxLoss = Math.max(...history, 1);
                              const minLoss = Math.min(...history, 0);
                              const lossRange = maxLoss - minLoss || 1;

                              const points = history.map((loss, idx) => {
                                const x = (idx / (history.length - 1 || 1)) * 400;
                                const y = 150 - ((loss - minLoss) / lossRange) * 140; // leaving 10px padding
                                return `${x.toFixed(1)},${y.toFixed(1)}`;
                              }).join(' ');

                              return (
                                <>
                                  {/* Line Path */}
                                  <polyline
                                    fill="none"
                                    stroke="url(#gradient-loss)"
                                    strokeWidth="2.5"
                                    points={points}
                                  />
                                  {/* Under-area fill */}
                                  <polygon
                                    fill="url(#gradient-area)"
                                    opacity="0.15"
                                    points={`0,150 ${points} 400,150`}
                                  />
                                  
                                  {/* Gradients */}
                                  <defs>
                                    <linearGradient id="gradient-loss" x1="0" y1="0" x2="1" y2="0">
                                      <stop offset="0%" stopColor="#f59e0b" />
                                      <stop offset="100%" stopColor="#f59e0b" />
                                    </linearGradient>
                                    <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#f59e0b" />
                                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                                    </linearGradient>
                                  </defs>
                                </>
                              );
                            })()}
                          </svg>
                        </div>
                      ) : (
                        <div className="flex-grow flex items-center justify-center text-slate-500 font-mono text-xs">
                          No history yet. Start SGD training to plot reconstruction error.
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 border-t border-slate-800 pt-2 shrink-0">
                        <span>Min loss predicted in SVD mapping</span>
                        <span>Epoch range: 0 - {svdModel?.mseHistory.length || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* CHART 2: LATENT VECTOR SPACE 2D SCATTER PLOT (Custom SVG) */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                      <BrainCircuit className="w-4.5 h-4.5 text-slate-900" />
                      2D Latent Vector Space (SGD Coordinate Projection)
                    </h3>

                    <div className="relative w-full h-64 bg-slate-950 rounded-lg overflow-hidden border p-4 relative">
                      {/* Quadrant Lines (Axes) */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                        <div className="w-full border-t border-dashed border-white"></div>
                        <div className="h-full border-l border-dashed border-white absolute"></div>
                      </div>

                      {/* Dynamic Axis Labels */}
                      <span className="absolute bottom-2 right-4 text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                        Latent Dim 1 → Workplace vs Outdoors
                      </span>
                      <span className="absolute top-2 left-4 text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider rotate-90 origin-top-left translate-x-3.5 translate-y-2">
                        Latent Dim 2 → Tech vs Comfort
                      </span>

                      {/* Elements rendering */}
                      {svdModel ? (
                        <div className="relative w-full h-full">
                          {/* Render Products as green circles */}
                          {products.map(p => {
                            const factors = svdModel.itemFactors[p.id];
                            if (!factors || factors.length < 2) return null;
                            
                            // Map factors (-1.2 to 1.2 range) onto percentage coordinates (10% to 90% boundary)
                            const x = 50 + factors[0] * 35;
                            const y = 50 - factors[1] * 35;

                            return (
                              <div
                                key={p.id}
                                className="absolute group"
                                style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                              >
                                <div className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-slate-900 cursor-help flex items-center justify-center shadow-md hover:scale-125 transition-transform" />
                                
                                {/* Label Popover on hover */}
                                <div className="pointer-events-none opacity-0 group-hover:opacity-100 absolute bg-slate-900 text-white font-sans text-[10px] p-2 rounded-lg border border-slate-700 shadow-xl whitespace-nowrap z-20 -top-8 left-4 transition-all leading-normal">
                                  <span className="font-bold text-amber-300">📦 {p.name}</span>
                                  <br />
                                  <span className="text-[9px] font-mono text-slate-400">Coords: ({factors[0].toFixed(3)}, {factors[1].toFixed(3)})</span>
                                </div>
                              </div>
                            );
                          })}

                          {/* Render Users as yellow stars */}
                          {personas.map(u => {
                            const factors = svdModel.userFactors[u.id];
                            if (!factors || factors.length < 2) return null;

                            const x = 50 + factors[0] * 35;
                            const y = 50 - factors[1] * 35;

                            return (
                              <div
                                key={u.id}
                                className="absolute group"
                                style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                              >
                                <div className="w-6 h-6 rounded-lg bg-emerald-500 border border-slate-950 cursor-help flex items-center justify-center shadow-lg hover:scale-125 transition-transform font-bold text-xs">
                                  {u.avatar}
                                </div>

                                <div className="pointer-events-none opacity-0 group-hover:opacity-100 absolute bg-slate-900 text-white font-sans text-[10px] p-2 rounded-lg border border-slate-700 shadow-xl whitespace-nowrap z-20 -top-8 left-6 transition-all leading-normal">
                                  <span className="font-bold text-emerald-300">👤 {u.name}</span>
                                  <br />
                                  <span className="text-[9px] font-mono text-slate-400">Coords: ({factors[0].toFixed(3)}, {factors[1].toFixed(3)})</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-400 leading-normal">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                        <span>Product Latents ($Q_i$)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>
                        <span>User Latents ($P_u$)</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* 5. MATH & EXPLAINER TAB */}
            {activeTab === 'math' && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed" id="tab-math-view">
                <div>
                  <h2 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <BookOpen className="w-5 h-5 text-amber-500" />
                    Algorithmic Recommendation Architecture
                  </h2>
                  <p className="text-xs text-slate-500">How the code fuses Collaborative Filtering, Matrix Factorization, and NLP Content-Based Descriptions.</p>
                </div>

                <div className="space-y-4">
                  
                  {/* COMPONENT 1 */}
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">1. User-Based Cosine Collaborative Filtering</h3>
                    <p className="text-xs">
                      We compute the similarity between users by calculating the Cosine similarity over their raw rating vectors. 
                      Predictive ratings for unrated items are calculated using the mean ratings of the active user plus the similarity-weighted rating deviations of their peers.
                    </p>
                    <div className="bg-slate-900 text-amber-400 p-3 rounded font-mono text-center text-xs my-2.5 overflow-x-auto shadow-inner">
                      {"pred(u, i) = AverageUserRating_u + [ Sum_v( Sim(u, v) * (Rating_v_i - AverageUserRating_v) ) / Sum_v( |Sim(u, v)| ) ]"}
                    </div>
                  </div>

                  {/* COMPONENT 2 */}
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">2. SVD Low-Rank Matrix Decompositions</h3>
                    <p className="text-xs">
                      Rather than storing sparse high-dimensional matrices, SVD compresses users and items into a dense, shared vector space with 2 latent dimensions. 
                      The rating predictions are reconstructed using the global ratings average, the user's bias, the item's bias, and the dot product of latent representations:
                    </p>
                    <div className="bg-slate-900 text-amber-400 p-3 rounded font-mono text-center text-xs my-2.5 overflow-x-auto shadow-inner">
                      {"pred_SVD(u, i) = GlobalMean + UserBias_u + ItemBias_i + (UserFactors_u . ItemFactors_i)"}
                    </div>
                    <p className="text-xs">
                      The model is optimized iteratively using Stochastic Gradient Descent (SGD). For every rated user-item pair, the prediction error is calculated, 
                      and weights are updated using a learning rate and a regularization coefficient to prevent overfitting:
                    </p>
                    <div className="bg-slate-900 text-emerald-400 p-3 rounded font-mono text-[11px] leading-relaxed my-2.5 overflow-x-auto shadow-inner">
                      {"UserFactors_u = UserFactors_u + LearningRate * (Error * ItemFactors_i - Regularization * UserFactors_u)"}
                      <br />
                      {"ItemFactors_i = ItemFactors_i + LearningRate * (Error * UserFactors_u - Regularization * ItemFactors_i)"}
                    </div>
                  </div>

                  {/* COMPONENT 3 */}
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">3. Content-Based Description NLP Matching</h3>
                    <p className="text-xs">
                      When a user or a product has no ratings, collaborative systems suffer from the Cold Start Problem. 
                      To bypass this constraint, the system extracts a tokenized term-frequency vector representing the rich product description text, category name, and tags.
                      A Cosine Similarity over these natural language descriptions is computed, identifying content matches:
                    </p>
                    <div className="bg-slate-900 text-amber-400 p-3 rounded font-mono text-center text-xs my-2.5 overflow-x-auto shadow-inner">
                      {"ContentSimilarity(i, j) = (TermVector_i . TermVector_j) / (||TermVector_i|| * ||TermVector_j||)"}
                    </div>
                  </div>

                  {/* COMPONENT 4 */}
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">4. Hybrid Fusion System</h3>
                    <p className="text-xs font-sans">
                      Our system fuses both models, applying the weight parameter from the UI slider:
                    </p>
                    <div className="bg-slate-900 text-amber-400 p-3 rounded font-mono text-center text-xs my-2.5 overflow-x-auto shadow-inner">
                      {"FinalScore = CollaborativeWeight * CollaborativeScore + (1 - CollaborativeWeight) * NLPContentScore"}
                    </div>
                    <p className="text-xs">
                      This represents the ultimate production-grade recommender standard. Gemini then acts as a semantic interpreter on top of these raw scores, producing human-readable reports summarizing why these items map perfectly to your bio.
                    </p>
                  </div>

                </div>
              </div>
            )}

          </div>

        </main>

      </div>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-500 py-6 border-t border-slate-800 text-center text-xs font-mono" id="app-footer">
        <p>© 2026 E-Commerce Recommender Sandbox • Designed for Google AI Studio Build</p>
        <p className="text-[10px] text-slate-600 mt-1">Stochastic Gradient Descent training computes locally with React hooks.</p>
      </footer>
    </div>
  );
}
