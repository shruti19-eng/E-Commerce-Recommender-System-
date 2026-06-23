import { Product, UserPersona, Rating } from '../types';

export const mockProducts: Product[] = [
  {
    id: "p1",
    name: "Aether Mechanical Keyboard",
    category: "Electronics",
    description: "Custom premium mechanical keyboard with hot-swappable tactile brown switches, sleek anodized aluminum frame, and PBT double-shot keycaps. Equipped with custom acoustic dampening foam for a deeper sound signature and customizable per-key RGB backlighting. Ideal for programmer workstations and gaming enthusiasts who value heavy tactile typing feedback.",
    price: 149.99,
    imageUrl: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&q=80&w=400",
    tags: ["keyboard", "mechanical", "rgb", "programming", "gaming", "desk-accessory"]
  },
  {
    id: "p2",
    name: "ErgoFlow Mesh Office Chair",
    category: "Furniture",
    description: "Advanced high-back ergonomic desk chair featuring flexible mesh backrest, self-adjusting dynamic lumbar support, and multi-dimensional 4D armrests. Heavy-duty aluminum wheelbase with smooth gliding silent PU caster wheels. Designed to reduce spine fatigue and support long hours of productive working or streaming.",
    price: 349.99,
    imageUrl: "https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&q=80&w=400",
    tags: ["ergonomic", "furniture", "office", "chair", "home-setup", "wellness"]
  },
  {
    id: "p3",
    name: "HydroGrip Insulated Flask",
    category: "Outdoors",
    description: "Double-walled vacuum insulated stainless steel water bottle, 32 oz capacity. Features a durable powder-coat exterior finish and a leak-proof magnetic straw cap. Keeps cold beverages ice cold for up to 24 hours, or piping hot liquids hot for 12 hours. Sweat-proof design built for intense workouts, hiking trips, or daily hydration tracking.",
    price: 34.99,
    imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=400",
    tags: ["hydration", "flask", "sports", "outdoors", "fitness", "eco-friendly"]
  },
  {
    id: "p4",
    name: "BrewMaster Gooseneck Kettle",
    category: "Kitchen",
    description: "Sleek smart electric gooseneck kettle with precise degree-by-degree temperature control, real-time LCD display, and 1200W quick-heating element. Engineered with an elegant counterbalanced handle and narrow spout pour for surgical water control during pour-over coffee brewing and tea steep sessions.",
    price: 99.99,
    imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=400",
    tags: ["coffee", "tea", "kitchen", "kettle", "precision", "brewing"]
  },
  {
    id: "p5",
    name: "Minimalist Felt Desk Mat",
    category: "Furniture",
    description: "Premium thick wool felt desk pad crafted with vegan non-slip rubberized cork backing. Protects wood and glass desks from scratches while significantly reducing keyboard typing resonance and improving optical mouse tracking precision. Adds warmth and high-contrast texture to clean workspaces.",
    price: 29.99,
    imageUrl: "https://images.unsplash.com/photo-1632292224971-0d45778bd364?auto=format&fit=crop&q=80&w=400",
    tags: ["desk-mat", "wool-felt", "workspace", "minimalist", "decor", "aesthetic"]
  },
  {
    id: "p6",
    name: "AeroBuds Pro ANC Earbuds",
    category: "Electronics",
    description: "True wireless earbuds featuring advanced hybrid Active Noise Cancellation (ANC), ambient transparency mode, and customized dynamic drivers for rich bass. Equipped with 3-microphone call quality, IPX5 sweat resistance, and compact wireless charging case yielding up to 30 hours of continuous audio playback.",
    price: 119.99,
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=400",
    tags: ["earbuds", "audio", "noise-canceling", "wireless", "music", "bluetooth"]
  },
  {
    id: "p7",
    name: "Vanguard Rolltop Backpack",
    category: "Apparel",
    description: "Urban waterproof rolltop backpack constructed from high-tensile 1000D Cordura nylon. Designed with integrated padded compartment for 16-inch laptops, quick-access weather-sealed side zipper pockets, and ergonomic airmesh shoulder padding. Ideal for daily commuting, travel, and variable weather protection.",
    price: 89.99,
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400",
    tags: ["backpack", "travel", "waterproof", "luggage", "commuter", "apparel"]
  },
  {
    id: "p8",
    name: "ZenMatcha Ceremonial Tea",
    category: "Kitchen",
    description: "Premium hand-harvested ceremonial grade stone-ground Japanese matcha green tea powder. Direct-sourced from Uji, Kyoto. Vibrant emerald color with a sweet, rich umami taste and no bitterness. Whisk into hot water for a sustained L-Theanine focus lift, rich antioxidant benefits, and a calm, clean caffeine release.",
    price: 39.99,
    imageUrl: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=400",
    tags: ["matcha", "tea", "organic", "japanese", "groceries", "wellness"]
  },
  {
    id: "p9",
    name: "Lumina Smart Mood Lamp",
    category: "Electronics",
    description: "Ambient bedside smart lighting system offering 16 million colors, customizable gradient animation themes, and automated smart-home schedule sync. Designed with a gentle wake-up sunrise simulator alarm, relaxation audio soundscapes, and convenient app control. Improves sleep hygiene and creates room environments.",
    price: 59.99,
    imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=400",
    tags: ["lamp", "smart-home", "lighting", "rgb", "bedroom", "aesthetic"]
  },
  {
    id: "p10",
    name: "Apex Wireless Gaming Mouse",
    category: "Electronics",
    description: "Ultra-lightweight wireless gaming mouse weighing only 58g. Outfitted with an state-of-the-art 26,000 DPI sub-millimetric optical sensor, hybrid optical-mechanical click switches, and polling rates up to 4000Hz for lag-free cursor tracking. Ideal for high-stakes competitive esports matches and wrist health.",
    price: 79.99,
    imageUrl: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=400",
    tags: ["mouse", "gaming", "wireless", "lightweight", "esports", "desk-accessory"]
  }
];

export const mockPersonas: UserPersona[] = [
  {
    id: "u1",
    name: "Sarah (Tech Geek)",
    avatar: "👩‍💻",
    bio: "Software developer, hardware customizer, and mechanical keyboard enthusiast. Spends 10+ hours a day at her workstation and appreciates robust hardware, low-latency devices, and productivity optimization.",
    preferredCategories: ["Electronics", "Furniture"]
  },
  {
    id: "u2",
    name: "David (Athlete)",
    avatar: "🏃‍♂️",
    bio: "Marathon runner, outdoor trekker, and fitness coach. Prioritizes physical health, hydration, robust gear, and weather-proof storage options for active daily commuting and travel.",
    preferredCategories: ["Outdoors", "Apparel"]
  },
  {
    id: "u3",
    name: "Lily (Cozy Home Office)",
    avatar: "🍵",
    bio: "Remote content writer and tea connoisseur. Loves crafting a calm, warm, and aesthetically pleasing office environment. Relies on warm beverages, natural textures, and relaxing lighting to write.",
    preferredCategories: ["Kitchen", "Furniture"]
  },
  {
    id: "u4",
    name: "James (Student / Gamer)",
    avatar: "🎮",
    bio: "Computer Science student and competitive FPS gamer. Needs highly responsive accessories for high-performance esports, comfortable audio for study sessions, and rugged gear to carry books on campus.",
    preferredCategories: ["Electronics", "Apparel"]
  },
  {
    id: "u5",
    name: "Amanda (Ergonomic Designer)",
    avatar: "🎨",
    bio: "Product UX designer who strongly advocates for workspace wellness and ergonomics. Relies on advanced seating support, physical comfort, and minimalist aesthetic design accents.",
    preferredCategories: ["Furniture", "Kitchen"]
  }
];

export const initialRatings: Rating[] = [
  // Sarah (u1)
  { userId: "u1", productId: "p1", rating: 5, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5 }, // Mechanical Keyboard (Loves mechanical keys)
  { userId: "u1", productId: "p6", rating: 4, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 4 }, // Earbuds (Appreciates audio)
  { userId: "u1", productId: "p10", rating: 5, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3 }, // Gaming Mouse (Loves low latency)
  { userId: "u1", productId: "p5", rating: 4, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2 }, // Desk Mat (ワークスペース)

  // David (u2)
  { userId: "u2", productId: "p3", rating: 5, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 8 }, // Insulated Flask (High hydration need)
  { userId: "u2", productId: "p7", rating: 5, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 7 }, // Rolltop Backpack (Needs rugged gear)
  { userId: "u2", productId: "p9", rating: 3, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 6 }, // Smart Mood Lamp (Okay, but not core interest)
  { userId: "u2", productId: "p2", rating: 2, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5 }, // Office Chair (Too static, prefers standing or active)

  // Lily (u3)
  { userId: "u3", productId: "p4", rating: 5, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 10 }, // Kettle (Surgical control, tea lover)
  { userId: "u3", productId: "p5", rating: 5, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 9 }, // Desk Mat (Cozy wool felt texture)
  { userId: "u3", productId: "p8", rating: 5, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 8 }, // Matcha Tea (Perfect)
  { userId: "u3", productId: "p9", rating: 4, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 7 }, // Smart Mood Lamp (Bedside glow)
  { userId: "u3", productId: "p6", rating: 3, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 6 }, // Earbuds (Good, not mindblowing)

  // James (u4)
  { userId: "u4", productId: "p1", rating: 4, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 6 }, // Mechanical Keyboard (Great for typing homework)
  { userId: "u4", productId: "p6", rating: 5, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5 }, // ANC Earbuds (Essential for studying in library)
  { userId: "u4", productId: "p10", rating: 4, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 4 }, // Gaming Mouse (FPS competitive play)
  { userId: "u4", productId: "p7", rating: 4, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3 }, // Backpack (Good for carrying tech/books)

  // Amanda (u5)
  { userId: "u5", productId: "p2", rating: 5, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 7 }, // Ergonomic Chair (Absolute must-have)
  { userId: "u5", productId: "p5", rating: 5, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 6 }, // Felt Desk Mat (High aesthetics)
  { userId: "u5", productId: "p4", rating: 4, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5 }, // Kettle (Loves modern smart appliances)
  { userId: "u5", productId: "p1", rating: 3, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 4 }, // Keyboard (Prefers chiclet style, brown switches okay)
];
