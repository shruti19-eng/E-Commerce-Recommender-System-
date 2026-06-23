**Collaborative Filtering & SVD Recommendation Engine Sandbox**

An immersive, full-stack interactive simulator and visualization sandbox for modern recommendation systems. This application implements, visualizes, and compares Memory-Based Collaborative Filtering (User-User and Item-Item Cosine Similarity) and Model-Based Collaborative Filtering (Latent Factor Model using Singular Value Decomposition trained via Stochastic Gradient Descent) alongside real-time AI-powered natural language explanations.

**📸 Application Screenshots**
Below are placeholders where you can add your custom screenshots of the application:
1. Unified Dashboard & Catalog Management
![alt text](https://github.com/shruti19-eng/E-Commerce-Recommender-System-/blob/main/Screenshot_1.png)
Select user personas, rate or delete items dynamically, and view customizable catalog item details.

3. Math & Matrix Similarity heatmaps
![alt text](screenshots/similarity_matrix.png)

Explore real-time Pearson Correlation and Cosine Similarity matrices for both User-to-User and Item-to-Item dimensions.
3. Animated SVD (SGD) Latent Factor Training Loop
![alt text](screenshots/svd_training.gif)

Watch the SVD training loop update in real-time as Stochastic Gradient Descent runs, tracking MSE loss drops with animated SVG line plots.
✨ Features
Dynamic Persona Selection: Switch between preset user personas with unique bios and category preferences (e.g., Tech enthusiast, Gourmet Chef, Bookworm).
Interactive Ratings & Catalog: Dynamically add, update, or remove 5-star ratings for catalog products, seeing recommendation scores update instantly.

Memory-Based CF Visualizer:
Full heatmaps of User-to-User and Item-to-Item similarities.
Interactive cell inspection explaining the exact similarity score between individual users or items.
Model-Based SVD (SGD) Simulator:
Interactive latent factor controls (dimensions, learning rate, regularization parameter 
).
Live Animated SGD Training: Watch the user-item factorization matrices converge step-by-step.
SVG-based real-time Mean Squared Error (MSE) loss history chart.
Interactive 2D/multi-dimensional latent coordinate display for users and products.
Explainable AI Integration: Powered by server-side Google Gemini API, click on any recommended item to request a natural language explanation of why that product fits the user persona and their rating profile.

🛠️ Architecture & Tech Stack
This is a modern Full-Stack SPA built with:
Frontend
React (v18+) with TypeScript for type safety.
Vite for optimized assets and lightning-fast developer experience.
Tailwind CSS for custom-themed slate/amber responsive layouts.
Framer Motion (motion/react) for smooth micro-interactions, layout transitions, and step-by-step training indicators.
Lucide React for clean iconography.
Backend
Node.js with Express custom server.
Built-in Vite middleware proxying for seamless dev routing.
Google GenAI SDK for server-side LLM inference.
Production bundling with esbuild compiling into a single self-contained CommonJS target (dist/server.cjs).

📐 Mathematical Formulation
1. Cosine Similarity
For users (or items) 
 and 
, similarity is computed on shared ratings vectors 
 and 
:
2. Singular Value Decomposition (SVD)
The user-item rating matrix 
 is approximated by the product of lower-dimensional user factors 
 and item factors 
:
Where:
: Global average rating.
: Bias terms for user 
 and item 
.
: Latent factor vectors of dimension 
.
3. Stochastic Gradient Descent (SGD) Update Rule
For each observed rating 
, we compute prediction error 
 and update parameters with learning rate 
 and regularization 
:
🚀 Getting Started
Prerequisites
Node.js (v18 or higher)
npm
Installation
Clone the repository:
code
Bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
Install dependencies:
code
Bash
npm install
Configure Environment Variables:
Create a .env file in the root directory (using .env.example as a template):
code
Env
GEMINI_API_KEY=your_actual_google_gemini_api_key_here
Running the Application
Development Mode (boots backend with on-the-fly TS parsing and Vite assets HMR):
code
Bash
npm run dev
Open your browser and navigate to http://localhost:3000.
Production Build & Launch (bundles React assets and transpiles the Express backend via esbuild):
code
Bash
npm run build
npm run start

📁 Repository Structure
code
Text
├── src/
│   ├── components/      # Modular visual sub-components
│   ├── data/
│   │   └── mockData.ts  # Default user personas & product catalog data
│   ├── utils/
│   │   └── recommender.ts # SVD model, Cosine similarity, & recommendation loops
│   ├── types.ts         # Central TypeScript interfaces & model schemas
│   ├── App.tsx          # Main layout dashboard containing panels & visualizations
│   ├── index.css        # Tailwind directives and custom fonts
│   └── main.tsx         # React root entry point
├── server.ts            # Full-stack Express server and Gemini proxy routes
├── package.json         # Build pipeline scripts & dependency configurations
└── vite.config.ts       # React-Vite environment build configurations

📄 License
This project is licensed under the MIT License. See the LICENSE file for details.
