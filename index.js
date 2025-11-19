// === GAME STATE ===
let gameState = 'openingCredits'; // openingCredits, titleScreen, strainSelect, locationSelect, growing, shop, hybridization, paused, settings, strainList, seedSelect
let player = {
    money: 500,
    inventory: {
        seeds: [
            // Seeds have: {strain, gender, quality}
            { strain: 'Northern Lights', gender: null, quality: 1.0 },
            { strain: 'Sour Diesel', gender: null, quality: 1.0 },
            { strain: 'Purple Haze', gender: null, quality: 1.0 }
        ],
        nutrients: { nitrogen: 10, phosphorus: 10, potassium: 10 },
        pesticide: 5,
        water: 100,
        lights: { type: 'basic', power: 100 }
    },
    harvestedWeed: [],
    completedFirstHarvest: false,
    unlockedStrains: ['Northern Lights', 'Sour Diesel', 'Purple Haze'] // Track unlocked strains
};

let plants = [];
let maxPlants = 4;
let gameTime = 0;
let dayNightCycle = 0;
let timeSpeed = 0.25; // Slowed down even more for relaxed gameplay (was 0.3)
let gamePaused = false;
let previousGameState = null;
let savedGameplayState = null; // Stores the actual gameplay state when entering pause/settings
let selectedParentPlant1 = null; // For hybridization
let selectedParentPlant2 = null; // For hybridization

// === AUDIO SYSTEM ===
let menuMusic, gameplayMusic, buttonSFX, notificationSFX;
let audioSettings = {
    musicVolume: 0.5,
    sfxVolume: 0.7,
    musicEnabled: true,
    sfxEnabled: true
};
let audioLoaded = false;

// === INTRO VIDEO SYSTEM ===
let introVideo; // Will reference the HTML video element
let videoLoaded = false;
let videoPlaying = false;
let videoSkipped = false;

// === WEATHER SYSTEM ===
let weather = {
    current: 'clear', // clear, cloudy, rainy, frost
    temperature: 70,
    humidity: 50,
    cloudCover: 0,
    rainIntensity: 0,
    frostWarning: false
};

// === STRAIN DATABASE ===
// 36 unique cannabis strains with breeding system
const strainDatabase = {
    // === STARTER STRAINS (Always unlocked) ===
    'Northern Lights': {
        color: [120, 255, 120],
        growthRate: 1.0,
        potency: 70,
        price: 15,
        flowering: 60,
        difficulty: 'easy',
        rarity: 'common',
        parents: null,
        unlocked: true,
        leafShape: 'wide',
        budDensity: 'medium',
        specialRequirement: null,
        hint: 'Starter strain - Always available'
    },
    'Sour Diesel': {
        color: [255, 255, 100],
        growthRate: 0.9,
        potency: 85,
        price: 20,
        flowering: 70,
        difficulty: 'medium',
        rarity: 'common',
        parents: null,
        unlocked: true,
        leafShape: 'narrow',
        budDensity: 'loose',
        specialRequirement: null,
        hint: 'Starter strain - Always available'
    },
    'Purple Haze': {
        color: [200, 120, 255],
        growthRate: 0.8,
        potency: 90,
        price: 25,
        flowering: 75,
        difficulty: 'hard',
        rarity: 'common',
        parents: null,
        unlocked: true,
        leafShape: 'medium',
        budDensity: 'dense',
        specialRequirement: null,
        hint: 'Starter strain - Always available'
    },

    // === TIER 1: Basic Crosses (Unlocked by breeding starters) ===
    'White Widow': {
        color: [200, 255, 200],
        growthRate: 0.95,
        potency: 80,
        price: 30,
        flowering: 65,
        difficulty: 'medium',
        rarity: 'uncommon',
        parents: ['Northern Lights', 'Sour Diesel'],
        unlocked: false,
        leafShape: 'wide',
        budDensity: 'dense',
        specialRequirement: null,
        hint: 'Cross Northern Lights + Sour Diesel'
    },
    'Blue Dream': {
        color: [150, 180, 255],
        growthRate: 0.85,
        potency: 85,
        price: 35,
        flowering: 68,
        difficulty: 'medium',
        rarity: 'uncommon',
        parents: ['Purple Haze', 'Northern Lights'],
        unlocked: false,
        leafShape: 'medium',
        budDensity: 'medium',
        specialRequirement: null,
        hint: 'Cross Purple Haze + Northern Lights'
    },
    'Green Crack': {
        color: [100, 255, 100],
        growthRate: 1.1,
        potency: 78,
        price: 28,
        flowering: 55,
        difficulty: 'easy',
        rarity: 'uncommon',
        parents: ['Sour Diesel', 'Northern Lights'],
        unlocked: false,
        leafShape: 'narrow',
        budDensity: 'loose',
        specialRequirement: null,
        hint: 'Cross Sour Diesel + Northern Lights'
    },
    'Granddaddy Purple': {
        color: [180, 100, 220],
        growthRate: 0.75,
        potency: 92,
        price: 40,
        flowering: 70,
        difficulty: 'medium',
        rarity: 'uncommon',
        parents: ['Purple Haze', 'Purple Haze'],
        unlocked: false,
        leafShape: 'wide',
        budDensity: 'dense',
        specialRequirement: null,
        hint: 'Cross Purple Haze with itself (same strain breeding)'
    },

    // === TIER 2: Advanced Crosses ===
    'OG Kush': {
        color: [140, 220, 140],
        growthRate: 0.88,
        potency: 88,
        price: 45,
        flowering: 65,
        difficulty: 'hard',
        rarity: 'rare',
        parents: ['White Widow', 'Green Crack'],
        unlocked: false,
        leafShape: 'medium',
        budDensity: 'dense',
        specialRequirement: 'indoor',
        hint: 'Cross White Widow + Green Crack indoors'
    },
    'Girl Scout Cookies': {
        color: [190, 160, 220],
        growthRate: 0.82,
        potency: 94,
        price: 50,
        flowering: 72,
        difficulty: 'hard',
        rarity: 'rare',
        parents: ['OG Kush', 'Granddaddy Purple'],
        unlocked: false,
        leafShape: 'medium',
        budDensity: 'dense',
        specialRequirement: null,
        hint: 'Cross OG Kush + Granddaddy Purple'
    },
    'Jack Herer': {
        color: [160, 240, 130],
        growthRate: 0.9,
        potency: 86,
        price: 42,
        flowering: 68,
        difficulty: 'medium',
        rarity: 'rare',
        parents: ['Northern Lights', 'Green Crack'],
        unlocked: false,
        leafShape: 'narrow',
        budDensity: 'medium',
        specialRequirement: null,
        hint: 'Cross Northern Lights + Green Crack'
    },
    'AK-47': {
        color: [200, 240, 180],
        growthRate: 0.92,
        potency: 90,
        price: 48,
        flowering: 66,
        difficulty: 'medium',
        rarity: 'rare',
        parents: ['Sour Diesel', 'White Widow'],
        unlocked: false,
        leafShape: 'medium',
        budDensity: 'medium',
        specialRequirement: null,
        hint: 'Cross Sour Diesel + White Widow'
    },

    // === TIER 3: Expert Level ===
    'Gorilla Glue #4': {
        color: [130, 200, 120],
        growthRate: 0.78,
        potency: 96,
        price: 60,
        flowering: 75,
        difficulty: 'hard',
        rarity: 'epic',
        parents: ['Girl Scout Cookies', 'OG Kush'],
        unlocked: false,
        leafShape: 'wide',
        budDensity: 'very dense',
        specialRequirement: null,
        hint: 'Cross Girl Scout Cookies + OG Kush'
    },
    'Gelato': {
        color: [220, 180, 255],
        growthRate: 0.8,
        potency: 95,
        price: 58,
        flowering: 70,
        difficulty: 'hard',
        rarity: 'epic',
        parents: ['Girl Scout Cookies', 'Blue Dream'],
        unlocked: false,
        leafShape: 'medium',
        budDensity: 'dense',
        specialRequirement: null,
        hint: 'Cross Girl Scout Cookies + Blue Dream'
    },
    'Zkittlez': {
        color: [255, 150, 200],
        growthRate: 0.83,
        potency: 93,
        price: 55,
        flowering: 68,
        difficulty: 'hard',
        rarity: 'epic',
        parents: ['Granddaddy Purple', 'Blue Dream'],
        unlocked: false,
        leafShape: 'wide',
        budDensity: 'dense',
        specialRequirement: null,
        hint: 'Cross Granddaddy Purple + Blue Dream'
    },
    'Wedding Cake': {
        color: [240, 220, 255],
        growthRate: 0.85,
        potency: 92,
        price: 56,
        flowering: 69,
        difficulty: 'hard',
        rarity: 'epic',
        parents: ['Girl Scout Cookies', 'White Widow'],
        unlocked: false,
        leafShape: 'medium',
        budDensity: 'very dense',
        specialRequirement: 'indoor',
        hint: 'Cross Girl Scout Cookies + White Widow indoors'
    },

    // === SPECIAL STRAINS (Unique requirements) ===
    'Alaskan Ice': {
        color: [180, 230, 255],
        growthRate: 0.7,
        potency: 88,
        price: 65,
        flowering: 80,
        difficulty: 'expert',
        rarity: 'epic',
        parents: ['White Widow', 'Blue Dream'],
        unlocked: false,
        leafShape: 'narrow',
        budDensity: 'medium',
        specialRequirement: 'frost',
        hint: 'Cross White Widow + Blue Dream, harvest during frost'
    },
    'Durban Poison': {
        color: [120, 255, 150],
        growthRate: 1.05,
        potency: 84,
        price: 38,
        flowering: 62,
        difficulty: 'medium',
        rarity: 'rare',
        parents: ['Sour Diesel', 'Green Crack'],
        unlocked: false,
        leafShape: 'narrow',
        budDensity: 'loose',
        specialRequirement: 'outdoor',
        hint: 'Cross Sour Diesel + Green Crack outdoors'
    },
    'Chemdog': {
        color: [170, 220, 150],
        growthRate: 0.87,
        potency: 91,
        price: 52,
        flowering: 71,
        difficulty: 'hard',
        rarity: 'rare',
        parents: ['OG Kush', 'Sour Diesel'],
        unlocked: false,
        leafShape: 'medium',
        budDensity: 'dense',
        specialRequirement: null,
        hint: 'Cross OG Kush + Sour Diesel'
    },
    'Strawberry Cough': {
        color: [255, 180, 180],
        growthRate: 0.9,
        potency: 82,
        price: 44,
        flowering: 64,
        difficulty: 'medium',
        rarity: 'rare',
        parents: ['Green Crack', 'Blue Dream'],
        unlocked: false,
        leafShape: 'medium',
        budDensity: 'medium',
        specialRequirement: null,
        hint: 'Cross Green Crack + Blue Dream'
    },

    // === TIER 4: Master Crosses ===
    'Runtz': {
        color: [255, 200, 255],
        growthRate: 0.81,
        potency: 97,
        price: 70,
        flowering: 73,
        difficulty: 'expert',
        rarity: 'legendary',
        parents: ['Zkittlez', 'Gelato'],
        unlocked: false,
        leafShape: 'medium',
        budDensity: 'very dense',
        specialRequirement: 'indoor',
        hint: 'Cross Zkittlez + Gelato indoors with perfect conditions'
    },
    'Sunset Sherbet': {
        color: [255, 170, 150],
        growthRate: 0.79,
        potency: 94,
        price: 62,
        flowering: 71,
        difficulty: 'hard',
        rarity: 'epic',
        parents: ['Girl Scout Cookies', 'Zkittlez'],
        unlocked: false,
        leafShape: 'wide',
        budDensity: 'dense',
        specialRequirement: null,
        hint: 'Cross Girl Scout Cookies + Zkittlez'
    },
    'Pineapple Express': {
        color: [255, 240, 100],
        growthRate: 0.93,
        potency: 87,
        price: 46,
        flowering: 66,
        difficulty: 'medium',
        rarity: 'rare',
        parents: ['Jack Herer', 'Green Crack'],
        unlocked: false,
        leafShape: 'narrow',
        budDensity: 'medium',
        specialRequirement: 'outdoor',
        hint: 'Cross Jack Herer + Green Crack outdoors'
    },
    'Tangie': {
        color: [255, 200, 100],
        growthRate: 0.88,
        potency: 85,
        price: 43,
        flowering: 67,
        difficulty: 'medium',
        rarity: 'rare',
        parents: ['Sour Diesel', 'Jack Herer'],
        unlocked: false,
        leafShape: 'narrow',
        budDensity: 'loose',
        specialRequirement: null,
        hint: 'Cross Sour Diesel + Jack Herer'
    },
    'Do-Si-Dos': {
        color: [210, 180, 240],
        growthRate: 0.82,
        potency: 93,
        price: 57,
        flowering: 70,
        difficulty: 'hard',
        rarity: 'epic',
        parents: ['Girl Scout Cookies', 'OG Kush'],
        unlocked: false,
        leafShape: 'medium',
        budDensity: 'very dense',
        specialRequirement: null,
        hint: 'Cross Girl Scout Cookies + OG Kush'
    },
    'MAC (Miracle Alien Cookies)': {
        color: [200, 220, 255],
        growthRate: 0.77,
        potency: 96,
        price: 68,
        flowering: 74,
        difficulty: 'expert',
        rarity: 'legendary',
        parents: ['Wedding Cake', 'Gorilla Glue #4'],
        unlocked: false,
        leafShape: 'wide',
        budDensity: 'very dense',
        specialRequirement: 'indoor',
        hint: 'Cross Wedding Cake + Gorilla Glue #4 indoors'
    },
    'Mimosa': {
        color: [255, 220, 150],
        growthRate: 0.84,
        potency: 91,
        price: 54,
        flowering: 68,
        difficulty: 'hard',
        rarity: 'epic',
        parents: ['Tangie', 'Purple Haze'],
        unlocked: false,
        leafShape: 'medium',
        budDensity: 'medium',
        specialRequirement: null,
        hint: 'Cross Tangie + Purple Haze'
    },
    'Gelatti': {
        color: [230, 190, 255],
        growthRate: 0.8,
        potency: 95,
        price: 64,
        flowering: 72,
        difficulty: 'expert',
        rarity: 'epic',
        parents: ['Gelato', 'Do-Si-Dos'],
        unlocked: false,
        leafShape: 'medium',
        budDensity: 'very dense',
        specialRequirement: null,
        hint: 'Cross Gelato + Do-Si-Dos'
    },

    // === ULTRA RARE (Legendary Tier) ===
    'Godfather OG': {
        color: [160, 200, 140],
        growthRate: 0.75,
        potency: 98,
        price: 80,
        flowering: 78,
        difficulty: 'expert',
        rarity: 'legendary',
        parents: ['OG Kush', 'Chemdog'],
        unlocked: false,
        leafShape: 'wide',
        budDensity: 'very dense',
        specialRequirement: 'indoor',
        hint: 'Cross OG Kush + Chemdog indoors with expert care'
    },
    'Bruce Banner': {
        color: [140, 255, 120],
        growthRate: 0.95,
        potency: 99,
        price: 85,
        flowering: 69,
        difficulty: 'expert',
        rarity: 'legendary',
        parents: ['OG Kush', 'Strawberry Cough'],
        unlocked: false,
        leafShape: 'medium',
        budDensity: 'very dense',
        specialRequirement: null,
        hint: 'Cross OG Kush + Strawberry Cough with high nutrients'
    },
    'White Truffle': {
        color: [245, 240, 255],
        growthRate: 0.72,
        potency: 97,
        price: 90,
        flowering: 76,
        difficulty: 'expert',
        rarity: 'legendary',
        parents: ['Gorilla Glue #4', 'Wedding Cake'],
        unlocked: false,
        leafShape: 'wide',
        budDensity: 'very dense',
        specialRequirement: 'frost',
        hint: 'Cross Gorilla Glue #4 + Wedding Cake, harvest in frost'
    },
    'Forbidden Fruit': {
        color: [200, 100, 180],
        growthRate: 0.78,
        potency: 94,
        price: 66,
        flowering: 72,
        difficulty: 'expert',
        rarity: 'epic',
        parents: ['Granddaddy Purple', 'Zkittlez'],
        unlocked: false,
        leafShape: 'wide',
        budDensity: 'dense',
        specialRequirement: null,
        hint: 'Cross Granddaddy Purple + Zkittlez'
    },
    'Biscotti': {
        color: [210, 200, 230],
        growthRate: 0.83,
        potency: 93,
        price: 61,
        flowering: 70,
        difficulty: 'hard',
        rarity: 'epic',
        parents: ['Gelato', 'Girl Scout Cookies'],
        unlocked: false,
        leafShape: 'medium',
        budDensity: 'very dense',
        specialRequirement: null,
        hint: 'Cross Gelato + Girl Scout Cookies'
    },
    'London Pound Cake': {
        color: [240, 210, 255],
        growthRate: 0.81,
        potency: 96,
        price: 72,
        flowering: 73,
        difficulty: 'expert',
        rarity: 'legendary',
        parents: ['Sunset Sherbet', 'Wedding Cake'],
        unlocked: false,
        leafShape: 'medium',
        budDensity: 'very dense',
        specialRequirement: 'indoor',
        hint: 'Cross Sunset Sherbet + Wedding Cake indoors'
    },
    'Apple Fritter': {
        color: [220, 180, 160],
        growthRate: 0.82,
        potency: 92,
        price: 59,
        flowering: 71,
        difficulty: 'hard',
        rarity: 'epic',
        parents: ['Do-Si-Dos', 'Sour Diesel'],
        unlocked: false,
        leafShape: 'medium',
        budDensity: 'dense',
        specialRequirement: null,
        hint: 'Cross Do-Si-Dos + Sour Diesel'
    },
    'Ice Cream Cake': {
        color: [230, 220, 245],
        growthRate: 0.79,
        potency: 95,
        price: 67,
        flowering: 72,
        difficulty: 'expert',
        rarity: 'epic',
        parents: ['Wedding Cake', 'Gelato'],
        unlocked: false,
        leafShape: 'wide',
        budDensity: 'very dense',
        specialRequirement: 'indoor',
        hint: 'Cross Wedding Cake + Gelato indoors'
    },
    'Pink Rozay': {
        color: [255, 180, 220],
        growthRate: 0.8,
        potency: 94,
        price: 63,
        flowering: 71,
        difficulty: 'hard',
        rarity: 'epic',
        parents: ['Zkittlez', 'Sunset Sherbet'],
        unlocked: false,
        leafShape: 'medium',
        budDensity: 'dense',
        specialRequirement: null,
        hint: 'Cross Zkittlez + Sunset Sherbet'
    },

    // === THE ULTIMATE STRAIN ===
    'CANNA GOLD': {
        color: [255, 215, 0],
        growthRate: 0.65,
        potency: 100,
        price: 150,
        flowering: 90,
        difficulty: 'master',
        rarity: 'mythic',
        parents: ['Runtz', 'White Truffle'],
        unlocked: false,
        leafShape: 'wide',
        budDensity: 'crystalline',
        specialRequirement: 'perfect',
        hint: 'The ultimate strain. Cross Runtz + White Truffle under perfect conditions (100% health, indoor, frost harvest)'
    }
};

let availableStrains = Object.keys(strainDatabase).filter(s => strainDatabase[s].unlocked);
let unlockedStrains = ['Northern Lights', 'Sour Diesel', 'Purple Haze']; // Track what player has unlocked
let selectedStrain = null;
let growLocation = null; // 'indoor' or 'outdoor'
let strainListPage = 0; // For pagination in strain list menu

// === UI ELEMENTS ===
let buttons = [];
let notifications = [];
let notificationBounds = []; // Track notification positions for tap-to-clear

// === PLANT CLASS ===
class Plant {
    constructor(strain, location, x, y) {
        this.strain = strain;
        this.location = location;
        this.x = x;
        this.y = y;
        this.age = 0;
        this.stage = 'seedling'; // seedling, vegetative, flowering, harvest
        this.health = 100;
        this.height = 20;
        this.width = 10;
        this.gender = random() > 0.5 ? 'female' : 'male';
        this.nutrients = { nitrogen: 50, phosphorus: 50, potassium: 50 };
        this.water = 80;
        this.light = 100;
        this.pests = 0;
        this.yield = 0;
        this.potency = strainDatabase[strain].potency;
        this.baseColor = strainDatabase[strain].color;
        this.currentColor = [...this.baseColor];
        this.leaves = [];
        this.buds = [];
        this.lastWatered = 0;
        this.lastFed = 0;
        this.selected = false;
        this.generateLeaves();
    }

    generateLeaves() {
        this.leaves = [];
        let numLeaves = floor(this.height / 10) + 2;
        let leafShape = strainDatabase[this.strain].leafShape;

        // Leaf characteristics based on strain
        let leafWidthMultiplier = leafShape === 'wide' ? 1.3 : leafShape === 'narrow' ? 0.7 : 1.0;
        let leafSizeBase = leafShape === 'wide' ? 12 : leafShape === 'narrow' ? 8 : 10;

        for (let i = 0; i < numLeaves; i++) {
            this.leaves.push({
                x: random(-this.width * leafWidthMultiplier, this.width * leafWidthMultiplier),
                y: -this.height * (i / numLeaves),
                size: random(leafSizeBase, leafSizeBase + 5),
                angle: random(-PI/4, PI/4),
                shape: leafShape
            });
        }
    }

    update() {
        this.age += timeSpeed;
        
        // Update growth stage - MUCH slower progression
        if (this.age < 1000) this.stage = 'seedling';
        else if (this.age < 3000) this.stage = 'vegetative';
        else if (this.age < 3000 + strainDatabase[this.strain].flowering * 3) this.stage = 'flowering';
        else this.stage = 'harvest';

        // Growth - slower and more observable
        if (this.health > 50 && this.stage !== 'harvest') {
            let growthRate = strainDatabase[this.strain].growthRate;
            if (this.stage === 'vegetative') growthRate *= 1.5;
            this.height += growthRate * 0.05 * timeSpeed;
            this.width = this.height * 0.4;
            if (floor(this.age) % 100 === 0) this.generateLeaves();
        }

        // Generate buds during flowering - slower, density varies by strain
        let budDensity = strainDatabase[this.strain].budDensity;
        let maxBuds = budDensity === 'very dense' || budDensity === 'crystalline' ? 16 :
                     budDensity === 'dense' ? 12 :
                     budDensity === 'loose' ? 8 : 10; // medium

        if (this.stage === 'flowering' && this.gender === 'female' && this.buds.length < maxBuds) {
            let budGenRate = budDensity === 'very dense' || budDensity === 'crystalline' ? 80 :
                           budDensity === 'dense' ? 100 : 120; // Dense strains bud faster

            if (floor(this.age) % budGenRate === 0) {
                let budSizeBase = budDensity === 'very dense' || budDensity === 'crystalline' ? 10 :
                                 budDensity === 'dense' ? 8 : 6;
                this.buds.push({
                    x: random(-this.width * 0.5, this.width * 0.5),
                    y: random(-this.height * 0.8, -this.height * 0.2),
                    size: random(budSizeBase, budSizeBase + 4),
                    crystals: [],
                    density: budDensity
                });
            }
        }

        // Nutrient depletion - much slower
        this.nutrients.nitrogen = max(0, this.nutrients.nitrogen - 0.03 * timeSpeed);
        this.nutrients.phosphorus = max(0, this.nutrients.phosphorus - 0.025 * timeSpeed);
        this.nutrients.potassium = max(0, this.nutrients.potassium - 0.028 * timeSpeed);

        // Water depletion - much slower
        this.water = max(0, this.water - 0.05 * timeSpeed);
        if (this.location === 'outdoor') this.water = max(0, this.water - 0.02 * timeSpeed);

        // Light management
        if (this.location === 'indoor') {
            this.light = player.inventory.lights.power;
        } else {
            this.light = 50 + sin(dayNightCycle) * 50; // Natural day/night
        }

        // Pest increase - much slower
        if (random() < 0.0005) {
            this.pests = min(100, this.pests + random(3, 8));
            addNotification(`🐛 Pests detected on ${this.strain}!`, 'warning');
        }

        // Calculate health
        this.calculateHealth();

        // Update color based on health
        this.updateColor();

        // Calculate yield for harvest
        if (this.stage === 'harvest' && this.yield === 0) {
            this.yield = this.calculateYield();
        }
    }

    calculateHealth() {
        let healthFactors = [];
        
        // Nutrient health
        let avgNutrients = (this.nutrients.nitrogen + this.nutrients.phosphorus + this.nutrients.potassium) / 3;
        healthFactors.push(avgNutrients);

        // Water health
        healthFactors.push(this.water);

        // Light health (optimal range 70-100)
        if (this.light >= 70) healthFactors.push(100);
        else healthFactors.push(this.light * 1.4);

        // Pest damage
        healthFactors.push(100 - this.pests);

        this.health = healthFactors.reduce((a, b) => a + b, 0) / healthFactors.length;
    }

    updateColor() {
        // Nitrogen deficiency - yellow leaves
        if (this.nutrients.nitrogen < 30) {
            this.currentColor[0] = 255;
            this.currentColor[1] = 255;
            this.currentColor[2] = 100;
        }
        // Phosphorus deficiency - purple/dark leaves
        else if (this.nutrients.phosphorus < 30) {
            this.currentColor[0] = 150;
            this.currentColor[1] = 100;
            this.currentColor[2] = 200;
        }
        // Potassium deficiency - brown edges
        else if (this.nutrients.potassium < 30) {
            this.currentColor[0] = 180;
            this.currentColor[1] = 150;
            this.currentColor[2] = 100;
        }
        // Overwatering - droopy dark green
        else if (this.water > 90) {
            this.currentColor[0] = 80;
            this.currentColor[1] = 120;
            this.currentColor[2] = 80;
        }
        // Underwatering - wilted brown
        else if (this.water < 20) {
            this.currentColor[0] = 140;
            this.currentColor[1] = 120;
            this.currentColor[2] = 80;
        }
        // Pest damage - spotted/damaged
        else if (this.pests > 40) {
            this.currentColor[0] = this.baseColor[0] * 0.7;
            this.currentColor[1] = this.baseColor[1] * 0.7;
            this.currentColor[2] = this.baseColor[2] * 0.7;
        }
        // Healthy
        else {
            this.currentColor = [...this.baseColor];
        }
    }

    calculateYield() {
        if (this.gender === 'male') return 0;
        let baseYield = this.height * 0.5;
        let healthMultiplier = this.health / 100;
        return floor(baseYield * healthMultiplier * this.buds.length * 0.5);
    }

    display() {
        push();
        translate(this.x, this.y);

        // Selection highlight with glow
        if (this.selected) {
            noFill();
            stroke(255, 255, 100, 200);
            strokeWeight(4);
            ellipse(0, 0, this.width * 3.5, this.height * 1.8);
            stroke(255, 255, 100, 100);
            strokeWeight(8);
            ellipse(0, 0, this.width * 3.7, this.height * 2);
        }

        // === POT WITH DETAIL ===
        // Pot rim highlight
        fill(180, 130, 70);
        noStroke();
        ellipse(0, -7, this.width * 2.2, 12);
        
        // Pot rim
        fill(160, 110, 60);
        stroke(120, 80, 40);
        strokeWeight(2);
        ellipse(0, -5, this.width * 2, 10);
        
        // Pot body with gradient effect
        noStroke();
        for (let i = 0; i < 5; i++) {
            let gradientY = -5 + i * 5;
            let gradientColor = map(i, 0, 5, 139, 110);
            fill(gradientColor, gradientColor * 0.65, gradientColor * 0.31);
            beginShape();
            let width1 = this.width * (2 - i * 0.06);
            let width2 = this.width * (2 - (i + 1) * 0.06);
            vertex(-width1 / 2, gradientY);
            vertex(width1 / 2, gradientY);
            vertex(width2 / 2, gradientY + 5);
            vertex(-width2 / 2, gradientY + 5);
            endShape(CLOSE);
        }
        
        // Pot shadow and base
        fill(80, 50, 30);
        ellipse(0, 22, this.width * 1.7, 8);

        // === SOIL WITH TEXTURE ===
        fill(101, 67, 33);
        noStroke();
        ellipse(0, 0, this.width * 1.9, 20);
        
        // Soil texture details
        fill(80, 50, 25);
        for (let i = 0; i < 8; i++) {
            let sx = random(-this.width * 0.8, this.width * 0.8);
            let sy = random(-8, 8);
            ellipse(sx, sy, random(3, 7), random(2, 5));
        }

        // === MAIN STEM WITH SEGMENTS ===
        let stemSegments = 5;
        for (let i = 0; i < stemSegments; i++) {
            let y1 = -this.height * (i / stemSegments);
            let y2 = -this.height * ((i + 1) / stemSegments);
            let w = this.width * (0.25 - i * 0.03);
            
            // Stem segment gradient
            let stemColor1 = lerpColor(color(85, 100, 75), color(110, 130, 95), i / stemSegments);
            let stemColor2 = lerpColor(color(95, 110, 80), color(115, 135, 100), i / stemSegments);
            
            // Left edge (shadow)
            stroke(red(stemColor1), green(stemColor1), blue(stemColor1));
            strokeWeight(w);
            line(-w * 0.3, y1, -w * 0.3, y2);
            
            // Center (main color)
            stroke(red(stemColor2), green(stemColor2), blue(stemColor2));
            strokeWeight(w * 0.8);
            line(0, y1, 0, y2);
            
            // Right edge (highlight)
            stroke(red(stemColor2) + 15, green(stemColor2) + 15, blue(stemColor2) + 15);
            strokeWeight(w * 0.5);
            line(w * 0.2, y1, w * 0.2, y2);
        }

        // === BRANCHES ===
        noFill();
        for (let i = 1; i < this.leaves.length; i += 2) {
            let leaf = this.leaves[i];
            let branchThickness = this.width * 0.08;
            
            // Branch shadow
            stroke(85, 100, 75);
            strokeWeight(branchThickness);
            line(0, leaf.y, leaf.x * 0.6, leaf.y - 3);
            
            // Branch main
            stroke(100, 120, 85);
            strokeWeight(branchThickness * 0.8);
            line(0, leaf.y, leaf.x * 0.6, leaf.y - 3);
        }

        // === DETAILED CANNABIS LEAVES ===
        for (let leaf of this.leaves) {
            push();
            translate(leaf.x, leaf.y);
            rotate(leaf.angle);
            
            // Determine leaf color based on health
            let leafColor;
            if (this.pests > 40 && random() < 0.3) {
                leafColor = color(100, 80, 60);
            } else {
                leafColor = color(this.currentColor[0], this.currentColor[1], this.currentColor[2]);
            }
            
            // Leaf shadow
            fill(red(leafColor) * 0.5, green(leafColor) * 0.5, blue(leafColor) * 0.5, 80);
            noStroke();
            beginShape();
            // Center spear
            vertex(0, -leaf.size + 2);
            vertex(leaf.size * 0.15, -leaf.size * 0.68);
            vertex(leaf.size * 0.22, -leaf.size * 0.38);
            // Right fingers
            vertex(leaf.size * 0.65, -leaf.size * 0.48);
            vertex(leaf.size * 0.75, -leaf.size * 0.18);
            vertex(leaf.size * 0.9, 0.02);
            vertex(leaf.size * 0.75, 0.12);
            vertex(leaf.size * 0.52, 0.22);
            vertex(leaf.size * 0.32, 0.27);
            vertex(0, 0.17);
            // Left fingers
            vertex(-leaf.size * 0.32, 0.27);
            vertex(-leaf.size * 0.52, 0.22);
            vertex(-leaf.size * 0.75, 0.12);
            vertex(-leaf.size * 0.9, 0.02);
            vertex(-leaf.size * 0.75, -leaf.size * 0.18);
            vertex(-leaf.size * 0.65, -leaf.size * 0.48);
            vertex(-leaf.size * 0.22, -leaf.size * 0.38);
            vertex(-leaf.size * 0.15, -leaf.size * 0.68);
            endShape(CLOSE);
            
            // Main leaf
            fill(leafColor);
            beginShape();
            // Center spear
            vertex(0, -leaf.size);
            vertex(leaf.size * 0.15, -leaf.size * 0.7);
            vertex(leaf.size * 0.2, -leaf.size * 0.4);
            // Right fingers
            vertex(leaf.size * 0.63, -leaf.size * 0.5);
            vertex(leaf.size * 0.73, -leaf.size * 0.2);
            vertex(leaf.size * 0.88, 0);
            vertex(leaf.size * 0.73, 0.1);
            vertex(leaf.size * 0.5, 0.2);
            vertex(leaf.size * 0.3, 0.25);
            vertex(0, 0.15);
            // Left fingers
            vertex(-leaf.size * 0.3, 0.25);
            vertex(-leaf.size * 0.5, 0.2);
            vertex(-leaf.size * 0.73, 0.1);
            vertex(-leaf.size * 0.88, 0);
            vertex(-leaf.size * 0.73, -leaf.size * 0.2);
            vertex(-leaf.size * 0.63, -leaf.size * 0.5);
            vertex(-leaf.size * 0.2, -leaf.size * 0.4);
            vertex(-leaf.size * 0.15, -leaf.size * 0.7);
            endShape(CLOSE);
            
            // Leaf veins - detailed
            stroke(red(leafColor) * 0.65, green(leafColor) * 0.65, blue(leafColor) * 0.65, 150);
            strokeWeight(0.8);
            // Center vein
            line(0, -leaf.size, 0, leaf.size * 0.15);
            // Right veins
            strokeWeight(0.5);
            line(0, -leaf.size * 0.4, leaf.size * 0.63, -leaf.size * 0.5);
            line(0, -leaf.size * 0.2, leaf.size * 0.73, -leaf.size * 0.2);
            line(0, 0, leaf.size * 0.88, 0);
            // Left veins
            line(0, -leaf.size * 0.4, -leaf.size * 0.63, -leaf.size * 0.5);
            line(0, -leaf.size * 0.2, -leaf.size * 0.73, -leaf.size * 0.2);
            line(0, 0, -leaf.size * 0.88, 0);
            
            // Leaf highlights
            noStroke();
            fill(255, 255, 255, 40);
            ellipse(leaf.size * 0.15, -leaf.size * 0.5, leaf.size * 0.3, leaf.size * 0.4);
            
            // Serrated edges
            stroke(red(leafColor) * 0.8, green(leafColor) * 0.8, blue(leafColor) * 0.8);
            strokeWeight(0.3);
            for (let i = 0; i < 15; i++) {
                let angle = map(i, 0, 14, -PI * 0.45, PI * 0.45);
                let r = leaf.size * 0.85;
                let x = cos(angle) * r;
                let y = sin(angle) * r - leaf.size * 0.2;
                point(x, y);
            }
            
            pop();
        }

        // === BUDS - HIGHLY DETAILED ===
        if (this.stage === 'flowering' || this.stage === 'harvest') {
            for (let bud of this.buds) {
                push();
                translate(bud.x, bud.y);
                
                if (this.gender === 'female') {
                    // Dense layered buds with depth
                    noStroke();
                    
                    // Base calyx structure (bottom layer)
                    fill(120, 180, 120, 220);
                    ellipse(-3, 3, bud.size * 1.3, bud.size * 1.5);
                    ellipse(3, 3, bud.size * 1.3, bud.size * 1.5);
                    ellipse(0, 0, bud.size * 1.2, bud.size * 1.4);
                    
                    // Middle layer
                    fill(140, 200, 140, 200);
                    ellipse(-2, -1, bud.size * 1.1, bud.size * 1.2);
                    ellipse(2, -1, bud.size * 1.1, bud.size * 1.2);
                    ellipse(0, -3, bud.size, bud.size * 1.1);
                    
                    // Top layer
                    fill(160, 220, 160, 180);
                    ellipse(-1.5, -4, bud.size * 0.9, bud.size);
                    ellipse(1.5, -4, bud.size * 0.9, bud.size);
                    ellipse(0, -6, bud.size * 0.8, bud.size * 0.9);
                    
                    // Sugar leaves
                    fill(180, 230, 180, 160);
                    for (let i = 0; i < 6; i++) {
                        let angle = (i / 6) * TWO_PI;
                        let lx = cos(angle) * bud.size * 0.5;
                        let ly = sin(angle) * bud.size * 0.5;
                        push();
                        translate(lx, ly);
                        rotate(angle);
                        triangle(-2, 0, 2, 0, 0, -bud.size * 0.4);
                        pop();
                    }
                    
                    // Pistils (orange/red hairs)
                    for (let i = 0; i < 12; i++) {
                        let angle = random(TWO_PI);
                        let len = random(bud.size * 0.5, bud.size * 0.9);
                        let curliness = random(-0.3, 0.3);
                        
                        stroke(255, random(150, 200), random(80, 120), 220);
                        strokeWeight(0.6);
                        noFill();
                        beginShape();
                        for (let t = 0; t < 1; t += 0.1) {
                            let x = cos(angle + curliness * t) * len * t;
                            let y = sin(angle + curliness * t) * len * t;
                            vertex(x, y);
                        }
                        endShape();
                    }
                    
                    // Trichomes (resin glands/crystals)
                    if (this.stage === 'harvest') {
                        noStroke();
                        for (let i = 0; i < 20; i++) {
                            let tx = random(-bud.size * 0.6, bud.size * 0.6);
                            let ty = random(-bud.size * 0.8, bud.size * 0.6);
                            
                            // Trichome stalk
                            stroke(240, 240, 255, 180);
                            strokeWeight(0.4);
                            line(tx, ty, tx, ty - 2);
                            
                            // Trichome head (gland)
                            noStroke();
                            fill(255, 255, 255, random(200, 255));
                            ellipse(tx, ty - 2, 1.8, 1.8);
                            fill(255, 255, 220, random(150, 220));
                            ellipse(tx, ty - 2, 2.5, 2.5);
                        }
                    }
                } else {
                    // Male pollen sacs - hanging cluster
                    noStroke();
                    
                    // Stem
                    stroke(200, 210, 180);
                    strokeWeight(1.5);
                    line(0, -bud.size * 0.3, 0, bud.size * 0.8);
                    
                    // Pollen sacs
                    noStroke();
                    fill(220, 220, 180);
                    ellipse(-2, bud.size * 0.2, bud.size * 0.6, bud.size * 0.9);
                    ellipse(2, bud.size * 0.3, bud.size * 0.6, bud.size * 0.9);
                    ellipse(0, bud.size * 0.5, bud.size * 0.55, bud.size * 0.85);
                    ellipse(-1.5, bud.size * 0.7, bud.size * 0.5, bud.size * 0.8);
                    ellipse(1.5, bud.size * 0.8, bud.size * 0.5, bud.size * 0.8);
                    
                    // Highlights on sacs
                    fill(240, 240, 210, 180);
                    ellipse(-2, bud.size * 0.15, bud.size * 0.3, bud.size * 0.45);
                    ellipse(2, bud.size * 0.25, bud.size * 0.3, bud.size * 0.45);
                    ellipse(0, bud.size * 0.45, bud.size * 0.28, bud.size * 0.4);
                }
                pop();
            }
        }

        // Health bar
        this.drawHealthBar();

        // Stage indicator with better styling
        fill(255, 255, 255, 230);
        textFont('Carter One');
        textAlign(CENTER);
        textSize(11);
        text(this.stage.toUpperCase(), 0, this.height + 40);
        
        textSize(10);
        fill(this.gender === 'female' ? color(255, 150, 200) : color(150, 150, 255));
        text(`${this.gender === 'female' ? '♀' : '♂'} ${this.strain}`, 0, this.height + 54);

        pop();
    }

    drawHealthBar() {
        let barWidth = 60;
        let barHeight = 8;
        let barY = 30;

        // Background
        fill(50);
        noStroke();
        rect(-barWidth / 2, barY, barWidth, barHeight, 2);

        // Health
        let healthColor = this.health > 70 ? [100, 255, 100] : 
                         this.health > 40 ? [255, 255, 100] : [255, 100, 100];
        fill(healthColor[0], healthColor[1], healthColor[2]);
        rect(-barWidth / 2, barY, (barWidth * this.health) / 100, barHeight, 2);

        // Border
        noFill();
        stroke(255);
        strokeWeight(1);
        rect(-barWidth / 2, barY, barWidth, barHeight, 2);
    }

    isClicked(mx, my) {
        return dist(mx, my, this.x, this.y) < this.width * 2;
    }

    addWater(amount) {
        this.water = min(100, this.water + amount);
        this.lastWatered = gameTime;
        addNotification(`💧 Watered ${this.strain}`, 'success');
    }

    feed(nutrientType, amount) {
        if (nutrientType === 'nitrogen') {
            this.nutrients.nitrogen = min(100, this.nutrients.nitrogen + amount);
        } else if (nutrientType === 'phosphorus') {
            this.nutrients.phosphorus = min(100, this.nutrients.phosphorus + amount);
        } else if (nutrientType === 'potassium') {
            this.nutrients.potassium = min(100, this.nutrients.potassium + amount);
        }
        this.lastFed = gameTime;
        addNotification(`🌱 Fed ${nutrientType} to ${this.strain}`, 'success');
    }

    treatPests() {
        this.pests = max(0, this.pests - 50);
        addNotification(`🔫 Treated pests on ${this.strain}`, 'success');
    }
}

// === BUTTON CLASS ===
class Button {
    constructor(x, y, w, h, label, action, color = [76, 175, 80]) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.label = label;
        this.action = action;
        this.color = color;
        this.hovered = false;
        this.enabled = true;
    }

    display() {
        push();
        
        // Button shadow
        fill(0, 0, 0, 80);
        noStroke();
        rect(this.x + 3, this.y + 3, this.w, this.h, 8);

        // Button background
        if (!this.enabled) {
            fill(80, 80, 80);
        } else if (this.hovered) {
            fill(this.color[0] + 30, this.color[1] + 30, this.color[2] + 30);
        } else {
            fill(this.color[0], this.color[1], this.color[2]);
        }
        stroke(255, 255, 255, 180);
        strokeWeight(2);
        rect(this.x, this.y, this.w, this.h, 8);

        // Button highlight
        if (this.enabled && !this.hovered) {
            fill(255, 255, 255, 40);
            noStroke();
            rect(this.x + 2, this.y + 2, this.w - 4, this.h / 3, 6);
        }

        // Button text
        textFont('Carter One');
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(min(this.h * 0.4, 18)); // Slightly better scaling and larger max
        text(this.label, this.x + this.w / 2, this.y + this.h / 2);

        pop();
    }

    isClicked(mx, my) {
        return this.enabled && mx > this.x && mx < this.x + this.w && 
               my > this.y && my < this.y + this.h;
    }

    checkHover(mx, my) {
        this.hovered = mx > this.x && mx < this.x + this.w && 
                      my > this.y && my < this.y + this.h;
    }
}

// === AUDIO FUNCTIONS ===
function preload() {
    // Load audio files
    try {
        soundFormats('mp3');
        menuMusic = loadSound('menu.mp3', () => console.log('Menu music loaded'), () => console.log('Menu music failed'));
        gameplayMusic = loadSound('gameplay.mp3', () => console.log('Gameplay music loaded'), () => console.log('Gameplay music failed'));
        audioLoaded = true;
    } catch (e) {
        console.log('Audio loading error:', e);
        audioLoaded = false;
    }

    // Note: Video is loaded in setup() to avoid autoplay restrictions
}

function playButtonSFX() {
    if (audioSettings.sfxEnabled && audioLoaded) {
        // Create beep sound programmatically using p5.sound
        let osc = new p5.Oscillator('sine');
        osc.amp(audioSettings.sfxVolume * 0.3);
        osc.freq(800);
        osc.start();
        osc.stop(0.1);
    }
}

function playNotificationSFX() {
    if (audioSettings.sfxEnabled && audioLoaded) {
        // Create notification beep sound
        let osc = new p5.Oscillator('sine');
        osc.amp(audioSettings.sfxVolume * 0.2);
        osc.freq(600);
        osc.start();
        osc.stop(0.15);
    }
}

function switchToMenuMusic() {
    if (!audioSettings.musicEnabled || !audioLoaded) return;

    if (gameplayMusic && gameplayMusic.isPlaying()) {
        gameplayMusic.stop();
    }
    if (menuMusic && !menuMusic.isPlaying()) {
        menuMusic.setVolume(audioSettings.musicVolume);
        menuMusic.loop();
    }
}

function switchToGameplayMusic() {
    if (!audioSettings.musicEnabled || !audioLoaded) return;

    if (menuMusic && menuMusic.isPlaying()) {
        menuMusic.stop();
    }
    if (gameplayMusic && !gameplayMusic.isPlaying()) {
        gameplayMusic.setVolume(audioSettings.musicVolume);
        gameplayMusic.loop();
    }
}

function stopAllMusic() {
    if (menuMusic && menuMusic.isPlaying()) menuMusic.stop();
    if (gameplayMusic && gameplayMusic.isPlaying()) gameplayMusic.stop();
}

function updateMusicVolume() {
    if (menuMusic) menuMusic.setVolume(audioSettings.musicVolume);
    if (gameplayMusic) gameplayMusic.setVolume(audioSettings.musicVolume);
}

// === WEATHER SYSTEM ===
function updateWeather() {
    if (growLocation !== 'outdoor') return;

    // Update weather every game day
    if (floor(gameTime) % 180 === 0 && gameTime > 0) {
        // Random weather changes
        let rand = random();
        if (rand < 0.6) {
            weather.current = 'clear';
            weather.cloudCover = random(0, 0.3);
            weather.rainIntensity = 0;
        } else if (rand < 0.85) {
            weather.current = 'cloudy';
            weather.cloudCover = random(0.5, 0.9);
            weather.rainIntensity = 0;
        } else {
            weather.current = 'rainy';
            weather.cloudCover = random(0.8, 1);
            weather.rainIntensity = random(0.3, 0.8);
        }

        // Check for frost - rare event, only in late flowering/harvest stage
        for (let plant of plants) {
            if ((plant.stage === 'flowering' || plant.stage === 'harvest') && random() < 0.05) {
                weather.current = 'frost';
                weather.frostWarning = true;
                addNotification('⚠️ FROST WARNING! Protect your plants!', 'warning');

                // Frost damage
                setTimeout(() => {
                    plant.health = max(20, plant.health - random(20, 40));
                    addNotification(`❄️ Frost damaged ${plant.strain}!`, 'error');
                }, 3000);
            }
        }
    }

    // Temperature and humidity variations
    weather.temperature = 60 + sin(dayNightCycle) * 20 + random(-5, 5);
    weather.humidity = 40 + random(0, 30);
}

// === SAVE/LOAD SYSTEM ===
function saveGame() {
    try {
        let saveData = {
            player: player,
            plants: plants.map(p => ({
                strain: p.strain,
                location: p.location,
                x: p.x,
                y: p.y,
                age: p.age,
                stage: p.stage,
                health: p.health,
                height: p.height,
                width: p.width,
                gender: p.gender,
                nutrients: p.nutrients,
                water: p.water,
                light: p.light,
                pests: p.pests,
                yield: p.yield,
                potency: p.potency,
                lastWatered: p.lastWatered,
                lastFed: p.lastFed
            })),
            gameTime: gameTime,
            dayNightCycle: dayNightCycle,
            growLocation: growLocation,
            selectedStrain: selectedStrain,
            weather: weather,
            audioSettings: audioSettings
        };

        localStorage.setItem('cannaCultivatorSave', JSON.stringify(saveData));
        addNotification('💾 Game saved successfully!', 'success');
        return true;
    } catch (e) {
        console.error('Save failed:', e);
        addNotification('❌ Failed to save game!', 'error');
        return false;
    }
}

function loadGame() {
    try {
        let saveData = localStorage.getItem('cannaCultivatorSave');
        if (!saveData) {
            addNotification('❌ No saved game found!', 'error');
            return false;
        }

        saveData = JSON.parse(saveData);

        // Restore player data
        player = saveData.player;
        gameTime = saveData.gameTime;
        dayNightCycle = saveData.dayNightCycle;
        growLocation = saveData.growLocation;
        selectedStrain = saveData.selectedStrain;
        weather = saveData.weather;

        // Restore audio settings
        if (saveData.audioSettings) {
            audioSettings = saveData.audioSettings;
            updateMusicVolume();
        }

        // Restore plants
        plants = [];
        for (let pData of saveData.plants) {
            let plant = new Plant(pData.strain, pData.location, pData.x, pData.y);
            plant.age = pData.age;
            plant.stage = pData.stage;
            plant.health = pData.health;
            plant.height = pData.height;
            plant.width = pData.width;
            plant.gender = pData.gender;
            plant.nutrients = pData.nutrients;
            plant.water = pData.water;
            plant.light = pData.light;
            plant.pests = pData.pests;
            plant.yield = pData.yield;
            plant.potency = pData.potency;
            plant.lastWatered = pData.lastWatered;
            plant.lastFed = pData.lastFed;
            plant.generateLeaves();
            plants.push(plant);
        }

        gameState = 'growing';
        switchToGameplayMusic();
        addNotification('📂 Game loaded successfully!', 'success');
        return true;
    } catch (e) {
        console.error('Load failed:', e);
        addNotification('❌ Failed to load game!', 'error');
        return false;
    }
}

function hasSavedGame() {
    return localStorage.getItem('cannaCultivatorSave') !== null;
}

// === NOTIFICATION SYSTEM ===
function addNotification(message, type = 'info') {
    notifications.push({
        message: message,
        type: type,
        time: gameTime,
        alpha: 255
    });
    playNotificationSFX();
}

function displayNotifications() {
    let isMobile = width < 768;
    let notifWidth = isMobile ? min(width - 20, 280) : min(320, width * 0.4);
    let notifHeight = isMobile ? 38 : 38; // Slightly larger on mobile
    let fontSize = isMobile ? 12 : 12; // More readable size
    let xOffset, yOffset;

    // Clear notification bounds for new frame
    notificationBounds = [];

    // On mobile, position at bottom to avoid overlap with UI elements
    // On desktop, position at top left as before
    if (isMobile) {
        xOffset = (width - notifWidth) / 2; // Center horizontally on mobile
        // Start from above control panel/buttons, work upwards
        // Different positioning based on game state
        let bottomMargin = 180; // Default margin for gameplay screen
        if (gameState === 'locationSelect') {
            bottomMargin = Math.max(400, height * 0.7); // Dynamic margin to avoid covering location cards on mobile
        } else if (gameState === 'strainSelect') {
            bottomMargin = 200; // Margin for strain selection
        } else if (gameState === 'seedSelect') {
            bottomMargin = Math.max(280, height * 0.55); // Dynamic margin for seed selection to avoid overlap
        } else if (gameState === 'shop' || gameState === 'hybridization' || gameState === 'strainList') {
            bottomMargin = 120; // Margin for menus with bottom buttons
        }
        yOffset = height - bottomMargin; // Start above UI elements with margin
    } else {
        // Desktop positioning - also consider game state
        xOffset = 10; // Left margin on desktop
        if (gameState === 'locationSelect' || gameState === 'seedSelect' || gameState === 'strainSelect') {
            yOffset = 85; // Start a bit lower on desktop for selection screens to avoid title overlap
        } else {
            yOffset = 75; // Start below the top UI bar on desktop
        }
    }

    for (let i = notifications.length - 1; i >= 0; i--) {
        let notif = notifications[i];
        let age = gameTime - notif.time;

        // MUCH faster clearing on mobile - after 40 frames on mobile, 90 on desktop
        let clearTime = isMobile ? 40 : 90;
        if (age > clearTime) {
            notif.alpha -= (isMobile ? 20 : 8); // Much faster fade on mobile
            if (notif.alpha <= 0) {
                notifications.splice(i, 1);
                continue;
            }
        }

        let bgColor = notif.type === 'success' ? [76, 175, 80] :
                     notif.type === 'warning' ? [255, 152, 0] :
                     notif.type === 'error' ? [244, 67, 54] : [33, 150, 243];

        push();
        // Notification background with hover effect
        fill(bgColor[0], bgColor[1], bgColor[2], notif.alpha * 0.95);
        stroke(255, notif.alpha);
        strokeWeight(2);
        rect(xOffset, yOffset, notifWidth, notifHeight, 8);

        // Add clickable indicator (small X icon on the right)
        fill(255, notif.alpha * 0.7);
        textFont('Arial');
        textAlign(RIGHT, CENTER);
        textSize(14);
        text('✕', xOffset + notifWidth - 10, yOffset + notifHeight / 2);

        // Notification text
        textFont('Carter One');
        fill(255, notif.alpha);
        noStroke();
        textAlign(isMobile ? CENTER : LEFT, CENTER);
        textSize(fontSize);
        text(notif.message, isMobile ? xOffset + notifWidth / 2 : xOffset + 10, yOffset + notifHeight / 2);
        pop();

        // Store notification bounds for tap detection
        notificationBounds.push({
            x: xOffset,
            y: yOffset,
            width: notifWidth,
            height: notifHeight,
            index: i
        });

        // Move position for next notification
        if (isMobile) {
            yOffset -= (notifHeight + 5); // Stack upwards on mobile
        } else {
            yOffset += (notifHeight + 5); // Stack downwards on desktop
        }
    }
}

// === P5.JS SETUP ===
function setup() {
    // Responsive canvas sizing that works on desktop and mobile
    let canvasWidth, canvasHeight;

    // Determine canvas dimensions based on device and orientation
    if (windowWidth < 768) {
        // Mobile devices - use FULL viewport for better experience
        canvasWidth = windowWidth;
        canvasHeight = windowHeight;
    } else {
        // Desktop/tablet - keep original behavior
        canvasWidth = min(800, windowWidth);
        canvasHeight = min(600, windowHeight);
    }

    let canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent('game-container');
    textFont('Arial');

    // Initialize tap-to-start and video intro handling (HTML-based like CLOSE ENCOUNTER)
    setupIntroVideoHandling();
    console.log('✓ Intro video setup complete');
}

function draw() {
    background(20, 40, 30);

    // Only update game time if not paused
    if (!gamePaused) {
        gameTime += timeSpeed;
        dayNightCycle += 0.006; // Slower, more relaxing day/night cycle - full cycle every ~1047 frames (about 17.5 seconds at 60fps)

        // Update weather system
        if (growLocation === 'outdoor') {
            updateWeather();
        }
    }

    // Route to different screens
    if (gameState === 'titleScreen') {
        drawTitleScreen();
    } else if (gameState === 'strainSelect') {
        drawStrainSelect();
    } else if (gameState === 'locationSelect') {
        drawLocationSelect();
    } else if (gameState === 'growing') {
        drawGrowingScreen();
    } else if (gameState === 'shop') {
        drawShop();
    } else if (gameState === 'paused') {
        drawPauseMenu();
    } else if (gameState === 'settings') {
        drawSettingsMenu();
    } else if (gameState === 'strainList') {
        drawStrainListMenu();
    } else if (gameState === 'hybridization') {
        drawHybridizationScreen();
    } else if (gameState === 'seedSelect') {
        drawSeedSelectScreen();
    }

    displayNotifications();

    // Display buttons
    for (let btn of buttons) {
        btn.checkHover(mouseX, mouseY);
        btn.display();
    }
}

// === TITLE SCREEN ===
function drawTitleScreen() {
    // Play menu music when on title screen
    switchToMenuMusic();

    push();

    // Animated background
    for (let i = 0; i < 20; i++) {
        let x = (i * 50 + gameTime * 2) % width;
        let y = sin(gameTime * 0.05 + i) * 50 + height / 2;
        fill(100, 255, 100, 30);
        noStroke();
        ellipse(x, y, 40, 40);
    }

    // Title with glow effect
    textFont('Bangers');

    // Glow layers
    fill(100, 255, 100, 50);
    textAlign(CENTER, CENTER);
    textSize(min(width * 0.115, 58));
    text('🌿 CANNA-CULTIVATOR! 🌿', width / 2 + 3, height / 3 + 3);

    fill(150, 255, 150, 100);
    textSize(min(width * 0.115, 58));
    text('🌿 CANNA-CULTIVATOR! 🌿', width / 2 + 2, height / 3 + 2);

    // Main title
    fill(220, 255, 220);
    textSize(min(width * 0.115, 58));
    text('🌿 CANNA-CULTIVATOR! 🌿', width / 2, height / 3);

    textFont('Carter One');
    textSize(min(width * 0.045, 22));
    fill(180, 255, 180);
    text('Cannabis Cultivation Simulator', width / 2, height / 3 + 50);

    // Animated plant with more detail
    push();
    translate(width / 2, height / 2 + 60);
    let bounce = sin(gameTime * 0.08) * 8;
    translate(0, bounce);

    // Pot
    fill(139, 90, 43);
    stroke(101, 67, 33);
    strokeWeight(2);
    ellipse(0, 15, 50, 20);
    rect(-25, 10, 50, 20, 5);

    // Main stem
    stroke(100, 150, 100);
    strokeWeight(6);
    line(0, 10, 0, -50);

    // Leaves
    noStroke();
    fill(120, 255, 120);
    for (let i = 0; i < 5; i++) {
        let angle = map(i, 0, 4, -PI / 2, PI / 2);
        push();
        rotate(angle);
        // Detailed leaf shape
        beginShape();
        vertex(0, -45);
        vertex(8, -35);
        vertex(10, -25);
        vertex(5, -20);
        vertex(0, -15);
        vertex(-5, -20);
        vertex(-10, -25);
        vertex(-8, -35);
        endShape(CLOSE);
        pop();
    }
    pop();

    pop();

    // Buttons - Responsive sizing for mobile
    buttons = [];
    let isMobile = width < 768;
    let btnWidth = isMobile ? min(width * 0.85, 300) : 240;
    let btnHeight = isMobile ? 55 : 50;
    let btnSpacing = 15;
    let startY = height - 220;

    // New Game button
    buttons.push(new Button(width / 2 - btnWidth / 2, startY, btnWidth, btnHeight, '🎮 NEW GAME', () => {
        playButtonSFX();
        gameState = 'strainSelect';
        addNotification('👋 Welcome to CANNA-CULTIVATOR!', 'success');
    }, [76, 175, 80]));

    // Continue Game button (if save exists)
    if (hasSavedGame()) {
        buttons.push(new Button(width / 2 - btnWidth / 2, startY + btnHeight + btnSpacing, btnWidth, btnHeight, '📂 CONTINUE', () => {
            playButtonSFX();
            loadGame();
        }, [100, 150, 220]));
    }

    // Settings button
    let settingsY = hasSavedGame() ? startY + (btnHeight + btnSpacing) * 2 : startY + btnHeight + btnSpacing;
    buttons.push(new Button(width / 2 - btnWidth / 2, settingsY, btnWidth, btnHeight, '⚙️ SETTINGS', () => {
        playButtonSFX();
        previousGameState = 'titleScreen';
        gameState = 'settings';
    }, [150, 100, 200]));

    // Fade in from black transition
    if (fadeAlpha > 0) {
        fadeAlpha -= 5; // Gradually decrease to reveal title screen
        fill(0, 0, 0, fadeAlpha);
        noStroke();
        rect(0, 0, width, height);
    }
}

// === STRAIN SELECTION ===
function drawStrainSelect() {
    // Play menu music
    switchToMenuMusic();

    push();

    // Title with better font - perfectly centered and responsive
    let isMobile = width < 768;
    textFont('Bangers');
    fill(220, 255, 220);
    textAlign(CENTER);
    textSize(isMobile ? min(width * 0.08, 32) : 32);
    textStyle(NORMAL); // Ensure no italic
    text('Choose Your Starter Strain', width / 2, 32);

    textFont('Carter One');
    textSize(isMobile ? min(width * 0.035, 14) : 14);
    textStyle(NORMAL); // Ensure no italic
    fill(180, 255, 180);
    text('Select your first cannabis seed (Like choosing your starter Pokemon!)', width / 2, 58);

    // Strain cards - responsive layout for mobile and desktop
    let cardWidth = isMobile ? min(width * 0.85, 260) : 240; // Scale down for mobile
    let cardHeight = isMobile ? min(cardWidth * 1.125, 290) : 270; // Maintain aspect ratio on mobile
    let spacing = isMobile ? 10 : 20;

    buttons = [];

    // Always show the 3 starter strains on first selection
    let strains = ['Northern Lights', 'Sour Diesel', 'Purple Haze'];

    // Mobile: horizontal scrolling for starter strains
    if (isMobile && width < 600) {
        // Add scroll position tracking
        if (typeof window.strainScrollIndex === 'undefined') {
            window.strainScrollIndex = 0;
        }

        let scrollIndex = window.strainScrollIndex || 0;
        scrollIndex = constrain(scrollIndex, 0, strains.length - 1);

        let strain = strains[scrollIndex];
        let data = strainDatabase[strain];

        let x = (width - cardWidth) / 2;
        let titleHeight = 70;
        let y = (height - cardHeight) / 2 + titleHeight / 2;

        // Card shadow
        fill(0, 0, 0, 80);
        noStroke();
        rect(x + 4, y + 4, cardWidth, cardHeight, 12);

        // Card background with glow
        fill(25, 50, 35);
        stroke(data.color[0], data.color[1], data.color[2], 200);
        strokeWeight(3);
        rect(x, y, cardWidth, cardHeight, 12);

        // Inner glow
        noFill();
        stroke(data.color[0], data.color[1], data.color[2], 80);
        strokeWeight(1);
        rect(x + 5, y + 5, cardWidth - 10, cardHeight - 10, 10);

        // Strain name with custom font - responsive text size
        textFont('Carter One');
        fill(data.color[0] + 30, data.color[1] + 30, data.color[2] + 30);
        noStroke();
        textAlign(CENTER);
        textSize(isMobile ? min(cardWidth * 0.075, 18) : 18);
        textStyle(NORMAL); // Remove italics
        text(strain, x + cardWidth / 2, y + 26);

        // Stats with better formatting - responsive text size
        textFont('Carter One');
        textSize(isMobile ? min(cardWidth * 0.054, 13) : 13);
        textStyle(NORMAL); // Remove italics
        fill(200, 255, 200);
        textAlign(LEFT);
        let statY = y + 52;
        let lineGap = isMobile ? min(cardWidth * 0.0875, 21) : 21;
        
        text(`🌱 Growth: ${data.growthRate}x`, x + 15, statY);
        text(`💪 Potency: ${data.potency}%`, x + 15, statY + lineGap);
        text(`💰 Value: $${data.price}/g`, x + 15, statY + lineGap * 2);
        text(`⏱️ Flower: ${data.flowering}d`, x + 15, statY + lineGap * 3);
        
        // Difficulty badge
        let diffColor = data.difficulty === 'easy' ? [100, 200, 100] :
                       data.difficulty === 'medium' ? [255, 200, 100] : [255, 120, 120];
        fill(diffColor[0], diffColor[1], diffColor[2]);
        text(`📊 ${data.difficulty.toUpperCase()}`, x + 15, statY + lineGap * 4);

        // Mini plant preview
        push();
        translate(x + cardWidth / 2, y + 215);
        
        // Pot
        fill(139, 90, 43);
        stroke(101, 67, 33);
        strokeWeight(1);
        ellipse(0, 5, 32, 14);
        rect(-16, 0, 32, 10, 3);
        
        // Stem
        stroke(100, 130, 90);
        strokeWeight(3);
        line(0, 0, 0, -30);
        
        // Leaves
        noStroke();
        fill(data.color[0], data.color[1], data.color[2]);
        for (let j = 0; j < 5; j++) {
            let angle = map(j, 0, 4, -PI / 2, PI / 2);
            push();
            rotate(angle);
            beginShape();
            vertex(0, -30);
            vertex(6, -25);
            vertex(7, -20);
            vertex(4, -17);
            vertex(0, -15);
            vertex(-4, -17);
            vertex(-7, -20);
            vertex(-6, -25);
            endShape(CLOSE);
            pop();
        }
        pop();

        // Select button
        buttons.push(new Button(
            x + 15,
            y + cardHeight - 45,
            cardWidth - 30,
            35,
            'SELECT',
            () => selectStrain(strain),
            [data.color[0] * 0.6, data.color[1] * 0.6, data.color[2] * 0.6]
        ));

        // Navigation arrows for mobile horizontal scrolling
        if (scrollIndex > 0) {
            buttons.push(new Button(10, y + cardHeight / 2 - 25, 50, 50, '◀', () => {
                playButtonSFX();
                window.strainScrollIndex = max(0, scrollIndex - 1);
            }, [100, 150, 100]));
        }

        if (scrollIndex < strains.length - 1) {
            buttons.push(new Button(width - 60, y + cardHeight / 2 - 25, 50, 50, '▶', () => {
                playButtonSFX();
                window.strainScrollIndex = min(strains.length - 1, scrollIndex + 1);
            }, [100, 150, 100]));
        }

        // Page indicator
        fill(200, 255, 200);
        textAlign(CENTER);
        textSize(14);
        text(`${scrollIndex + 1} / ${strains.length}`, width / 2, y + cardHeight + 35);

    } else {
        // Desktop or wider mobile screens: show all 3 cards
        let cols = 3;
        let rows = 1;

        let totalWidth = cols * cardWidth + (cols - 1) * spacing;
        let startX = (width - totalWidth) / 2;
        let titleHeight = 70;
        let startY = (height - cardHeight) / 2 + titleHeight / 2;

        for (let i = 0; i < strains.length; i++) {
            let strain = strains[i];
            let data = strainDatabase[strain];

            let col = i % cols;
            let x = startX + col * (cardWidth + spacing);
            let y = startY;

            // Card shadow
            fill(0, 0, 0, 80);
            noStroke();
            rect(x + 4, y + 4, cardWidth, cardHeight, 12);

            // Card background with glow
            fill(25, 50, 35);
            stroke(data.color[0], data.color[1], data.color[2], 200);
            strokeWeight(3);
            rect(x, y, cardWidth, cardHeight, 12);

            // Inner glow
            noFill();
            stroke(data.color[0], data.color[1], data.color[2], 80);
            strokeWeight(1);
            rect(x + 5, y + 5, cardWidth - 10, cardHeight - 10, 10);

            // Strain name with custom font
            textFont('Carter One');
            fill(data.color[0] + 30, data.color[1] + 30, data.color[2] + 30);
            noStroke();
            textAlign(CENTER);
            textSize(18);
            textStyle(NORMAL);
            text(strain, x + cardWidth / 2, y + 26);

            // Stats with better formatting
            textFont('Carter One');
            textSize(13);
            textStyle(NORMAL);
            fill(200, 255, 200);
            textAlign(LEFT);
            let statY = y + 52;
            let lineGap = 21;

            text(`🌱 Growth: ${data.growthRate}x`, x + 15, statY);
            text(`💪 Potency: ${data.potency}%`, x + 15, statY + lineGap);
            text(`💰 Value: $${data.price}/g`, x + 15, statY + lineGap * 2);
            text(`⏱️ Flower: ${data.flowering}d`, x + 15, statY + lineGap * 3);

            // Difficulty badge
            let diffColor = data.difficulty === 'easy' ? [100, 200, 100] :
                           data.difficulty === 'medium' ? [255, 200, 100] : [255, 120, 120];
            fill(diffColor[0], diffColor[1], diffColor[2]);
            text(`📊 ${data.difficulty.toUpperCase()}`, x + 15, statY + lineGap * 4);

            // Mini plant preview
            push();
            translate(x + cardWidth / 2, y + 215);

            // Pot
            fill(139, 90, 43);
            stroke(101, 67, 33);
            strokeWeight(1);
            ellipse(0, 5, 32, 14);
            rect(-16, 0, 32, 10, 3);

            // Stem
            stroke(100, 130, 90);
            strokeWeight(3);
            line(0, 0, 0, -30);

            // Leaves
            noStroke();
            fill(data.color[0], data.color[1], data.color[2]);
            for (let j = 0; j < 5; j++) {
                let angle = map(j, 0, 4, -PI / 2, PI / 2);
                push();
                rotate(angle);
                beginShape();
                vertex(0, -30);
                vertex(6, -25);
                vertex(7, -20);
                vertex(4, -17);
                vertex(0, -15);
                vertex(-4, -17);
                vertex(-7, -20);
                vertex(-6, -25);
                endShape(CLOSE);
                pop();
            }
            pop();

            // Select button
            buttons.push(new Button(
                x + 15,
                y + cardHeight - 45,
                cardWidth - 30,
                35,
                'SELECT',
                () => selectStrain(strain),
                [data.color[0] * 0.6, data.color[1] * 0.6, data.color[2] * 0.6]
            ));
        }
    }

    pop();
}

function selectStrain(strain) {
    playButtonSFX();
    selectedStrain = strain;
    player.inventory.seeds.push({
        strain: strain,
        gender: null // Unknown until planted
    });
    notifications = []; // Clear notifications to prevent overlap
    gameState = 'locationSelect';
    addNotification(`🌱 Selected ${strain}!`, 'success');
}

// === LOCATION SELECTION ===
function drawLocationSelect() {
    // Play menu music
    switchToMenuMusic();

    push();

    let isMobile = width < 768;

    textFont('Bangers');
    fill(220, 255, 220);
    textAlign(CENTER);
    textSize(isMobile ? min(width * 0.07, 28) : 34);
    textStyle(NORMAL); // Remove italics
    text('Choose Growing Location', width / 2, isMobile ? 30 : 40);

    buttons = [];

    // Cards with responsive sizing for mobile and desktop
    let cardWidth = isMobile ? min(width * 0.88, 300) : 340;
    let cardHeight = isMobile ? min(height * 0.36, 240) : 330; // Reduced height for mobile
    let spacing = isMobile ? 12 : 30;

    // Always stack vertically on mobile for better fit
    let stackVertical = isMobile;
    let totalWidth = stackVertical ? cardWidth : cardWidth * 2 + spacing;
    let totalHeight = stackVertical ? cardHeight * 2 + spacing : cardHeight;

    let startX = (width - totalWidth) / 2;
    let titleHeight = isMobile ? 45 : 60; // Space for title
    let cardY = stackVertical ? max(titleHeight + 10, (height - totalHeight) / 2) : (height - cardHeight) / 2 + titleHeight / 2; // Center vertically considering title

    // Indoor card
    let indoorX = startX;
    let indoorY = cardY;
    
    // Shadow
    fill(0, 0, 0, 80);
    noStroke();
    rect(indoorX + 4, indoorY + 4, cardWidth, cardHeight, 12);
    
    // Card
    fill(35, 35, 55);
    stroke(150, 150, 255);
    strokeWeight(3);
    rect(indoorX, indoorY, cardWidth, cardHeight, 12);

    textFont('Carter One');
    fill(180, 180, 255);
    noStroke();
    textAlign(CENTER); // Center alignment
    textSize(isMobile ? min(cardWidth * 0.073, 22) : 28);
    textStyle(NORMAL); // Remove italics
    text('🏠 INDOOR', indoorX + cardWidth / 2, indoorY + (isMobile ? 28 : 35));

    textFont('Carter One');
    textSize(isMobile ? min(cardWidth * 0.04, 12) : 15);
    textStyle(NORMAL); // Remove italics
    fill(200, 200, 255);
    textAlign(LEFT);
    let infoX = indoorX + (isMobile ? 12 : 18);
    let lineHeight = isMobile ? min(cardWidth * 0.058, 18) : 28;
    let startInfo = indoorY + (isMobile ? 50 : 70);
    text('✓ Controlled environment', infoX, startInfo);
    text('✓ No weather effects', infoX, startInfo + lineHeight);
    text('✓ Consistent lighting', infoX, startInfo + lineHeight * 2);
    text('✓ Year-round growing', infoX, startInfo + lineHeight * 3);
    fill(255, 150, 150);
    text('✗ Light upgrades needed', infoX, startInfo + lineHeight * 4);
    text('✗ Higher electricity cost', infoX, startInfo + lineHeight * 5);

    buttons.push(new Button(
        indoorX + (isMobile ? 20 : 30),
        indoorY + cardHeight - (isMobile ? 48 : 55),
        cardWidth - (isMobile ? 40 : 60),
        isMobile ? 38 : 45,
        'GROW INDOOR',
        () => startGrowing('indoor'),
        [100, 100, 220]
    ));

    // Outdoor card - adjust position for vertical stacking on mobile
    let outdoorX = stackVertical ? startX : startX + cardWidth + spacing;
    let outdoorY = stackVertical ? cardY + cardHeight + spacing : cardY;
    
    // Shadow
    fill(0, 0, 0, 80);
    noStroke();
    rect(outdoorX + 4, outdoorY + 4, cardWidth, cardHeight, 12);
    
    // Card
    fill(35, 55, 35);
    stroke(150, 255, 150);
    strokeWeight(3);
    rect(outdoorX, outdoorY, cardWidth, cardHeight, 12);

    textFont('Carter One');
    fill(180, 255, 180);
    noStroke();
    textAlign(CENTER); // Center alignment - FIX for outdoor title
    textSize(isMobile ? min(cardWidth * 0.073, 22) : 28);
    textStyle(NORMAL); // Remove italics
    text('🌞 OUTDOOR', outdoorX + cardWidth / 2, outdoorY + (isMobile ? 28 : 35));

    textFont('Carter One');
    textSize(isMobile ? min(cardWidth * 0.04, 12) : 15);
    textStyle(NORMAL); // Remove italics
    fill(200, 255, 200);
    textAlign(LEFT);
    let outX = outdoorX + (isMobile ? 12 : 18);
    let outStartInfo = outdoorY + (isMobile ? 50 : 70);
    text('✓ Natural sunlight (free)', outX, outStartInfo);
    text('✓ Larger plants possible', outX, outStartInfo + lineHeight);
    text('✓ No electricity needed', outX, outStartInfo + lineHeight * 2);
    text('✓ Authentic experience', outX, outStartInfo + lineHeight * 3);
    fill(255, 200, 150);
    text('✗ Weather dependent', outX, outStartInfo + lineHeight * 4);
    text('✗ More pest problems', outX, outStartInfo + lineHeight * 5);

    buttons.push(new Button(
        outdoorX + (isMobile ? 20 : 30),
        outdoorY + cardHeight - (isMobile ? 48 : 55),
        cardWidth - (isMobile ? 40 : 60),
        isMobile ? 38 : 45,
        'GROW OUTDOOR',
        () => startGrowing('outdoor'),
        [76, 185, 80]
    ));

    pop();
}

function startGrowing(location) {
    playButtonSFX();
    growLocation = location;

    // Create first plant
    let plantX = width / 2;
    let plantY = height / 2 + 50;
    plants.push(new Plant(selectedStrain, location, plantX, plantY));

    gameState = 'growing';
    switchToGameplayMusic(); // Switch to gameplay music
    addNotification(`🌱 Started growing ${selectedStrain} ${location}!`, 'success');
}

// === GROWING SCREEN ===
let selectedPlant = null;

function drawGrowingScreen() {
    // Background gradient based on location
    if (growLocation === 'indoor') {
        // Indoor warehouse grow facility - professional commercial setup
        // Dark background for warehouse atmosphere
        let bgColor = lerpColor(color(30, 32, 35), color(40, 42, 45), sin(gameTime * 0.01) * 0.5 + 0.5);
        background(bgColor);

        // Back wall - industrial warehouse concrete/cinder block
        noStroke();
        fill(60, 62, 65);
        rect(0, 0, width, height - 120);

        // Cinder block texture pattern on back wall
        stroke(45, 47, 50);
        strokeWeight(2);
        let blockWidth = 80;
        let blockHeight = 40;
        for (let y = 0; y < height - 120; y += blockHeight) {
            for (let x = 0; x < width; x += blockWidth) {
                let offsetX = (y / blockHeight) % 2 === 0 ? 0 : blockWidth / 2;
                rect(x + offsetX, y, blockWidth, blockHeight);
            }
        }

        // Industrial warehouse shelving/racks on sides
        noStroke();
        // Left rack structure
        fill(70, 70, 75);
        rect(10, height - 400, 15, 280); // Vertical support
        rect(10, height - 400, 80, 12); // Top shelf
        rect(10, height - 300, 80, 12); // Mid shelf
        rect(10, height - 200, 80, 12); // Bottom shelf

        // Right rack structure
        rect(width - 25, height - 400, 15, 280); // Vertical support
        rect(width - 90, height - 400, 80, 12); // Top shelf
        rect(width - 90, height - 300, 80, 12); // Mid shelf
        rect(width - 90, height - 200, 80, 12); // Bottom shelf

        // Metal rack highlights
        fill(90, 90, 95);
        rect(12, height - 402, 11, 3); // Left highlights
        rect(width - 23, height - 402, 11, 3); // Right highlights

        // Floor - polished concrete warehouse floor
        fill(55, 57, 60);
        rect(0, height - 120, width, 120);

        // Concrete floor expansion joints
        stroke(40, 42, 45);
        strokeWeight(3);
        for (let x = 0; x < width; x += 120) {
            line(x, height - 120, x, height);
        }
        for (let y = height - 120; y < height; y += 100) {
            line(0, y, width, y);
        }

        // Floor shine/reflection effect
        noStroke();
        fill(70, 72, 75, 60);
        ellipse(width / 2, height - 80, width * 0.6, 40);

        // Warehouse pipes and ductwork along ceiling
        fill(80, 82, 85);
        rect(width * 0.15, 15, width * 0.7, 10, 5); // Main duct
        rect(width * 0.25, 15, 8, 40); // Vertical pipe
        rect(width * 0.75, 15, 8, 40); // Vertical pipe

        // Professional LED grow lights with realistic glow
        noStroke();
        for (let i = 0; i < 3; i++) {
            let lx = width / 4 + i * width / 4;
            let ly = 30;

            // Light fixture body
            fill(80, 80, 90);
            rect(lx - 45, ly - 12, 90, 24, 4);
            fill(60, 60, 70);
            rect(lx - 42, ly - 10, 84, 20, 3);

            // LED panels
            fill(220, 180, 255);
            for (let led = 0; led < 6; led++) {
                let ledX = lx - 35 + led * 14;
                rect(ledX, ly - 6, 10, 12, 2);
            }

            // Powerful LED light beam effect
            fill(255, 230, 255, 40);
            triangle(lx - 50, ly + 12, lx + 50, ly + 12, lx + 100, height - 140);
            triangle(lx - 50, ly + 12, lx + 50, ly + 12, lx - 100, height - 140);

            // Concentrated light cone
            fill(255, 220, 255, 60);
            triangle(lx - 35, ly + 12, lx + 35, ly + 12, lx + 60, height - 140);
            triangle(lx - 35, ly + 12, lx + 35, ly + 12, lx - 60, height - 140);

            // Bright center beam
            fill(255, 240, 255, 80);
            triangle(lx - 25, ly + 12, lx + 25, ly + 12, lx, height - 140);

            // Glow around light
            fill(255, 200, 255, 80);
            ellipse(lx, ly, 100, 40);
            fill(255, 220, 255, 50);
            ellipse(lx, ly, 130, 50);
        }

        // Atmospheric haze from humidity
        fill(200, 220, 255, 15);
        for (let i = 0; i < 5; i++) {
            let hY = height - 140 + i * 30;
            ellipse(width / 2, hY, width * 0.8, 40);
        }
    } else {
        // Outdoor environment - enhanced realistic graphics
        let timeOfDay = (sin(dayNightCycle) + 1) / 2; // 0 = night, 1 = day

        // Enhanced sky colors with more vibrant sunset/sunrise transitions
        let dayTopColor = color(87, 167, 230);      // Bright blue
        let dayBottomColor = color(165, 210, 240);  // Light blue horizon
        let sunsetTopColor = color(255, 140, 100);  // Orange-pink
        let sunsetBottomColor = color(255, 200, 150); // Peachy horizon
        let nightTopColor = color(10, 15, 45);      // Deep night blue
        let nightBottomColor = color(50, 55, 85);   // Lighter night horizon

        let topColor, bottomColor;

        // Determine sky colors based on time
        if (timeOfDay > 0.6) {
            // Full daytime
            topColor = dayTopColor;
            bottomColor = dayBottomColor;
        } else if (timeOfDay > 0.4) {
            // Sunrise
            let sunriseMix = map(timeOfDay, 0.4, 0.6, 0, 1);
            topColor = lerpColor(sunsetTopColor, dayTopColor, sunriseMix);
            bottomColor = lerpColor(sunsetBottomColor, dayBottomColor, sunriseMix);
        } else if (timeOfDay > 0.15) {
            // Sunset
            let sunsetMix = map(timeOfDay, 0.15, 0.4, 0, 1);
            topColor = lerpColor(nightTopColor, sunsetTopColor, sunsetMix);
            bottomColor = lerpColor(nightBottomColor, sunsetBottomColor, sunsetMix);
        } else {
            // Full nighttime
            topColor = nightTopColor;
            bottomColor = nightBottomColor;
        }

        // Gradient sky with smooth transitions
        for (let y = 0; y < height - 100; y++) {
            let inter = map(y, 0, height - 100, 0, 1);
            let c = lerpColor(topColor, bottomColor, inter * inter); // Quadratic for more realistic
            stroke(c);
            line(0, y, width, y);
        }

        // Distant mountains/hills for depth
        noStroke();
        fill(70, 120, 90, 180 * timeOfDay);
        beginShape();
        vertex(0, height - 100);
        for (let x = 0; x <= width; x += 50) {
            let hillHeight = sin(x * 0.01 + 1) * 40 + 60;
            vertex(x, height - 100 - hillHeight);
        }
        vertex(width, height - 100);
        endShape(CLOSE);

        // Second layer of closer hills
        fill(90, 140, 100, 200 * timeOfDay);
        beginShape();
        vertex(0, height - 100);
        for (let x = 0; x <= width; x += 40) {
            let hillHeight = sin(x * 0.015 + 3) * 30 + 40;
            vertex(x, height - 100 - hillHeight);
        }
        vertex(width, height - 100);
        endShape(CLOSE);

        // Beautiful clouds during day with variety
        if (timeOfDay > 0.3) {
            noStroke();
            for (let i = 0; i < 7; i++) {
                let cx = (i * 180 + gameTime * 0.4) % (width + 150) - 75;
                let cy = 50 + sin(i * 2.5) * 50;
                let cloudOpacity = 180 * timeOfDay;

                // Fluffy cloud shape
                fill(255, 255, 255, cloudOpacity * 0.9);
                ellipse(cx, cy, 90, 45);
                ellipse(cx - 30, cy + 8, 70, 40);
                ellipse(cx + 30, cy + 8, 70, 40);
                ellipse(cx - 15, cy - 5, 60, 35);
                ellipse(cx + 15, cy - 5, 60, 35);

                // Cloud highlights
                fill(255, 255, 255, cloudOpacity);
                ellipse(cx - 10, cy - 8, 40, 25);
                ellipse(cx + 10, cy - 8, 40, 25);
            }
        }
        
        // Sun or Moon traveling in arc across sky
        push();
        // Calculate position in arc - goes from left to right
        let arcProgress = (dayNightCycle % TWO_PI) / TWO_PI; // 0 to 1 through full cycle
        
        // X position: travels from left (50) to right (width - 50)
        let celestialX = map(arcProgress, 0, 1, 50, width - 50);
        
        // Y position: arc shape - highest at middle of sky
        // Use sine for arc, with adjustments for realistic trajectory
        let arcHeight = sin(arcProgress * PI); // 0 at horizons, 1 at peak
        let celestialY = map(arcHeight, 0, 1, height - 80, 60);
        
        if (timeOfDay > 0.2) {
            // Sun with corona - only visible during day
            noStroke();
            fill(255, 255, 100, 80);
            ellipse(celestialX, celestialY, 100, 100);
            fill(255, 255, 150, 120);
            ellipse(celestialX, celestialY, 80, 80);
            fill(255, 255, 200);
            ellipse(celestialX, celestialY, 60, 60);
            fill(255, 255, 230);
            ellipse(celestialX, celestialY, 50, 50);
            
            // Sun rays rotating
            stroke(255, 255, 200, 100);
            strokeWeight(2);
            for (let i = 0; i < 12; i++) {
                let angle = (i / 12) * TWO_PI + gameTime * 0.01;
                let x1 = celestialX + cos(angle) * 35;
                let y1 = celestialY + sin(angle) * 35;
                let x2 = celestialX + cos(angle) * 50;
                let y2 = celestialY + sin(angle) * 50;
                line(x1, y1, x2, y2);
            }
        } else {
            // Moon with craters - visible at night
            // Moon follows same arc but on opposite side
            let moonProgress = (arcProgress + 0.5) % 1; // Offset by half cycle
            let moonX = map(moonProgress, 0, 1, 50, width - 50);
            let moonArcHeight = sin(moonProgress * PI);
            let moonY = map(moonArcHeight, 0, 1, height - 80, 60);
            
            noStroke();
            fill(220, 220, 240, 200);
            ellipse(moonX, moonY, 45, 45);
            fill(200, 200, 220, 150);
            ellipse(moonX - 8, moonY - 5, 12, 12);
            ellipse(moonX + 6, moonY + 3, 8, 8);
            ellipse(moonX - 3, moonY + 10, 6, 6);
            
            // Stars
            fill(255, 255, 255, 200 * (1 - timeOfDay));
            for (let i = 0; i < 50; i++) {
                let sx = (i * 57.3) % width;
                let sy = (i * 37.9) % (height - 100);
                ellipse(sx, sy, 2, 2);
            }
        }
        pop();

        // Farm field ground layers with agricultural features
        noStroke();

        // Rich topsoil layer
        fill(101, 67, 33);
        rect(0, height - 95, width, 95);

        // Plowed field furrows/crop rows
        stroke(80, 50, 25);
        strokeWeight(2);
        let furrowSpacing = 40;
        for (let i = 0; i < width; i += furrowSpacing) {
            // Perspective furrows that get closer together in distance
            let startX = i;
            let endX = map(i, 0, width, width * 0.3, width * 0.7);
            line(startX, height - 95, endX, height - 140);
        }

        // Soil texture variation between rows
        noStroke();
        for (let i = 0; i < 30; i++) {
            fill(random(80, 120), random(50, 80), random(25, 45), random(30, 80));
            let sx = random(width);
            let sy = random(height - 95, height);
            ellipse(sx, sy, random(5, 15), random(3, 8));
        }

        // Farm field edge with grass border
        let grassBaseColor = lerpColor(color(65, 150, 30), color(85, 180, 40), timeOfDay);
        fill(grassBaseColor);
        rect(0, height - 110, width, 15);

        // Grass texture patches along edge
        fill(red(grassBaseColor) - 10, green(grassBaseColor) - 10, blue(grassBaseColor) - 10, 100);
        for (let i = 0; i < 15; i++) {
            let gx = random(width);
            ellipse(gx, height - 105, random(20, 50), random(8, 12));
        }

        // Grass/weeds growing along field edge
        for (let i = 0; i < width; i += 8) {
            let bladeHeight = random(10, 18);
            let bladeColor = lerpColor(
                color(50, 130, 25),
                color(80, 170, 35),
                random()
            );
            stroke(bladeColor);
            strokeWeight(random(1, 2.5));
            let bendX = random(-3, 3);
            let bendY = height - 110 - bladeHeight;

            // Curved grass blade
            noFill();
            beginShape();
            vertex(i, height - 110);
            vertex(i + bendX * 0.3, height - 110 - bladeHeight * 0.3);
            vertex(i + bendX * 0.6, height - 110 - bladeHeight * 0.7);
            vertex(i + bendX, bendY);
            endShape();
        }

        // Farm fence in background
        noStroke();
        fill(120, 80, 50);
        // Fence posts
        for (let i = 0; i < width; i += 100) {
            rect(i, height - 160, 8, 50);
        }
        // Horizontal fence rails
        fill(110, 75, 45);
        rect(0, height - 140, width, 6);
        rect(0, height - 120, width, 6);

        // Wildflowers scattered in grass (daytime only)
        if (timeOfDay > 0.5) {
            noStroke();
            for (let i = 0; i < 12; i++) {
                let fx = (i * 67 + gameTime * 0.1) % width;
                let fy = height - 110 - random(5, 12);

                // Flower colors - yellows, purples, whites
                let flowerColors = [
                    color(255, 220, 50),
                    color(200, 100, 255),
                    color(255, 255, 255),
                    color(255, 150, 200)
                ];
                let flowerColor = random(flowerColors);

                // Flower petals
                fill(flowerColor);
                for (let p = 0; p < 5; p++) {
                    let angle = (p / 5) * TWO_PI;
                    ellipse(fx + cos(angle) * 2, fy + sin(angle) * 2, 4, 4);
                }

                // Flower center
                fill(255, 200, 50);
                ellipse(fx, fy, 3, 3);
            }
        }
    }

    // Update and display plants
    for (let plant of plants) {
        plant.update();
        plant.display();
    }

    // Top UI bar - non-overlapping
    drawTopUI();

    // Selected plant details - better positioned
    if (selectedPlant) {
        drawPlantDetails(selectedPlant);
    }

    // Bottom control panel - clear separation
    drawControlPanel();

    // Setup buttons
    setupGrowingButtons();
}

function drawTopUI() {
    let isMobile = width < 768;
    let headerHeight = isMobile ? 75 : 65; // Reduced mobile header height to prevent overlap

    // Enhanced header with gradient background
    noStroke();
    // Gradient from dark green to darker green
    for (let i = 0; i < headerHeight; i++) {
        let alpha = map(i, 0, headerHeight, 250, 235);
        let greenShade = map(i, 0, headerHeight, 15, 20);
        fill(greenShade, greenShade + 10, greenShade, alpha);
        rect(0, i, width, 1);
    }

    // Decorative border with glow effect
    stroke(76, 175, 80, 200);
    strokeWeight(3);
    line(0, headerHeight, width, headerHeight);
    stroke(100, 220, 100, 100);
    strokeWeight(1);
    line(0, headerHeight - 2, width, headerHeight - 2);

    textFont('Carter One');
    noStroke();

    if (isMobile) {
        // MOBILE LAYOUT - More Compact and efficient to prevent overlap
        textAlign(LEFT, CENTER);

        // Row 1: Money and Day - ultra compact layout
        fill(255, 215, 0);
        textSize(12); // Smaller text
        textStyle(BOLD);
        text(`💰 $${player.money}`, 6, 11);

        fill(180, 255, 180);
        textSize(10); // Smaller text
        textStyle(NORMAL);
        text(`📅 Day ${floor(gameTime / 180)}`, 6, 24);

        // Row 2: Inventory display - more compact to fit better
        textAlign(CENTER, CENTER);
        textSize(8); // Smaller icons/text
        textStyle(BOLD);

        let itemW = width / 6;
        let row2Y = 47; // Higher position to be more compact
        let boxHeight = 24; // Smaller height

        // Water
        fill(41, 128, 185, 40);
        rect(0, row2Y - 8, itemW, boxHeight, 0);
        fill(100, 200, 255);
        text(`💧\n${floor(player.inventory.water)}`, itemW * 0.5, row2Y + 4);

        // Nitrogen
        fill(46, 125, 50, 40);
        rect(itemW, row2Y - 8, itemW, boxHeight, 0);
        fill(120, 255, 120);
        text(`🌱\n${floor(player.inventory.nutrients.nitrogen)}`, itemW * 1.5, row2Y + 4);

        // Phosphorus
        fill(142, 68, 173, 40);
        rect(itemW * 2, row2Y - 8, itemW, boxHeight, 0);
        fill(220, 130, 255);
        text(`🌸\n${floor(player.inventory.nutrients.phosphorus)}`, itemW * 2.5, row2Y + 4);

        // Potassium
        fill(230, 126, 34, 40);
        rect(itemW * 3, row2Y - 8, itemW, boxHeight, 0);
        fill(255, 200, 120);
        text(`🍌\n${floor(player.inventory.nutrients.potassium)}`, itemW * 3.5, row2Y + 4);

        // Pesticide
        fill(211, 84, 0, 40);
        rect(itemW * 4, row2Y - 8, itemW, boxHeight, 0);
        fill(255, 140, 140);
        text(`🔫\n${player.inventory.pesticide}`, itemW * 4.5, row2Y + 4);

        // Light power
        fill(241, 196, 15, 40);
        rect(itemW * 5, row2Y - 8, itemW, boxHeight, 0);
        fill(255, 255, 180);
        text(`💡\n${player.inventory.lights.power}%`, itemW * 5.5, row2Y + 4);

    } else {
        // DESKTOP LAYOUT - Original design
        // LEFT SECTION - Money & Day
        fill(255, 215, 0, 30);
        ellipse(35, 22, 50, 50);
        fill(255, 215, 0);
        textAlign(LEFT, CENTER);
        textSize(22);
        textStyle(BOLD);
        text(`💰 $${player.money}`, 15, 20);

        fill(124, 179, 66, 30);
        rect(10, 38, 140, 22, 4);
        fill(180, 255, 180);
        textSize(15);
        textStyle(NORMAL);
        text(`📅 Day ${floor(gameTime / 180)}`, 18, 48);

        // CENTER/RIGHT SECTION
        let rightStartX = width - 460;
        let topRowY = 20;
        let bottomRowY = 45;
        let itemSpacing = 110;

        // Background panels
        fill(41, 128, 185, 25);
        rect(rightStartX - 5, topRowY - 14, itemSpacing - 8, 26, 4);
        fill(46, 125, 50, 25);
        rect(rightStartX + itemSpacing - 5, topRowY - 14, itemSpacing - 8, 26, 4);
        fill(142, 68, 173, 25);
        rect(rightStartX + itemSpacing * 2 - 5, topRowY - 14, itemSpacing - 8, 26, 4);
        fill(230, 126, 34, 25);
        rect(rightStartX + itemSpacing * 3 - 5, topRowY - 14, itemSpacing - 8, 26, 4);

        textAlign(CENTER, CENTER);
        textSize(15);
        textStyle(BOLD);

        fill(100, 200, 255);
        text(`💧 ${floor(player.inventory.water)}`, rightStartX + 45, topRowY);
        fill(120, 255, 120);
        text(`🌱 ${floor(player.inventory.nutrients.nitrogen)}`, rightStartX + itemSpacing + 45, topRowY);
        fill(220, 130, 255);
        text(`🌸 ${floor(player.inventory.nutrients.phosphorus)}`, rightStartX + itemSpacing * 2 + 45, topRowY);
        fill(255, 200, 120);
        text(`🍌 ${floor(player.inventory.nutrients.potassium)}`, rightStartX + itemSpacing * 3 + 45, topRowY);

        fill(211, 84, 0, 25);
        rect(rightStartX + itemSpacing - 5, bottomRowY - 14, itemSpacing - 8, 26, 4);
        fill(241, 196, 15, 25);
        rect(rightStartX + itemSpacing * 2 - 5, bottomRowY - 14, itemSpacing - 8, 26, 4);

        fill(255, 140, 140);
        text(`🔫 ${player.inventory.pesticide}`, rightStartX + itemSpacing + 45, bottomRowY);
        fill(255, 255, 180);
        text(`💡 ${player.inventory.lights.power}%`, rightStartX + itemSpacing * 2 + 45, bottomRowY);
    }

    textStyle(NORMAL);
}

function drawControlPanel() {
    let isMobile = width < 768;
    let panelHeight = isMobile ? 140 : 130; // Slightly shorter panel on mobile to reduce overlap
    let panelY = height - panelHeight;

    // Panel background with gradient
    noStroke();
    fill(15, 25, 15, 250);
    rect(0, panelY, width, panelHeight);

    // Top border with glow
    stroke(76, 175, 80, 200);
    strokeWeight(3);
    line(0, panelY, width, panelY);
    stroke(76, 175, 80, 80);
    strokeWeight(1);
    line(0, panelY + 3, width, panelY + 3);
}

function setupGrowingButtons() {
    buttons = [];

    let isMobile = width < 768;

    // Pause button - positioned to avoid overlap with status icons
    let pauseBtnSize = isMobile ? 38 : 45; // Smaller on mobile
    // Mobile: top-right below the header to avoid status bar overlap
    // Desktop: top-right corner as usual
    let pauseBtnTop = isMobile ? 78 : 5; // Adjusted for shorter header
    let pauseBtnLeft = width - pauseBtnSize - (isMobile ? 5 : 8);
    let pauseBtn = new Button(pauseBtnLeft, pauseBtnTop, pauseBtnSize, pauseBtnSize, '⏸', () => {
        playButtonSFX();
        savedGameplayState = 'growing'; // Save the actual gameplay state
        previousGameState = 'growing';
        gameState = 'paused';
        gamePaused = true;
    }, [150, 100, 200]);
    buttons.push(pauseBtn);

    // Mobile: larger buttons for better touch targets with better spacing
    // Desktop: original compact layout
    let btnY = isMobile ? height - 108 : height - 105; // Adjusted for shorter panel
    let btnHeight = isMobile ? 40 : 38; // Slightly smaller for better fit
    let btnSpacing = isMobile ? 3 : 8; // Tighter spacing on mobile
    let totalBtns = 6;
    let availableWidth = isMobile ? width - (btnSpacing * 2) : width;
    let btnWidth = (availableWidth - btnSpacing * (totalBtns + 1)) / totalBtns;
    // Ensure buttons don't get too narrow on small screens
    if (isMobile && btnWidth < 48) {
        btnWidth = 48;
        btnSpacing = max(2, (width - btnWidth * totalBtns) / (totalBtns + 1));
    }

    let x = btnSpacing;

    textFont('Carter One');

    // Water button - earthy blue/cyan color
    let waterBtn = new Button(x, btnY, btnWidth, btnHeight, '💧', () => {
        playButtonSFX();
        if (!selectedPlant) {
            addNotification('❌ Select a plant first!', 'error');
        } else if (player.inventory.water < 10) {
            addNotification('❌ Not enough water!', 'error');
        } else {
            selectedPlant.addWater(30);
            player.inventory.water -= 10;
        }
    }, [41, 128, 185]); // Ocean blue
    waterBtn.enabled = true;
    if (!selectedPlant || player.inventory.water < 10) {
        waterBtn.color = [31, 98, 145]; // Dimmed ocean blue
    }
    buttons.push(waterBtn);
    x += btnWidth + btnSpacing;

    // Nitrogen button - natural forest green
    let nBtn = new Button(x, btnY, btnWidth, btnHeight, '🌱 N', () => {
        playButtonSFX();
        if (!selectedPlant) {
            addNotification('❌ Select a plant first!', 'error');
        } else if (player.inventory.nutrients.nitrogen < 5) {
            addNotification('❌ Not enough nitrogen!', 'error');
        } else {
            selectedPlant.feed('nitrogen', 30);
            player.inventory.nutrients.nitrogen -= 5;
        }
    }, [46, 125, 50]); // Forest green
    nBtn.enabled = true;
    if (!selectedPlant || player.inventory.nutrients.nitrogen < 5) {
        nBtn.color = [36, 95, 40]; // Dimmed forest green
    }
    buttons.push(nBtn);
    x += btnWidth + btnSpacing;

    // Phosphorus button - earthy purple/amethyst
    let pBtn = new Button(x, btnY, btnWidth, btnHeight, '🌸 P', () => {
        playButtonSFX();
        if (!selectedPlant) {
            addNotification('❌ Select a plant first!', 'error');
        } else if (player.inventory.nutrients.phosphorus < 5) {
            addNotification('❌ Not enough phosphorus!', 'error');
        } else {
            selectedPlant.feed('phosphorus', 30);
            player.inventory.nutrients.phosphorus -= 5;
        }
    }, [142, 68, 173]); // Amethyst purple
    pBtn.enabled = true;
    if (!selectedPlant || player.inventory.nutrients.phosphorus < 5) {
        pBtn.color = [102, 48, 133]; // Dimmed amethyst
    }
    buttons.push(pBtn);
    x += btnWidth + btnSpacing;

    // Potassium button - natural amber/honey
    let kBtn = new Button(x, btnY, btnWidth, btnHeight, '🍌 K', () => {
        playButtonSFX();
        if (!selectedPlant) {
            addNotification('❌ Select a plant first!', 'error');
        } else if (player.inventory.nutrients.potassium < 5) {
            addNotification('❌ Not enough potassium!', 'error');
        } else {
            selectedPlant.feed('potassium', 30);
            player.inventory.nutrients.potassium -= 5;
        }
    }, [230, 126, 34]); // Amber/carrot orange
    kBtn.enabled = true;
    if (!selectedPlant || player.inventory.nutrients.potassium < 5) {
        kBtn.color = [180, 96, 24]; // Dimmed amber
    }
    buttons.push(kBtn);
    x += btnWidth + btnSpacing;

    // Pesticide button - earthy terracotta red
    let pestBtn = new Button(x, btnY, btnWidth, btnHeight, '🔫', () => {
        playButtonSFX();
        if (!selectedPlant) {
            addNotification('❌ Select a plant first!', 'error');
        } else if (player.inventory.pesticide < 1) {
            addNotification('❌ No pesticide!', 'error');
        } else {
            selectedPlant.treatPests();
            player.inventory.pesticide -= 1;
        }
    }, [211, 84, 0]); // Terracotta red-orange
    pestBtn.enabled = true;
    if (!selectedPlant || player.inventory.pesticide < 1) {
        pestBtn.color = [161, 64, 0]; // Dimmed terracotta
    }
    buttons.push(pestBtn);
    x += btnWidth + btnSpacing;

    // Shop button - golden/honey
    buttons.push(new Button(x, btnY, btnWidth, btnHeight, '🏪', () => {
        playButtonSFX();
        gameState = 'shop';
    }, [241, 196, 15])); // Golden yellow

    // Bottom row - Harvest and Plant buttons with better mobile spacing and clearance from bottom
    btnY = isMobile ? height - 70 : height - 58; // More clearance from bottom on mobile
    x = btnSpacing;
    let bottomBtnWidth = isMobile ? (width - btnSpacing * 3) / 2 : (width - btnSpacing * 3) / 2;
    let bottomBtnHeight = isMobile ? 44 : btnHeight; // Consistent height on mobile

    let harvestBtn = new Button(x, btnY, bottomBtnWidth, bottomBtnHeight, '✂️ HARVEST', () => {
        playButtonSFX();
        if (!selectedPlant) {
            addNotification('❌ Select a plant first!', 'error');
        } else if (selectedPlant.stage !== 'harvest') {
            addNotification('❌ Plant not ready!', 'error');
        } else {
            harvestPlant(selectedPlant);
        }
    }, [124, 179, 66]); // Vibrant leaf green
    harvestBtn.enabled = true;
    if (!selectedPlant || selectedPlant.stage !== 'harvest') {
        harvestBtn.color = [94, 139, 46]; // Dimmed leaf green
    }
    buttons.push(harvestBtn);
    x += bottomBtnWidth + btnSpacing;

    // Plant seed button - deep earthy indigo
    let plantBtn = new Button(x, btnY, bottomBtnWidth, bottomBtnHeight, '🌱 PLANT', () => {
        playButtonSFX();
        if (plants.length >= maxPlants) {
            addNotification('❌ Maximum plants reached!', 'error');
        } else if (player.inventory.seeds.length === 0) {
            addNotification('❌ No seeds available!', 'error');
        } else {
            plantNewSeed();
        }
    }, [81, 45, 168]); // Deep indigo
    plantBtn.enabled = true;
    if (player.inventory.seeds.length === 0 || plants.length >= maxPlants) {
        plantBtn.color = [61, 35, 128]; // Dimmed indigo
    }
    buttons.push(plantBtn);
}

function drawPlantDetails(plant) {
    let isMobile = width < 768;
    let panelW = min(330, width * 0.85);
    let panelH = 220;
    let panelX = width - panelW - 15; // Position on right side
    let headerHeight = isMobile ? 110 : 65;
    let panelY = headerHeight + 15; // Below top UI with margin

    // Panel shadow
    fill(0, 0, 0, 100);
    noStroke();
    rect(panelX + 4, panelY + 4, panelW, panelH, 10);

    // Panel background
    fill(20, 35, 25, 250);
    stroke(255, 215, 0, 200);
    strokeWeight(3);
    rect(panelX, panelY, panelW, panelH, 10);

    // Inner border glow
    noFill();
    stroke(255, 215, 0, 100);
    strokeWeight(1);
    rect(panelX + 5, panelY + 5, panelW - 10, panelH - 10, 8);

    // Plant info with better fonts
    textFont('Carter One');
    fill(255, 230, 150);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(16);
    let genderColor = plant.gender === 'female' ? color(255, 150, 200) : color(150, 150, 255);
    fill(genderColor);

    // Truncate strain name if too long
    let strainName = plant.strain;
    if (strainName.length > 18) {
        strainName = strainName.substring(0, 15) + '...';
    }
    text(`${plant.gender === 'female' ? '♀' : '♂'} ${strainName}`, panelX + 12, panelY + 12);

    textFont('Carter One');
    textSize(12);
    fill(200, 255, 200);
    let infoY = panelY + 38;
    let lineHeight = 18;
    
    text(`Stage: ${plant.stage.toUpperCase()}`, panelX + 12, infoY);
    text(`Age: ${floor(plant.age / 30)} days`, panelX + 12, infoY + lineHeight);
    
    // Health with color coding
    let healthColor = plant.health > 70 ? color(100, 255, 100) :
                     plant.health > 40 ? color(255, 255, 100) : color(255, 100, 100);
    fill(healthColor);
    text(`Health: ${floor(plant.health)}%`, panelX + 12, infoY + lineHeight * 2);
    
    fill(200, 255, 200);
    text(`Height: ${floor(plant.height)}cm`, panelX + 12, infoY + lineHeight * 3);

    // Nutrients section
    infoY += lineHeight * 4.2;
    textSize(11);
    fill(180, 255, 180);
    text('NUTRIENTS:', panelX + 12, infoY);
    
    infoY += lineHeight;
    fill(120, 255, 120);
    text(`N: ${floor(plant.nutrients.nitrogen)}%`, panelX + 12, infoY);
    fill(220, 120, 255);
    text(`P: ${floor(plant.nutrients.phosphorus)}%`, panelX + 110, infoY);
    fill(255, 200, 120);
    text(`K: ${floor(plant.nutrients.potassium)}%`, panelX + 208, infoY);

    // Status indicators
    infoY += lineHeight * 1.2;
    textSize(11);
    fill(100, 200, 255);
    text(`💧 ${floor(plant.water)}%`, panelX + 12, infoY);
    fill(255, 215, 100);
    text(`💡 ${floor(plant.light)}%`, panelX + 110, infoY);
    fill(255, 100, 100);
    text(`🐛 ${floor(plant.pests)}%`, panelX + 208, infoY);

    // Yield preview
    if (plant.stage === 'harvest') {
        infoY += lineHeight * 1.8;
        fill(255, 230, 100);
        textSize(14);
        textFont('Carter One');
        text(`🌿 READY! ${plant.yield}g`, panelX + 12, infoY);
    }
}

function harvestPlant(plant) {
    if (plant.gender === 'female') {
        let harvestedAmount = plant.yield;
        let quality = floor(plant.health);
        let pricePerGram = floor(strainDatabase[plant.strain].price * (quality / 100));

        player.harvestedWeed.push({
            strain: plant.strain,
            amount: harvestedAmount,
            quality: quality,
            price: pricePerGram
        });

        addNotification(`✂️ Harvested ${harvestedAmount}g of ${plant.strain}!`, 'success');

        // Collect 1-2 seeds from healthy female plants (70%+ health)
        if (plant.health >= 70) {
            let seedCount = floor(random(1, 3));
            for (let i = 0; i < seedCount; i++) {
                player.inventory.seeds.push({
                    strain: plant.strain,
                    gender: 'female',
                    quality: plant.health / 100
                });
            }
            addNotification(`🌰 Also collected ${seedCount} ${plant.strain} seed(s)!`, 'success');
        }

        if (!player.completedFirstHarvest) {
            player.completedFirstHarvest = true;
            addNotification('🎉 First harvest complete! Try cross-breeding to unlock new strains!', 'success');
        }
    } else {
        // Male plant - harvest many seeds
        let seedCount = floor(random(5, 12));
        for (let i = 0; i < seedCount; i++) {
            player.inventory.seeds.push({
                strain: plant.strain,
                gender: 'male',
                quality: plant.health / 100
            });
        }
        addNotification(`🌰 Collected ${seedCount} ${plant.strain} seeds from male plant!`, 'success');
    }

    // Remove plant
    plants = plants.filter(p => p !== plant);
    selectedPlant = null;
}

function plantNewSeed() {
    if (player.inventory.seeds.length === 0) {
        addNotification('❌ No seeds available!', 'error');
        return;
    }

    // Go to seed selection screen
    gameState = 'seedSelect';
}

// === SEED SELECTION SCREEN ===
function drawSeedSelectScreen() {
    background(30, 35, 30);

    let isMobile = width < 768;

    // Title
    fill(150, 255, 150);
    textFont('Carter One');
    textAlign(CENTER);
    textSize(isMobile ? min(width * 0.07, 24) : 28);
    text('🌰 SELECT SEED TO PLANT', width / 2, isMobile ? 25 : 30);

    // Seed count
    fill(200);
    textSize(isMobile ? 12 : 14);
    text(`Seeds Available: ${player.inventory.seeds.length}`, width / 2, isMobile ? 45 : 60);

    buttons = [];

    // Group seeds by strain
    let seedsByStrain = {};
    for (let seed of player.inventory.seeds) {
        if (!seedsByStrain[seed.strain]) {
            seedsByStrain[seed.strain] = [];
        }
        seedsByStrain[seed.strain].push(seed);
    }

    // Display seed cards with mobile responsive sizing
    let strainNames = Object.keys(seedsByStrain);
    let cardW = isMobile ? min(width * 0.7, 180) : min(160, (width - 60) / 4);
    let cardH = isMobile ? min(160, height * 0.35) : 200;
    let spacing = isMobile ? 15 : 10;
    let startY = isMobile ? (height - cardH) / 2 + 10 : 90; // Better vertical centering on mobile

    // Mobile: horizontal scrolling effect - show 1 card at a time with left/right navigation
    if (isMobile && strainNames.length > 0) {
        // Add scroll position tracking
        if (typeof window.seedScrollIndex === 'undefined') {
            window.seedScrollIndex = 0;
        }

        let scrollIndex = window.seedScrollIndex || 0;
        scrollIndex = constrain(scrollIndex, 0, strainNames.length - 1);

        let strainName = strainNames[scrollIndex];
        let seeds = seedsByStrain[strainName];
        let strain = strainDatabase[strainName];

        let x = (width - cardW) / 2;  // Center horizontally
        let y = startY;  // Center vertically

        // Card background
        fill(40, 50, 40);
        stroke(strain.color[0], strain.color[1], strain.color[2]);
        strokeWeight(2);
        rect(x, y, cardW, cardH, 8);

        // Strain name
        fill(255);
        textAlign(CENTER);
        textSize(12);
        text(strainName, x + cardW / 2, y + 18);

        // Color preview
        fill(strain.color[0], strain.color[1], strain.color[2]);
        noStroke();
        ellipse(x + cardW / 2, y + 45, 30, 30);

        // Seed count
        fill(200);
        textSize(10);
        text(`Seeds: ${seeds.length}`, x + cardW / 2, y + 70);

        // Stats
        textAlign(LEFT);
        textSize(8);
        let infoY = y + 85;
        text(`Potency: ${strain.potency}%`, x + 8, infoY);
        text(`Difficulty: ${strain.difficulty}`, x + 8, infoY + 11);
        text(`Growth: ${strain.growthRate}x`, x + 8, infoY + 22);

        // Plant button
        buttons.push(new Button(x + 10, y + cardH - 35, cardW - 20, 28, '🌱 PLANT', () => {
            playButtonSFX();
            let seedIndex = player.inventory.seeds.findIndex(s => s.strain === strainName);
            if (seedIndex !== -1) {
                let seed = player.inventory.seeds.splice(seedIndex, 1)[0];
                let spacing = width / (maxPlants + 1);
                let plantX = spacing * (plants.length + 1);
                let plantY = height / 2 + 50;
                plants.push(new Plant(seed.strain, growLocation, plantX, plantY));
                addNotification(`🌱 Planted ${seed.strain} seed!`, 'success');
                gameState = 'growing';
            }
        }, [76, 175, 80]));

        // Navigation arrows for mobile
        if (scrollIndex > 0) {
            buttons.push(new Button(10, y + cardH / 2 - 20, 40, 40, '◀', () => {
                playButtonSFX();
                window.seedScrollIndex = max(0, scrollIndex - 1);
            }, [100, 100, 150]));
        }

        if (scrollIndex < strainNames.length - 1) {
            buttons.push(new Button(width - 50, y + cardH / 2 - 20, 40, 40, '▶', () => {
                playButtonSFX();
                window.seedScrollIndex = min(strainNames.length - 1, scrollIndex + 1);
            }, [100, 100, 150]));
        }

        // Page indicator
        fill(200);
        textAlign(CENTER);
        textSize(11);
        text(`${scrollIndex + 1} / ${strainNames.length}`, width / 2, y + cardH + 25);

    } else if (!isMobile) {
        // Desktop: grid layout
        let cols = floor((width - 40) / (cardW + 10));
        let x = (width - (min(cols, strainNames.length) * cardW + (min(cols, strainNames.length) - 1) * spacing)) / 2;
        let y = startY;
        let col = 0;

        for (let strainName of strainNames) {
            let seeds = seedsByStrain[strainName];
            let strain = strainDatabase[strainName];

            // Card background
            fill(40, 50, 40);
            stroke(strain.color[0], strain.color[1], strain.color[2]);
            strokeWeight(2);
            rect(x, y, cardW, cardH, 8);

            // Strain name
            fill(255);
            textAlign(CENTER);
            textSize(13);
            text(strainName, x + cardW / 2, y + 20);

            // Color preview
            fill(strain.color[0], strain.color[1], strain.color[2]);
            noStroke();
            ellipse(x + cardW / 2, y + 55, 35, 35);

            // Seed count
            fill(200);
            textSize(11);
            text(`Seeds: ${seeds.length}`, x + cardW / 2, y + 90);

            // Stats
            textAlign(LEFT);
            textSize(9);
            let infoY = y + 110;
            text(`Potency: ${strain.potency}%`, x + 10, infoY);
            text(`Difficulty: ${strain.difficulty}`, x + 10, infoY + 14);
            text(`Growth: ${strain.growthRate}x`, x + 10, infoY + 28);

            // Plant button
            buttons.push(new Button(x + 10, y + cardH - 40, cardW - 20, 32, '🌱 PLANT', () => {
                playButtonSFX();
                let seedIndex = player.inventory.seeds.findIndex(s => s.strain === strainName);
                if (seedIndex !== -1) {
                    let seed = player.inventory.seeds.splice(seedIndex, 1)[0];
                    let spacing = width / (maxPlants + 1);
                    let plantX = spacing * (plants.length + 1);
                    let plantY = height / 2 + 50;
                    plants.push(new Plant(seed.strain, growLocation, plantX, plantY));
                    addNotification(`🌱 Planted ${seed.strain} seed!`, 'success');
                    gameState = 'growing';
                }
            }, [76, 175, 80]));

            col++;
            if (col >= cols) {
                col = 0;
                x = (width - (min(cols, strainNames.length) * cardW + (min(cols, strainNames.length) - 1) * spacing)) / 2;
                y += cardH + spacing;
            } else {
                x += cardW + spacing;
            }
        }
    }

    // Cancel button - better positioning on mobile to avoid cutoff
    let cancelBtnW = isMobile ? min(180, width * 0.7) : 160;
    let cancelBtnH = isMobile ? 42 : 45;
    let cancelBtnY = isMobile ? height - 60 : height - 60;
    buttons.push(new Button(width / 2 - cancelBtnW / 2, cancelBtnY, cancelBtnW, cancelBtnH, '⬅️ CANCEL', () => {
        playButtonSFX();
        gameState = 'growing';
    }, [150, 100, 100]));
}

// === SHOP ===
function drawShop() {
    background(25, 35, 25);

    let isMobile = width < 768;

    // Title - responsive
    fill(255, 215, 0);
    textAlign(CENTER, TOP);
    textSize(isMobile ? min(width * 0.08, 28) : 32);
    textStyle(BOLD);
    text('🏪 GROW SHOP', width / 2, isMobile ? 15 : 20);

    // Money display - responsive
    fill(150, 255, 150);
    textSize(isMobile ? min(width * 0.048, 18) : 20);
    text(`💰 Balance: $${player.money}`, width / 2, isMobile ? 45 : 60);

    buttons = [];

    // Shop items
    let items = [
        { name: 'Water (50 units)', icon: '💧', cost: 20, action: () => buyItem('water', 50, 20) },
        { name: 'Nitrogen (20 units)', icon: '🌱', cost: 30, action: () => buyItem('nitrogen', 20, 30) },
        { name: 'Phosphorus (20 units)', icon: '🌸', cost: 30, action: () => buyItem('phosphorus', 20, 30) },
        { name: 'Potassium (20 units)', icon: '🍌', cost: 30, action: () => buyItem('potassium', 20, 30) },
        { name: 'Pesticide (5 units)', icon: '🔫', cost: 40, action: () => buyItem('pesticide', 5, 40) },
        { name: 'Upgrade Lights', icon: '💡', cost: 200, action: () => upgradeLights() }
    ];

    let cardW = isMobile ? min(width * 0.43, 160) : min(220, width * 0.4);
    let cardH = isMobile ? 90 : 100;
    let cardSpacing = isMobile ? 8 : 20;
    let cols = isMobile ? 2 : floor(width / (cardW + 20));
    // Improved horizontal centering calculation
    let totalRowWidth = cols * cardW + (cols - 1) * cardSpacing;
    let startX = (width - totalRowWidth) / 2;
    // Better vertical centering for mobile shop items
    let rows = Math.ceil(items.length / cols);
    let totalContentHeight = rows * cardH + (rows - 1) * (isMobile ? 10 : 15);
    let startY = isMobile ? max(80, (height - totalContentHeight) / 2) : 110;

    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        let col = i % cols;
        let row = floor(i / cols);
        let x = startX + col * (cardW + cardSpacing);
        let y = startY + row * (cardH + (isMobile ? 10 : 15));

        // Card
        fill(30, 50, 30);
        stroke(76, 175, 80);
        strokeWeight(2);
        rect(x, y, cardW, cardH, 8);

        // Item info - responsive text
        fill(255);
        noStroke();
        textAlign(LEFT, TOP);
        textSize(isMobile ? min(cardW * 0.073, 12) : 16);
        textStyle(BOLD);
        text(`${item.icon} ${item.name}`, x + 8, y + 8);

        textSize(isMobile ? min(cardW * 0.067, 12) : 14);
        textStyle(NORMAL);
        fill(255, 215, 0);
        text(`💰 $${item.cost}`, x + 8, y + (isMobile ? 28 : 35));

        // Buy button
        let btnH = isMobile ? 26 : 28;
        let btn = new Button(x + 8, y + cardH - (isMobile ? 30 : 35), cardW - 16, btnH, 'BUY', item.action, [76, 175, 80]);
        btn.enabled = player.money >= item.cost;
        buttons.push(btn);
    }

    // Sell weed section
    let sellSectionHeight = 0;
    if (player.harvestedWeed.length > 0) {
        let sellY = startY + Math.ceil(items.length / cols) * (cardH + (isMobile ? 10 : 15)) + (isMobile ? 15 : 20);

        fill(255, 215, 0);
        textAlign(CENTER, TOP);
        textSize(isMobile ? 18 : 24);
        textStyle(BOLD);
        noStroke();
        text('💰 SELL HARVESTED WEED', width / 2, sellY);

        let sellStartY = sellY + (isMobile ? 35 : 40);
        let sellItemHeight = isMobile ? 48 : 50;
        for (let i = 0; i < player.harvestedWeed.length; i++) {
            let weed = player.harvestedWeed[i];
            let y = sellStartY + i * sellItemHeight;

            fill(30, 50, 30);
            stroke(139, 195, 74);
            strokeWeight(2);
            rect(isMobile ? 10 : 20, y, width - (isMobile ? 20 : 40), isMobile ? 42 : 45, 8);

            fill(200, 255, 200);
            noStroke();
            textAlign(LEFT, CENTER);
            textSize(isMobile ? 11 : 14);
            textStyle(NORMAL);
            text(`🌿 ${weed.strain} - ${weed.amount}g (${weed.quality}% quality)`, isMobile ? 15 : 30, y + (isMobile ? 21 : 22));

            let sellPrice = weed.amount * weed.price;
            let sellBtnW = isMobile ? 100 : 130;
            buttons.push(new Button(
                width - (isMobile ? 110 : 150),
                y + (isMobile ? 6 : 8),
                sellBtnW,
                isMobile ? 28 : 30,
                `SELL $${sellPrice}`,
                () => sellWeed(i),
                [139, 195, 74]
            ));
        }
        sellSectionHeight = sellStartY + player.harvestedWeed.length * sellItemHeight - sellY + 15;
    }

    // Back button - positioned to avoid overlap with dynamic content, better spacing on mobile
    let minBackBtnY = startY + Math.ceil(items.length / cols) * (cardH + (isMobile ? 10 : 15)) + sellSectionHeight + (isMobile ? 20 : 25);
    let backBtnY = isMobile ? min(height - 55, max(minBackBtnY, height - 65)) : height - 60;
    let backBtnW = isMobile ? min(200, width * 0.8) : 200;
    let backBtnH = isMobile ? 46 : 45;
    buttons.push(new Button(
        width / 2 - backBtnW / 2,
        backBtnY,
        backBtnW,
        backBtnH,
        '⬅️ BACK TO GROW',
        () => {
            playButtonSFX();
            gameState = 'growing';
        },
        [100, 100, 150]
    ));
}

function buyItem(type, amount, cost) {
    if (player.money >= cost) {
        player.money -= cost;
        
        if (type === 'water') {
            player.inventory.water += amount;
        } else if (type === 'pesticide') {
            player.inventory.pesticide += amount;
        } else {
            player.inventory.nutrients[type] += amount;
        }
        
        addNotification(`✅ Purchased ${type}!`, 'success');
    } else {
        addNotification('❌ Not enough money!', 'error');
    }
}

function upgradeLights() {
    if (player.money >= 200) {
        if (player.inventory.lights.power < 150) {
            player.money -= 200;
            player.inventory.lights.power = 150;
            player.inventory.lights.type = 'advanced';
            addNotification('✅ Lights upgraded to 150%!', 'success');
        } else {
            addNotification('❌ Lights already maxed!', 'error');
        }
    } else {
        addNotification('❌ Not enough money!', 'error');
    }
}

function sellWeed(index) {
    let weed = player.harvestedWeed[index];
    let sellPrice = weed.amount * weed.price;
    player.money += sellPrice;
    player.harvestedWeed.splice(index, 1);
    addNotification(`💰 Sold for $${sellPrice}!`, 'success');
}

// === PAUSE MENU ===
function drawPauseMenu() {
    // Draw the game screen in background (frozen)
    drawGrowingScreen();

    // Dark overlay
    fill(0, 0, 0, 180);
    noStroke();
    rect(0, 0, width, height);

    let isMobile = width < 768;

    // Pause menu panel - improved mobile sizing
    let panelW = min(400, width * 0.92);
    let panelH = isMobile ? min(height * 0.85, 500) : 500;
    let panelX = (width - panelW) / 2;
    let panelY = (height - panelH) / 2;

    // Panel shadow
    fill(0, 0, 0, 100);
    noStroke();
    rect(panelX + 5, panelY + 5, panelW, panelH, 15);

    // Panel background
    fill(25, 40, 30);
    stroke(100, 255, 100);
    strokeWeight(3);
    rect(panelX, panelY, panelW, panelH, 15);

    // Title - with better spacing and margin
    textFont('Bangers');
    fill(220, 255, 220);
    textAlign(CENTER);
    textSize(isMobile ? 28 : 36);
    textStyle(NORMAL);
    noStroke();
    text('⏸ PAUSED', width / 2, panelY + (isMobile ? 40 : 50));

    // Buttons - improved spacing and sizing for mobile
    buttons = [];
    let btnW = panelW - (isMobile ? 50 : 80);
    let btnH = isMobile ? 42 : 48;
    let btnX = panelX + (isMobile ? 25 : 40);
    let btnY = panelY + (isMobile ? 75 : 110);
    // Dynamic spacing based on screen height to prevent overflow
    let btnSpacing = isMobile ? min(48, (panelH - 150) / 6.5) : 60;

    // Resume button
    buttons.push(new Button(btnX, btnY, btnW, btnH, '▶️ RESUME', () => {
        playButtonSFX();
        // Use savedGameplayState to return to actual gameplay
        gameState = savedGameplayState || previousGameState || 'growing';
        gamePaused = false;
    }, [76, 175, 80]));

    // Save button
    buttons.push(new Button(btnX, btnY + btnSpacing, btnW, btnH, '💾 SAVE GAME', () => {
        playButtonSFX();
        saveGame();
    }, [100, 150, 220]));

    // Strain List button
    buttons.push(new Button(btnX, btnY + btnSpacing * 2, btnW, btnH, '🧬 STRAIN LIST', () => {
        playButtonSFX();
        previousGameState = 'paused';
        gameState = 'strainList';
    }, [180, 120, 220]));

    // Hybridization button
    buttons.push(new Button(btnX, btnY + btnSpacing * 3, btnW, btnH, '🔬 HYBRIDIZE', () => {
        playButtonSFX();
        previousGameState = 'paused';
        gameState = 'hybridization';
        gamePaused = false; // Allow game to continue while in hybridization
    }, [220, 100, 200]));

    // Settings button
    buttons.push(new Button(btnX, btnY + btnSpacing * 4, btnW, btnH, '⚙️ SETTINGS', () => {
        playButtonSFX();
        previousGameState = 'paused';
        gameState = 'settings';
    }, [150, 100, 200]));

    // Main Menu button
    buttons.push(new Button(btnX, btnY + btnSpacing * 5, btnW, btnH, '🏠 MAIN MENU', () => {
        playButtonSFX();
        if (confirm('Return to main menu? Make sure to save first!')) {
            gameState = 'titleScreen';
            gamePaused = false;
            switchToMenuMusic();
        }
    }, [200, 100, 100]));
}

// === SETTINGS MENU ===
function drawSettingsMenu() {
    // Dark background
    background(20, 30, 25);

    let isMobile = width < 768;

    // Settings panel - improved mobile sizing
    let panelW = min(500, width * 0.95);
    let panelH = isMobile ? min(height * 0.92, 550) : min(500, height * 0.9);
    let panelX = (width - panelW) / 2;
    let panelY = (height - panelH) / 2;

    // Panel shadow
    fill(0, 0, 0, 100);
    noStroke();
    rect(panelX + 5, panelY + 5, panelW, panelH, 15);

    // Panel background
    fill(25, 40, 30);
    stroke(100, 255, 100);
    strokeWeight(3);
    rect(panelX, panelY, panelW, panelH, 15);

    // Title - matching style with other menus (explicitly NO stroke/outline)
    push(); // Isolate text styling
    textFont('Bangers');
    textAlign(CENTER);
    textSize(36);
    textStyle(NORMAL);
    noStroke(); // Explicitly no outline to match other menu titles
    strokeWeight(0); // Ensure no stroke weight
    fill(220, 255, 220);
    text('⚙️ SETTINGS', width / 2, panelY + 50);
    pop(); // Restore previous state

    // Settings content
    textFont('Carter One');
    textSize(isMobile ? 16 : 18);
    textStyle(NORMAL); // Remove any style variations
    noStroke(); // Ensure no stroke/outline
    strokeWeight(0); // Explicitly set stroke weight to 0
    fill(180, 255, 180);
    textAlign(LEFT);

    let contentX = panelX + (isMobile ? 20 : 30);
    let contentY = panelY + (isMobile ? 85 : 100);
    let lineHeight = isMobile ? min(70, (panelH - 200) / 4.5) : 80;

    // Music Volume - ensure consistent styling
    noStroke();
    fill(180, 255, 180);
    text('🎵 Music Volume', contentX, contentY);
    text(`${floor(audioSettings.musicVolume * 100)}%`, panelX + panelW - 80, contentY);

    // Music volume slider (simulated with buttons)
    let sliderY = contentY + 25;
    let sliderW = panelW - 100;
    let sliderX = panelX + 50;

    fill(50, 50, 50);
    noStroke();
    rect(sliderX, sliderY, sliderW, 15, 5);

    fill(100, 255, 100);
    rect(sliderX, sliderY, sliderW * audioSettings.musicVolume, 15, 5);

    // SFX Volume
    contentY += lineHeight;
    noStroke();
    fill(180, 255, 180);
    text('🔊 SFX Volume', contentX, contentY);
    text(`${floor(audioSettings.sfxVolume * 100)}%`, panelX + panelW - 80, contentY);

    sliderY = contentY + 25;
    fill(50, 50, 50);
    noStroke();
    rect(sliderX, sliderY, sliderW, 15, 5);

    fill(100, 255, 100);
    noStroke();
    rect(sliderX, sliderY, sliderW * audioSettings.sfxVolume, 15, 5);

    // Music Toggle
    contentY += lineHeight;
    noStroke();
    fill(180, 255, 180);
    text('Music:', contentX, contentY);

    // SFX Toggle
    contentY += lineHeight;
    noStroke();
    fill(180, 255, 180);
    text('Sound FX:', contentX, contentY);

    // Buttons
    buttons = [];
    let btnW = isMobile ? 85 : 100;
    let btnH = isMobile ? 36 : 40;

    // Music volume buttons
    contentY = panelY + (isMobile ? 85 : 100) + 25;
    buttons.push(new Button(sliderX, contentY - 5, 60, 30, '-', () => {
        playButtonSFX();
        audioSettings.musicVolume = max(0, audioSettings.musicVolume - 0.1);
        updateMusicVolume();
    }, [180, 100, 100]));

    buttons.push(new Button(sliderX + sliderW - 60, contentY - 5, 60, 30, '+', () => {
        playButtonSFX();
        audioSettings.musicVolume = min(1, audioSettings.musicVolume + 0.1);
        updateMusicVolume();
    }, [100, 180, 100]));

    // SFX volume buttons
    contentY += lineHeight;
    buttons.push(new Button(sliderX, contentY - 5, 60, 30, '-', () => {
        playButtonSFX();
        audioSettings.sfxVolume = max(0, audioSettings.sfxVolume - 0.1);
    }, [180, 100, 100]));

    buttons.push(new Button(sliderX + sliderW - 60, contentY - 5, 60, 30, '+', () => {
        playButtonSFX();
        audioSettings.sfxVolume = min(1, audioSettings.sfxVolume + 0.1);
    }, [100, 180, 100]));

    // Music toggle button
    contentY += lineHeight;
    buttons.push(new Button(panelX + panelW - 160, contentY - 20, btnW, btnH, audioSettings.musicEnabled ? 'ON' : 'OFF', () => {
        playButtonSFX();
        audioSettings.musicEnabled = !audioSettings.musicEnabled;
        if (audioSettings.musicEnabled) {
            if (gameState === 'growing') switchToGameplayMusic();
            else switchToMenuMusic();
        } else {
            stopAllMusic();
        }
    }, audioSettings.musicEnabled ? [76, 175, 80] : [180, 100, 100]));

    // SFX toggle button
    contentY += lineHeight;
    buttons.push(new Button(panelX + panelW - 160, contentY - 20, btnW, btnH, audioSettings.sfxEnabled ? 'ON' : 'OFF', () => {
        playButtonSFX();
        audioSettings.sfxEnabled = !audioSettings.sfxEnabled;
    }, audioSettings.sfxEnabled ? [76, 175, 80] : [180, 100, 100]));

    // Back button - improved mobile positioning
    let backBtnH = isMobile ? 45 : 50;
    let backBtnY = panelY + panelH - (isMobile ? 60 : 70);
    buttons.push(new Button(panelX + (isMobile ? 25 : 40), backBtnY, panelW - (isMobile ? 50 : 80), backBtnH, '⬅️ BACK', () => {
        playButtonSFX();
        if (previousGameState === 'paused') {
            gameState = 'paused';
        } else if (previousGameState === 'titleScreen') {
            gameState = 'titleScreen';
        } else {
            gameState = previousGameState || 'titleScreen';
        }
    }, [100, 100, 150]));
}

// === STRAIN LIST MENU ===
function drawStrainListMenu() {
    background(25, 30, 35);

    let isMobile = width < 768;

    // Title
    fill(255, 215, 0);
    textFont('Carter One');
    textAlign(CENTER);
    textSize(isMobile ? min(width * 0.07, 26) : 32);
    text('🧬 STRAIN COLLECTION', width / 2, isMobile ? 25 : 30);

    // Stats
    let unlockedCount = player.unlockedStrains.length;
    let totalCount = Object.keys(strainDatabase).length;
    fill(150, 255, 150);
    textSize(isMobile ? 13 : 16);
    text(`Unlocked: ${unlockedCount} / ${totalCount}`, width / 2, isMobile ? 50 : 70);

    buttons = [];

    // Strain grid - mobile responsive
    let startY = isMobile ? 70 : 110;
    let cardW = isMobile ? min(100, (width - 25) / 3) : min(180, (width - 60) / 4);
    let cardH = isMobile ? min(155, height * 0.24) : 240;
    let cols = isMobile ? 3 : floor((width - 40) / (cardW + 10));
    let spacing = isMobile ? 4 : 10;

    // Adjust strains per page based on screen size
    let rowsPerPage = isMobile ? 3 : 3;
    let strainsPerPage = cols * rowsPerPage;
    let totalPages = ceil(totalCount / strainsPerPage);
    let startIdx = strainListPage * strainsPerPage;
    let endIdx = min(startIdx + strainsPerPage, totalCount);

    let allStrains = Object.keys(strainDatabase);
    let x = (width - (cols * (cardW + spacing) - spacing)) / 2;
    let y = startY;
    let col = 0;

    for (let i = startIdx; i < endIdx; i++) {
        let strainName = allStrains[i];
        let strain = strainDatabase[strainName];
        let unlocked = player.unlockedStrains.includes(strainName);

        // Card background
        if (unlocked) {
            fill(40, 60, 40);
            stroke(80, 255, 100);
        } else {
            fill(30, 30, 35);
            stroke(80, 80, 90);
        }
        strokeWeight(2);
        rect(x, y, cardW, cardH, 8);

        // Strain name - wrap for mobile
        fill(255);
        textAlign(CENTER);
        textSize(isMobile ? 8 : 12);
        let displayName = unlocked ? strainName : '???';
        if (isMobile && displayName.length > 11) {
            let words = displayName.split(' ');
            if (words.length > 1) {
                text(words[0], x + cardW / 2, y + 12);
                text(words.slice(1).join(' '), x + cardW / 2, y + 21);
            } else {
                text(displayName, x + cardW / 2, y + 16);
            }
        } else {
            text(displayName, x + cardW / 2, y + 16);
        }

        if (unlocked) {
            // Color swatch
            fill(strain.color[0], strain.color[1], strain.color[2]);
            noStroke();
            let swatchSize = isMobile ? 24 : 40;
            let swatchY = isMobile ? y + 40 : y + 60;
            ellipse(x + cardW / 2, swatchY, swatchSize, swatchSize);

            // Stats
            fill(200);
            textAlign(LEFT);
            textSize(isMobile ? 6.5 : 10);
            let infoY = isMobile ? y + 58 : y + 95;
            let infoGap = isMobile ? 10 : 16;
            let infoX = x + (isMobile ? 4 : 10);
            text(`Potency: ${strain.potency}%`, infoX, infoY);
            text(`Rarity: ${strain.rarity}`, infoX, infoY + infoGap);
            text(`Diff: ${strain.difficulty}`, infoX, infoY + infoGap * 2);
            text(`$${strain.price}/g`, infoX, infoY + infoGap * 3);

            // Leaf shape indicator
            let leafIcon = strain.leafShape === 'wide' ? '🍃' :
                          strain.leafShape === 'narrow' ? '🌿' : '🌱';
            fill(255);
            textAlign(CENTER);
            textSize(isMobile ? 14 : 20);
            text(leafIcon, x + cardW / 2, infoY + infoGap * 4 + 4);
        } else {
            // Locked icon
            fill(100);
            textAlign(CENTER);
            textSize(isMobile ? 24 : 40);
            text('🔒', x + cardW / 2, isMobile ? y + 45 : y + 70);

            // Hint - more compact for mobile
            fill(180, 180, 200);
            textSize(isMobile ? 6.5 : 9);
            textAlign(CENTER);
            let hintText = strain.hint || 'Unlock by breeding';
            // Wrap text
            let words = hintText.split(' ');
            let line = '';
            let lineY = isMobile ? y + 70 : y + 120;
            let lineGap = isMobile ? 8 : 12;
            for (let word of words) {
                let testLine = line + word + ' ';
                if (textWidth(testLine) > cardW - (isMobile ? 6 : 20) && line.length > 0) {
                    text(line, x + cardW / 2, lineY);
                    line = word + ' ';
                    lineY += lineGap;
                } else {
                    line = testLine;
                }
            }
            text(line, x + cardW / 2, lineY);
        }

        col++;
        if (col >= cols) {
            col = 0;
            x = (width - (cols * (cardW + spacing) - spacing)) / 2;
            y += cardH + spacing;
        } else {
            x += cardW + spacing;
        }
    }

    // Pagination
    if (totalPages > 1) {
        textAlign(CENTER);
        fill(255);
        textSize(isMobile ? 12 : 14);
        let pageY = isMobile ? height - 115 : height - 100;
        text(`Page ${strainListPage + 1} / ${totalPages}`, width / 2, pageY);

        let btnW = isMobile ? 70 : 80;
        let btnH = isMobile ? 36 : 35;
        let btnY = isMobile ? height - 140 : height - 120;

        if (strainListPage > 0) {
            buttons.push(new Button(width / 2 - 140, btnY, btnW, btnH, '⬅️ PREV', () => {
                playButtonSFX();
                strainListPage--;
            }, [100, 100, 150]));
        }

        if (strainListPage < totalPages - 1) {
            buttons.push(new Button(width / 2 + 70, btnY, btnW, btnH, 'NEXT ➡️', () => {
                playButtonSFX();
                strainListPage++;
            }, [100, 100, 150]));
        }
    }

    // Back button - better spacing on mobile
    let backBtnW = isMobile ? min(180, width * 0.7) : 160;
    let backBtnH = isMobile ? 42 : 45;
    let backBtnY = isMobile ? height - 70 : height - 60;
    buttons.push(new Button(width / 2 - backBtnW / 2, backBtnY, backBtnW, backBtnH, '⬅️ BACK', () => {
        playButtonSFX();
        gameState = 'paused';
    }, [100, 100, 150]));
}

// === HYBRIDIZATION SCREEN ===
function drawHybridizationScreen() {
    background(30, 25, 40);

    let isMobile = width < 768;

    // Title - responsive
    fill(255, 180, 255);
    textFont('Carter One');
    textAlign(CENTER);
    textSize(isMobile ? min(width * 0.068, 24) : 32);
    text('🧬 HYBRIDIZATION LAB', width / 2, isMobile ? 22 : 30);

    // Instructions - responsive and wrapped for mobile
    fill(200, 200, 255);
    textSize(isMobile ? 11 : 14);
    if (isMobile) {
        text('Select two plants to cross-breed', width / 2, 42);
        text('and create new strains!', width / 2, 56);
    } else {
        text('Select two plants to cross-breed and create new strains!', width / 2, 65);
    }

    buttons = [];

    // Filter only harvest-stage plants for breeding
    let breedablePlants = plants.filter(p => p.stage === 'harvest');

    if (breedablePlants.length < 2) {
        fill(255, 150, 150);
        textSize(isMobile ? 14 : 18);
        if (isMobile) {
            text('You need at least 2 plants', width / 2, height / 2 - 10);
            text('at harvest stage to hybridize!', width / 2, height / 2 + 10);
        } else {
            text('You need at least 2 plants at harvest stage to hybridize!', width / 2, height / 2);
        }

        buttons.push(new Button(width / 2 - 80, height - 80, 160, 45, '⬅️ BACK', () => {
            playButtonSFX();
            gameState = 'growing';
        }, [100, 100, 150]));
        return;
    }

    // Display plant selection - mobile responsive
    let cardW = isMobile ? min(width * 0.44, 150) : min(220, (width - 60) / 3);
    let cardH = isMobile ? min(185, height * 0.28) : 280;
    let spacing = isMobile ? 6 : 20;
    let cardsPerRow = isMobile ? 2 : 3;
    let startX = (width - (min(cardsPerRow, breedablePlants.length) * cardW + (min(cardsPerRow, breedablePlants.length) - 1) * spacing)) / 2;
    let y = isMobile ? 70 : 110;

    for (let i = 0; i < min(breedablePlants.length, 6); i++) {
        let plant = breedablePlants[i];
        let col = i % cardsPerRow;
        let row = floor(i / cardsPerRow);
        let x = startX + col * (cardW + spacing);
        let currentY = y + row * (cardH + (isMobile ? 10 : 20));

        // Card background
        let isParent1 = selectedParentPlant1 === plant;
        let isParent2 = selectedParentPlant2 === plant;
        let isSelected = isParent1 || isParent2;

        if (isSelected) {
            fill(60, 100, 60);
            stroke(100, 255, 100);
        } else {
            fill(40, 40, 50);
            stroke(100, 100, 120);
        }
        strokeWeight(isSelected ? 4 : 2);
        rect(x, currentY, cardW, cardH, 10);

        // Plant preview
        fill(plant.baseColor[0], plant.baseColor[1], plant.baseColor[2]);
        noStroke();
        let previewSize = isMobile ? 32 : 50;
        let previewY = isMobile ? currentY + 35 : currentY + 60;
        ellipse(x + cardW / 2, previewY, previewSize, previewSize);

        // Info - responsive text
        fill(255);
        noStroke();
        textAlign(CENTER);
        textSize(isMobile ? 10 : 14);
        let nameY = isMobile ? currentY + 60 : currentY + 105;
        // Wrap long strain names on mobile
        if (isMobile && plant.strain.length > 12) {
            let words = plant.strain.split(' ');
            if (words.length > 1) {
                text(words[0], x + cardW / 2, nameY);
                text(words.slice(1).join(' '), x + cardW / 2, nameY + 11);
                nameY += 11;
            } else {
                text(plant.strain, x + cardW / 2, nameY);
            }
        } else {
            text(plant.strain, x + cardW / 2, nameY);
        }

        fill(200);
        textSize(isMobile ? 8 : 11);
        let infoGap = isMobile ? 12 : 20;
        text(`${plant.gender === 'female' ? '♀' : '♂'} ${plant.gender}`, x + cardW / 2, nameY + (isMobile ? 14 : 20));
        text(`Health: ${floor(plant.health)}%`, x + cardW / 2, nameY + (isMobile ? 26 : 40));
        text(`Potency: ${floor(plant.potency)}%`, x + cardW / 2, nameY + (isMobile ? 38 : 60));

        // Selection indicator
        if (isParent1) {
            fill(100, 255, 100);
            noStroke();
            textSize(isMobile ? 9 : 12);
            text('PARENT 1 ✓', x + cardW / 2, nameY + (isMobile ? 52 : 85));
        } else if (isParent2) {
            fill(255, 200, 100);
            noStroke();
            textSize(isMobile ? 9 : 12);
            text('PARENT 2 ✓', x + cardW / 2, nameY + (isMobile ? 52 : 85));
        }

        // Select button
        let btnH = isMobile ? 28 : 35;
        let btnW = isMobile ? cardW - 12 : cardW - 40;
        let btnY = currentY + cardH - (isMobile ? 33 : 50);
        buttons.push(new Button(x + (cardW - btnW) / 2, btnY, btnW, btnH,
            isSelected ? 'DESELECT' : 'SELECT', () => {
            playButtonSFX();
            if (isParent1) {
                selectedParentPlant1 = null;
            } else if (isParent2) {
                selectedParentPlant2 = null;
            } else if (!selectedParentPlant1) {
                selectedParentPlant1 = plant;
            } else if (!selectedParentPlant2) {
                selectedParentPlant2 = plant;
            } else {
                addNotification('❌ Two parents already selected!', 'error');
            }
        }, isSelected ? [180, 100, 100] : [100, 150, 100]));
    }

    // Hybridize button
    if (selectedParentPlant1 && selectedParentPlant2) {
        let hybridY = isMobile ? height - 105 : height - 140;

        // Show cross prediction - responsive text
        fill(255, 255, 100);
        noStroke();
        textAlign(CENTER);
        textSize(isMobile ? 11 : 16);
        let crossText = `${selectedParentPlant1.strain} × ${selectedParentPlant2.strain}`;
        if (isMobile && crossText.length > 28) {
            text(`${selectedParentPlant1.strain} ×`, width / 2, hybridY - 26);
            text(selectedParentPlant2.strain, width / 2, hybridY - 14);
        } else {
            text(crossText, width / 2, hybridY - 20);
        }

        let hybridBtnW = isMobile ? 170 : 200;
        let hybridBtnH = isMobile ? 40 : 50;
        buttons.push(new Button(width / 2 - hybridBtnW / 2, hybridY, hybridBtnW, hybridBtnH, '🧬 CROSS BREED', () => {
            playButtonSFX();
            performHybridization(selectedParentPlant1, selectedParentPlant2);
        }, [200, 100, 200]));
    }

    // Back button - better spacing on mobile
    let backBtnY = isMobile ? height - 65 : height - 70;
    let backBtnW = isMobile ? min(170, width * 0.7) : 160;
    let backBtnH = isMobile ? 42 : 45;
    buttons.push(new Button(width / 2 - backBtnW / 2, backBtnY, backBtnW, backBtnH, '⬅️ BACK', () => {
        playButtonSFX();
        selectedParentPlant1 = null;
        selectedParentPlant2 = null;
        gameState = 'growing';
    }, [100, 100, 150]));
}

// Perform hybridization
function performHybridization(parent1, parent2) {
    // Find matching strain in database
    let newStrain = null;

    for (let strainName in strainDatabase) {
        let strain = strainDatabase[strainName];
        if (strain.parents) {
            // Check if parents match (order doesn't matter)
            if ((strain.parents[0] === parent1.strain && strain.parents[1] === parent2.strain) ||
                (strain.parents[0] === parent2.strain && strain.parents[1] === parent1.strain)) {

                // Check special requirements
                let reqMet = true;
                if (strain.specialRequirement === 'indoor' && growLocation !== 'indoor') {
                    addNotification('❌ This cross requires indoor growing!', 'error');
                    reqMet = false;
                }
                if (strain.specialRequirement === 'outdoor' && growLocation !== 'outdoor') {
                    addNotification('❌ This cross requires outdoor growing!', 'error');
                    reqMet = false;
                }
                if (strain.specialRequirement === 'frost' && weather.current !== 'frost') {
                    addNotification('❌ This cross requires frost conditions!', 'error');
                    reqMet = false;
                }
                if (strain.specialRequirement === 'perfect') {
                    if (parent1.health < 100 || parent2.health < 100) {
                        addNotification('❌ Both parents must be at 100% health!', 'error');
                        reqMet = false;
                    }
                    if (growLocation !== 'indoor') {
                        addNotification('❌ Must be grown indoors!', 'error');
                        reqMet = false;
                    }
                    if (weather.current !== 'frost') {
                        addNotification('❌ Requires frost harvest!', 'error');
                        reqMet = false;
                    }
                }

                if (reqMet) {
                    newStrain = strainName;
                    break;
                }
            }
        }
    }

    if (newStrain) {
        // Success! Unlock new strain
        if (!player.unlockedStrains.includes(newStrain)) {
            player.unlockedStrains.push(newStrain);
            addNotification(`🎉 Unlocked new strain: ${newStrain}!`, 'success');
        }

        // Generate hybrid seeds
        let seedCount = floor(random(2, 6));
        let quality = (parent1.health + parent2.health) / 200; // Average quality

        for (let i = 0; i < seedCount; i++) {
            player.inventory.seeds.push({
                strain: newStrain,
                gender: null,
                quality: quality
            });
        }

        addNotification(`🌰 Created ${seedCount} ${newStrain} seeds!`, 'success');

        // Remove parent plants
        plants = plants.filter(p => p !== parent1 && p !== parent2);
        selectedParentPlant1 = null;
        selectedParentPlant2 = null;

        gameState = 'growing';
    } else {
        addNotification('❌ No known strain from this cross! Try different combinations.', 'error');
    }
}

// === MOUSE/TOUCH HANDLING ===
function mousePressed() {
    // Check if tap/click is on a notification (tap to clear)
    for (let notifBound of notificationBounds) {
        if (mouseX >= notifBound.x && mouseX <= notifBound.x + notifBound.width &&
            mouseY >= notifBound.y && mouseY <= notifBound.y + notifBound.height) {
            // Remove the tapped notification
            notifications.splice(notifBound.index, 1);
            playButtonSFX();
            return; // Stop processing other clicks
        }
    }

    // Handle button clicks
    for (let btn of buttons) {
        if (btn.isClicked(mouseX, mouseY)) {
            btn.action();
            return;
        }
    }

    // Handle plant selection in growing screen
    if (gameState === 'growing') {
        selectedPlant = null;
        for (let plant of plants) {
            plant.selected = false;
            if (plant.isClicked(mouseX, mouseY)) {
                plant.selected = true;
                selectedPlant = plant;
            }
        }
    }
}

function touchStarted() {
    mousePressed();
    return false; // Prevent default
}

// === INTRO VIDEO HANDLING (HTML-based like CLOSE ENCOUNTER) ===
function setupIntroVideoHandling() {
    const tapToStart = document.getElementById('tapToStart');
    const videoIntro = document.getElementById('videoIntro');
    const introVideoElement = document.getElementById('introVideo');

    // Initially hide the video (it will be shown after tap)
    videoIntro.style.display = 'none';

    function showMenuScreen() {
        // Fade out video intro
        videoIntro.classList.add('fade-out');

        // After fade out completes, hide video and show menu
        setTimeout(() => {
            videoIntro.classList.remove('show');
            videoIntro.classList.add('hidden');
            gameState = 'titleScreen';
            videoPlaying = false;

            // Start menu music after video ends
            startBackgroundMusic();
        }, 1000); // Match the fade-out transition duration
    }

    // Handle tap to start
    function handleTapToStart() {
        // Hide tap to start screen
        tapToStart.classList.add('hidden');

        setTimeout(() => {
            tapToStart.classList.add('fade-out');

            // Show and start video with audio
            videoIntro.classList.remove('hidden');
            videoIntro.classList.add('show');
            introVideoElement.muted = false; // Enable audio

            // Force video to be visible
            introVideoElement.style.display = 'block';

            // Try to play the video with audio
            const playPromise = introVideoElement.play();

            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('✓ Video playing with audio');
                    videoPlaying = true;
                    videoLoaded = true;
                }).catch(error => {
                    console.log('⚠ Video play failed, trying muted:', error);
                    // Fallback to muted if audio fails
                    introVideoElement.muted = true;
                    introVideoElement.play().then(() => {
                        console.log('✓ Video playing muted');
                        videoPlaying = true;
                        videoLoaded = true;
                    }).catch(e => {
                        console.log('✗ Muted video also failed, showing menu:', e);
                        showMenuScreen();
                    });
                });
            }
        }, 500); // Short delay for smooth transition
    }

    // Add tap/click listeners to tap-to-start screen
    tapToStart.addEventListener('click', handleTapToStart);
    tapToStart.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleTapToStart();
    }, { passive: false });

    // Handle video ended event
    introVideoElement.addEventListener('ended', showMenuScreen);

    // Handle video error (fallback to menu immediately)
    introVideoElement.addEventListener('error', () => {
        console.log('✗ Video intro error, showing menu directly');
        showMenuScreen();
    });

    // Optional: Add skip button (click/touch video to skip)
    videoIntro.addEventListener('click', () => {
        if (videoPlaying && !videoSkipped) {
            videoSkipped = true;
            introVideoElement.pause();
            showMenuScreen();
        }
    });
}

// === WINDOW RESIZE ===
function windowResized() {
    // Responsive canvas sizing that works on desktop and mobile
    let canvasWidth, canvasHeight;

    // Determine canvas dimensions based on device and orientation
    if (windowWidth < 768) {
        // Mobile devices - use FULL viewport for better experience
        canvasWidth = windowWidth;
        canvasHeight = windowHeight;
    } else {
        // Desktop/tablet - keep original behavior
        canvasWidth = min(800, windowWidth);
        canvasHeight = min(600, windowHeight);
    }

    resizeCanvas(canvasWidth, canvasHeight);
}
