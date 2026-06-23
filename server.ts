import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent for tracking
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('Gemini AI initialized successfully.');
  } catch (err) {
    console.error('Error initializing Gemini AI SDK:', err);
  }
} else {
  console.warn('Warning: GEMINI_API_KEY is not set. Recommendations will fall back to rule-based static explainers.');
}

// API Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API endpoint to generate recommendation explanations using Gemini
app.post('/api/gemini/explain', async (req: Request, res: Response) => {
  const { personaName, personaBio, history, recommendations } = req.body;

  if (!personaName || !personaBio) {
    res.status(400).json({ error: 'Missing user persona parameters.' });
    return;
  }

  // Construct fallback explanation in case Gemini is offline or API key is not configured
  const getFallbackExplanation = () => {
    return `### 💡 Hybrid Recommendation Insights for ${personaName}

*Note: This is a structured fallback explanation as no Gemini API key is configured.*

1. **How Collaborative Filtering (CF) Contributed**:
   Based on other profiles in our database, we discovered peer clusters with overlapping tastes. Users with similar workstations scored high items positively. This peer matching predicted high affinity for products aligned to your main focus category.

2. **How NLP Content Filtering Solved the Cold-Start**:
   Using a Bag-of-Words Cosine Similarity over product descriptions, titles, and tags, the NLP engine matched keywords in your bio (e.g., "keyboard", "hydration", "ergonomic", "tea") with rich features in our catalog. This is why products like **${recommendations[0]?.name || 'the recommended items'}** scored highly even if they have fewer peer ratings yet.

3. **Hybrid Verdict**:
   We balanced your collaborative score and content score (50/50 mix). We highly recommend trying out **${recommendations[0]?.name || 'the top recommended product'}** because it delivers the optimal intersection of text match and peer ratings.`;
  };

  if (!ai) {
    res.json({ explanation: getFallbackExplanation(), isFallback: true });
    return;
  }

  try {
    const prompt = `You are an elite, highly professional E-Commerce Recommendation Analyst. Your job is to explain why we recommended specific products to a user based on their persona bio, historical interactions, and our recommendation algorithm scores.

User Persona:
- Name: ${personaName}
- Bio: ${personaBio}

User Historical Rated Products:
${history.map((h: any) => `- "${h.name}" (${h.category}): User Rated ${h.rating} out of 5 stars`).join('\n')}

Our Algorithm's Top Recommendations for them:
${recommendations.map((rec: any, idx: number) => `
${idx + 1}. Product: "${rec.name}"
   - Category: ${rec.category}
   - Description: ${rec.description}
   - Price: $${rec.price}
   - Algorithmic Predicted Score: ${rec.score.toFixed(2)} Stars (CF score: ${rec.cfScore.toFixed(2)}, NLP Description Match: ${rec.contentScore.toFixed(2)})
   - System Tagline: ${rec.reason}
`).join('\n')}

Task:
Please write a highly customized, friendly, and expert recommendation breakdown. Format with markdown headers. It must cover the following sections:
1. **🔍 Personalized Matching Analysis**: Analyze the user's workflow or active lifestyle. Connect the top recommended product directly to their needs.
2. **🧠 The NLP Content engine (Natural Language Processing)**: Explain how the algorithm parsed the rich product descriptions (e.g. key words, switches, materials, ergonomics) and matched them directly to latent words in the user's biography. Highlight this as a remedy for the "Cold Start Problem".
3. **🤝 Peer Collaboration (Collaborative Filtering)**: Explain how peer rating trends (users with overlapping tastes) reinforced or complemented the content scores.
4. **🎯 Summary & Actionable Workstation/Lifestyle Tip**: Suggest an optimized workstation upgrade or daily routine adjustment based on their top product recommendation.

Keep the tone expert, warm, and highly professional. Avoid dry developer jargon. Be specific and refer directly to the descriptive text of the recommended items. Do not use generic statements.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const text = response.text;
    if (text) {
      res.json({ explanation: text, isFallback: false });
    } else {
      res.json({ explanation: getFallbackExplanation(), isFallback: true });
    }
  } catch (error: any) {
    console.error('Gemini API call failed:', error);
    res.json({
      explanation: getFallbackExplanation() + `\n\n*(Error calling Gemini API: ${error.message || error})*`,
      isFallback: true
    });
  }
});

// Configure Vite integration or serve static assets
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== 'production') {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware integrated for Development mode.');
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production build from dist/ folder.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started. Ingress listening on http://localhost:${PORT}`);
  });
}

setupViteOrStatic().catch(err => {
  console.error('Failed to initialize server middleware:', err);
});
