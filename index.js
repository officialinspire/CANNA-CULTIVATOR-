// === GAME STATE ===
let gameState = 'titleScreen'; // titleScreen, strainSelect, locationSelect, growing, shop, harvest, hybridization
let player = {
    money: 500,
    inventory: {
        seeds: [],
        nutrients: { nitrogen: 10, phosphorus: 10, potassium: 10 },
        pesticide: 5,
        water: 100,
        lights: { type: 'basic', power: 100 }
    },
    harvestedWeed: [],
    completedFirstHarvest: false
};

let plants = [];
let maxPlants = 4;
let gameTime = 0;
let dayNightCycle = 0;
let timeSpeed = 0.3; // Slow down time significantly

// === STRAIN DATABASE ===
const strainDatabase = {
    'Northern Lights': {
        color: [120, 255, 120],
        growthRate: 1.0,
        potency: 70,
        price: 15,
        flowering: 60,
        difficulty: 'easy'
    },
    'Sour Diesel': {
        color: [255, 255, 100],
        growthRate: 0.9,
        potency: 85,
        price: 20,
        flowering: 70,
        difficulty: 'medium'
    },
    'Purple Haze': {
        color: [200, 120, 255],
        growthRate: 0.8,
        potency: 90,
        price: 25,
        flowering: 75,
        difficulty: 'hard'
    }
};

let availableStrains = Object.keys(strainDatabase);
let selectedStrain = null;
let growLocation = null; // 'indoor' or 'outdoor'

// === UI ELEMENTS ===
let buttons = [];
let notifications = [];

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
        for (let i = 0; i < numLeaves; i++) {
            this.leaves.push({
                x: random(-this.width, this.width),
                y: -this.height * (i / numLeaves),
                size: random(8, 15),
                angle: random(-PI/4, PI/4)
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

        // Generate buds during flowering - slower
        if (this.stage === 'flowering' && this.gender === 'female' && this.buds.length < 12) {
            if (floor(this.age) % 100 === 0) {
                this.buds.push({
                    x: random(-this.width * 0.5, this.width * 0.5),
                    y: random(-this.height * 0.8, -this.height * 0.2),
                    size: random(6, 12),
                    crystals: []
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
        textFont('Baloo 2');
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

    water(amount) {
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
        textFont('Fredoka');
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(min(this.h * 0.45, 16));
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

// === NOTIFICATION SYSTEM ===
function addNotification(message, type = 'info') {
    notifications.push({
        message: message,
        type: type,
        time: gameTime,
        alpha: 255
    });
}

function displayNotifications() {
    let xOffset = 10; // Left margin
    let yOffset = 75; // Start below the top UI bar (65px + 10px margin)
    let notifWidth = min(320, width * 0.4); // Responsive width, max 320px

    for (let i = notifications.length - 1; i >= 0; i--) {
        let notif = notifications[i];
        let age = gameTime - notif.time;

        // Much faster clearing - after 90 frames (reduced from 180)
        if (age > 90) {
            notif.alpha -= 8; // Faster fade
            if (notif.alpha <= 0) {
                notifications.splice(i, 1);
                continue;
            }
        }

        let bgColor = notif.type === 'success' ? [76, 175, 80] :
                     notif.type === 'warning' ? [255, 152, 0] :
                     notif.type === 'error' ? [244, 67, 54] : [33, 150, 243];

        push();
        // Notification background - positioned in left corner
        fill(bgColor[0], bgColor[1], bgColor[2], notif.alpha * 0.95);
        stroke(255, notif.alpha);
        strokeWeight(2);
        rect(xOffset, yOffset, notifWidth, 38, 8);

        // Notification text - left aligned
        textFont('Baloo 2');
        fill(255, notif.alpha);
        noStroke();
        textAlign(LEFT, CENTER);
        textSize(12);
        text(notif.message, xOffset + 10, yOffset + 19);
        pop();

        yOffset += 43;
    }
}

// === P5.JS SETUP ===
function setup() {
    let canvas = createCanvas(min(800, windowWidth), min(600, windowHeight));
    canvas.parent('game-container');
    textFont('Arial');
}

function draw() {
    background(20, 40, 30);
    
    gameTime += timeSpeed;
    dayNightCycle += 0.002; // Much slower day/night cycle

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
    } else if (gameState === 'harvest') {
        drawHarvestScreen();
    } else if (gameState === 'hybridization') {
        drawHybridizationScreen();
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
    textFont('Righteous');
    
    // Glow layers
    fill(100, 255, 100, 50);
    textAlign(CENTER, CENTER);
    textSize(min(width * 0.13, 66));
    text('🌿 GROW QUEST 🌿', width / 2 + 3, height / 3 + 3);
    
    fill(150, 255, 150, 100);
    textSize(min(width * 0.13, 66));
    text('🌿 GROW QUEST 🌿', width / 2 + 2, height / 3 + 2);
    
    // Main title
    fill(220, 255, 220);
    textSize(min(width * 0.13, 66));
    text('🌿 GROW QUEST 🌿', width / 2, height / 3);

    textFont('Fredoka');
    textSize(min(width * 0.045, 22));
    fill(180, 255, 180);
    text('Cannabis Cultivation Simulator', width / 2, height / 3 + 50);

    // Animated plant with more detail
    push();
    translate(width / 2, height / 2 + 80);
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

    // Button
    buttons = [];
    buttons.push(new Button(width / 2 - 120, height - 140, 240, 60, '🎮 START GAME', () => {
        gameState = 'strainSelect';
        addNotification('👋 Welcome to Grow Quest!', 'success');
    }, [76, 175, 80]));
}

// === STRAIN SELECTION ===
function drawStrainSelect() {
    push();
    
    // Title with better font - perfectly centered
    textFont('Righteous');
    fill(220, 255, 220);
    textAlign(CENTER);
    textSize(32);
    text('Choose Your Starter Strain', width / 2, 32);

    textFont('Fredoka');
    textSize(14);
    fill(180, 255, 180);
    text('Select your first cannabis seed (Like choosing your starter Pokemon!)', width / 2, 58);

    // Strain cards - perfectly centered horizontally AND vertically
    let cardWidth = 240;
    let cardHeight = 270;
    let totalWidth = cardWidth * 3;
    let spacing = 20;
    totalWidth += spacing * 2; // Add spacing between cards

    let startX = (width - totalWidth) / 2; // Center the whole group horizontally
    let titleHeight = 70; // Space for title
    let startY = (height - cardHeight) / 2 + titleHeight / 2; // Center vertically considering title

    buttons = [];

    let strains = availableStrains.slice(0, 3);
    for (let i = 0; i < strains.length; i++) {
        let strain = strains[i];
        let data = strainDatabase[strain];
        let x = startX + i * (cardWidth + spacing);
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
        textFont('Fredoka');
        fill(data.color[0] + 30, data.color[1] + 30, data.color[2] + 30);
        noStroke();
        textAlign(CENTER);
        textSize(18);
        text(strain, x + cardWidth / 2, y + 26);

        // Stats with better formatting
        textFont('Baloo 2');
        textSize(13);
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

    pop();
}

function selectStrain(strain) {
    selectedStrain = strain;
    player.inventory.seeds.push({
        strain: strain,
        gender: null // Unknown until planted
    });
    gameState = 'locationSelect';
    addNotification(`🌱 Selected ${strain}!`, 'success');
}

// === LOCATION SELECTION ===
function drawLocationSelect() {
    push();
    
    textFont('Righteous');
    fill(220, 255, 220);
    textAlign(CENTER);
    textSize(34);
    text('Choose Growing Location', width / 2, 40);

    buttons = [];

    // Cards with perfect centering - horizontally AND vertically
    let cardWidth = 340;
    let cardHeight = 330;
    let spacing = 30;
    let totalWidth = cardWidth * 2 + spacing;
    let startX = (width - totalWidth) / 2;
    let titleHeight = 50; // Space for title
    let cardY = (height - cardHeight) / 2 + titleHeight / 2; // Center vertically considering title

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

    textFont('Fredoka');
    fill(180, 180, 255);
    noStroke();
    textSize(28);
    text('🏠 INDOOR', indoorX + cardWidth / 2, indoorY + 35);

    textFont('Baloo 2');
    textSize(15);
    fill(200, 200, 255);
    textAlign(LEFT);
    let infoX = indoorX + 22;
    let lineHeight = 28;
    let startInfo = indoorY + 80;
    text('✓ Controlled environment', infoX, startInfo);
    text('✓ No weather effects', infoX, startInfo + lineHeight);
    text('✓ Consistent lighting', infoX, startInfo + lineHeight * 2);
    text('✓ Year-round growing', infoX, startInfo + lineHeight * 3);
    fill(255, 150, 150);
    text('✗ Light upgrades needed', infoX, startInfo + lineHeight * 4.5);
    text('✗ Higher electricity cost', infoX, startInfo + lineHeight * 5.5);

    buttons.push(new Button(
        indoorX + 30, 
        indoorY + cardHeight - 55, 
        cardWidth - 60, 
        45, 
        'GROW INDOOR', 
        () => startGrowing('indoor'),
        [100, 100, 220]
    ));

    // Outdoor card
    let outdoorX = startX + cardWidth + spacing;
    let outdoorY = cardY;
    
    // Shadow
    fill(0, 0, 0, 80);
    noStroke();
    rect(outdoorX + 4, outdoorY + 4, cardWidth, cardHeight, 12);
    
    // Card
    fill(35, 55, 35);
    stroke(150, 255, 150);
    strokeWeight(3);
    rect(outdoorX, outdoorY, cardWidth, cardHeight, 12);

    textFont('Fredoka');
    fill(180, 255, 180);
    noStroke();
    textSize(28);
    text('🌞 OUTDOOR', outdoorX + cardWidth / 2, outdoorY + 35);

    textFont('Baloo 2');
    textSize(15);
    fill(200, 255, 200);
    textAlign(LEFT);
    let outX = outdoorX + 22;
    text('✓ Natural sunlight (free)', outX, startInfo);
    text('✓ Larger plants possible', outX, startInfo + lineHeight);
    text('✓ No electricity needed', outX, startInfo + lineHeight * 2);
    text('✓ Authentic experience', outX, startInfo + lineHeight * 3);
    fill(255, 200, 150);
    text('✗ Weather dependent', outX, startInfo + lineHeight * 4.5);
    text('✗ More pest problems', outX, startInfo + lineHeight * 5.5);

    buttons.push(new Button(
        outdoorX + 30, 
        outdoorY + cardHeight - 55, 
        cardWidth - 60, 
        45, 
        'GROW OUTDOOR', 
        () => startGrowing('outdoor'),
        [76, 185, 80]
    ));

    pop();
}

function startGrowing(location) {
    growLocation = location;
    
    // Create first plant
    let plantX = width / 2;
    let plantY = height / 2 + 50;
    plants.push(new Plant(selectedStrain, location, plantX, plantY));
    
    gameState = 'growing';
    addNotification(`🌱 Started growing ${selectedStrain} ${location}!`, 'success');
}

// === GROWING SCREEN ===
let selectedPlant = null;

function drawGrowingScreen() {
    // Background gradient based on location
    if (growLocation === 'indoor') {
        // Indoor grow tent - enhanced graphics
        // Dark background with subtle color variation
        let bgColor = lerpColor(color(25, 28, 35), color(35, 38, 45), sin(gameTime * 0.01) * 0.5 + 0.5);
        background(bgColor);

        // Back wall - grow tent reflective material
        noStroke();
        fill(45, 48, 58);
        rect(width * 0.1, 0, width * 0.8, height - 140);

        // Reflective mylar effect on walls
        fill(55, 58, 68, 180);
        for (let i = 0; i < 8; i++) {
            let x = width * 0.1 + i * (width * 0.8 / 8);
            quad(x, 0, x + width * 0.1, 0, x + width * 0.1, height - 140, x, height - 140);
        }

        // Side walls with depth
        fill(38, 41, 50);
        triangle(0, 0, width * 0.1, 0, width * 0.1, height - 140);
        triangle(0, 0, 0, height - 140, width * 0.1, height - 140);

        fill(38, 41, 50);
        triangle(width, 0, width * 0.9, 0, width * 0.9, height - 140);
        triangle(width, 0, width, height - 140, width * 0.9, height - 140);

        // Floor - concrete/tent floor
        fill(48, 51, 58);
        rect(0, height - 140, width, 140);

        // Floor texture with tiles
        stroke(35, 38, 45);
        strokeWeight(2);
        for (let x = 0; x < width; x += 60) {
            line(x, height - 140, x, height);
        }
        for (let y = height - 140; y < height; y += 60) {
            line(0, y, width, y);
        }

        // Floor gradient for depth
        noStroke();
        fill(28, 31, 38, 100);
        rect(0, height - 140, width, 40);

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

        // Enhanced ground layers with better texture
        noStroke();

        // Rich topsoil layer
        fill(101, 67, 33);
        rect(0, height - 95, width, 95);

        // Soil texture variation
        for (let i = 0; i < 30; i++) {
            fill(random(80, 120), random(50, 80), random(25, 45), random(30, 80));
            let sx = random(width);
            let sy = random(height - 95, height);
            ellipse(sx, sy, random(5, 15), random(3, 8));
        }

        // Lush grass layer - varied green tones
        let grassBaseColor = lerpColor(color(65, 150, 30), color(85, 180, 40), timeOfDay);
        fill(grassBaseColor);
        rect(0, height - 110, width, 15);

        // Grass texture patches
        fill(red(grassBaseColor) - 10, green(grassBaseColor) - 10, blue(grassBaseColor) - 10, 100);
        for (let i = 0; i < 15; i++) {
            let gx = random(width);
            ellipse(gx, height - 105, random(20, 50), random(8, 12));
        }

        // Dense grass blades with variety
        for (let i = 0; i < width; i += 4) {
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
    // Enhanced header with gradient background
    noStroke();
    // Gradient from dark green to darker green
    for (let i = 0; i < 65; i++) {
        let alpha = map(i, 0, 65, 250, 235);
        let greenShade = map(i, 0, 65, 15, 20);
        fill(greenShade, greenShade + 10, greenShade, alpha);
        rect(0, i, width, 1);
    }

    // Decorative border with glow effect
    stroke(76, 175, 80, 200);
    strokeWeight(3);
    line(0, 65, width, 65);
    stroke(100, 220, 100, 100);
    strokeWeight(1);
    line(0, 63, width, 63);

    textFont('Fredoka');
    noStroke();

    // LEFT SECTION - Money & Day
    // Money with icon background
    fill(255, 215, 0, 30);
    ellipse(35, 22, 50, 50);
    fill(255, 215, 0);
    textAlign(LEFT, CENTER);
    textSize(22);
    textStyle(BOLD);
    text(`💰 $${player.money}`, 15, 20);

    // Day counter with subtle background
    fill(124, 179, 66, 30);
    rect(10, 38, 140, 22, 4);
    fill(180, 255, 180);
    textSize(15);
    textStyle(NORMAL);
    text(`📅 Day ${floor(gameTime / 180)}`, 18, 48);

    // CENTER/RIGHT SECTION - Organized inventory with better spacing
    let rightStartX = width - 460;
    let topRowY = 20;
    let bottomRowY = 45;
    let itemSpacing = 110;

    // Background panels for better organization
    fill(41, 128, 185, 25);
    rect(rightStartX - 5, topRowY - 14, itemSpacing - 8, 26, 4);
    fill(46, 125, 50, 25);
    rect(rightStartX + itemSpacing - 5, topRowY - 14, itemSpacing - 8, 26, 4);
    fill(142, 68, 173, 25);
    rect(rightStartX + itemSpacing * 2 - 5, topRowY - 14, itemSpacing - 8, 26, 4);
    fill(230, 126, 34, 25);
    rect(rightStartX + itemSpacing * 3 - 5, topRowY - 14, itemSpacing - 8, 26, 4);

    // Top row - Water and NPK nutrients
    textAlign(CENTER, CENTER);
    textSize(15);
    textStyle(BOLD);

    // Water
    fill(100, 200, 255);
    text(`💧 ${floor(player.inventory.water)}`, rightStartX + 45, topRowY);

    // Nitrogen
    fill(120, 255, 120);
    text(`🌱 ${floor(player.inventory.nutrients.nitrogen)}`, rightStartX + itemSpacing + 45, topRowY);

    // Phosphorus
    fill(220, 130, 255);
    text(`🌸 ${floor(player.inventory.nutrients.phosphorus)}`, rightStartX + itemSpacing * 2 + 45, topRowY);

    // Potassium
    fill(255, 200, 120);
    text(`🍌 ${floor(player.inventory.nutrients.potassium)}`, rightStartX + itemSpacing * 3 + 45, topRowY);

    // Bottom row - Pesticide and Light power
    fill(211, 84, 0, 25);
    rect(rightStartX + itemSpacing - 5, bottomRowY - 14, itemSpacing - 8, 26, 4);
    fill(241, 196, 15, 25);
    rect(rightStartX + itemSpacing * 2 - 5, bottomRowY - 14, itemSpacing - 8, 26, 4);

    // Pesticide
    fill(255, 140, 140);
    text(`🔫 ${player.inventory.pesticide}`, rightStartX + itemSpacing + 45, bottomRowY);

    // Light power
    fill(255, 255, 180);
    text(`💡 ${player.inventory.lights.power}%`, rightStartX + itemSpacing * 2 + 45, bottomRowY);

    textStyle(NORMAL);
}

function drawControlPanel() {
    let panelHeight = 130;
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
    let btnY = height - 105;
    let btnHeight = 38;
    let btnSpacing = 8;
    let totalBtns = 6;
    let btnWidth = (width - btnSpacing * (totalBtns + 1)) / totalBtns;

    let x = btnSpacing;
    
    textFont('Baloo 2');

    // Water button - earthy blue/cyan color
    let waterBtn = new Button(x, btnY, btnWidth, btnHeight, '💧', () => {
        if (!selectedPlant) {
            addNotification('❌ Select a plant first!', 'error');
        } else if (player.inventory.water < 10) {
            addNotification('❌ Not enough water!', 'error');
        } else {
            selectedPlant.water(30);
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
        gameState = 'shop';
    }, [241, 196, 15])); // Golden yellow

    // Bottom row - Harvest and Plant buttons
    btnY = height - 58;
    x = btnSpacing;
    btnWidth = (width - btnSpacing * 3) / 2;

    let harvestBtn = new Button(x, btnY, btnWidth, btnHeight, '✂️ HARVEST', () => {
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
    x += btnWidth + btnSpacing;

    // Plant seed button - deep earthy indigo
    let plantBtn = new Button(x, btnY, btnWidth, btnHeight, '🌱 PLANT', () => {
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
    let panelW = min(330, width * 0.85);
    let panelH = 220;
    let panelX = width - panelW - 15; // Position on right side
    let panelY = 80; // Below top UI

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
    textFont('Fredoka');
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

    textFont('Baloo 2');
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
        textFont('Fredoka');
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
        
        if (!player.completedFirstHarvest) {
            player.completedFirstHarvest = true;
            // Unlock other two strains
            for (let strain of Object.keys(strainDatabase)) {
                if (strain !== selectedStrain) {
                    player.inventory.seeds.push({ strain: strain, gender: null });
                }
            }
            addNotification('🎉 New strains unlocked!', 'success');
        }
    } else {
        // Male plant - harvest seeds
        let seedCount = floor(random(3, 8));
        for (let i = 0; i < seedCount; i++) {
            player.inventory.seeds.push({ strain: plant.strain, gender: null });
        }
        addNotification(`🌰 Collected ${seedCount} seeds from male plant!`, 'success');
    }

    // Remove plant
    plants = plants.filter(p => p !== plant);
    selectedPlant = null;
}

function plantNewSeed() {
    if (player.inventory.seeds.length === 0) return;
    
    // Simple seed selection (first available)
    let seed = player.inventory.seeds.pop();
    
    // Position new plant
    let spacing = width / (maxPlants + 1);
    let plantX = spacing * (plants.length + 1);
    let plantY = height / 2 + 50;
    
    plants.push(new Plant(seed.strain, growLocation, plantX, plantY));
    addNotification(`🌱 Planted ${seed.strain} seed!`, 'success');
}

// === SHOP ===
function drawShop() {
    background(25, 35, 25);

    // Title
    fill(255, 215, 0);
    textAlign(CENTER, TOP);
    textSize(32);
    textStyle(BOLD);
    text('🏪 GROW SHOP', width / 2, 20);

    // Money display
    fill(150, 255, 150);
    textSize(20);
    text(`💰 Balance: $${player.money}`, width / 2, 60);

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

    let cardW = min(220, width * 0.4);
    let cardH = 100;
    let cols = floor(width / (cardW + 20));
    let startX = (width - cols * (cardW + 20)) / 2 + 10;
    let startY = 110;

    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        let col = i % cols;
        let row = floor(i / cols);
        let x = startX + col * (cardW + 20);
        let y = startY + row * (cardH + 15);

        // Card
        fill(30, 50, 30);
        stroke(76, 175, 80);
        strokeWeight(2);
        rect(x, y, cardW, cardH, 8);

        // Item info
        fill(255);
        noStroke();
        textAlign(LEFT, TOP);
        textSize(16);
        textStyle(BOLD);
        text(`${item.icon} ${item.name}`, x + 10, y + 10);

        textSize(14);
        textStyle(NORMAL);
        fill(255, 215, 0);
        text(`💰 $${item.cost}`, x + 10, y + 35);

        // Buy button
        let btn = new Button(x + 10, y + cardH - 35, cardW - 20, 28, 'BUY', item.action, [76, 175, 80]);
        btn.enabled = player.money >= item.cost;
        buttons.push(btn);
    }

    // Sell weed section
    if (player.harvestedWeed.length > 0) {
        let sellY = startY + Math.ceil(items.length / cols) * (cardH + 15) + 20;
        
        fill(255, 215, 0);
        textAlign(CENTER, TOP);
        textSize(24);
        textStyle(BOLD);
        text('💰 SELL HARVESTED WEED', width / 2, sellY);

        let sellStartY = sellY + 40;
        for (let i = 0; i < player.harvestedWeed.length; i++) {
            let weed = player.harvestedWeed[i];
            let y = sellStartY + i * 50;

            fill(30, 50, 30);
            stroke(139, 195, 74);
            strokeWeight(2);
            rect(20, y, width - 40, 45, 8);

            fill(200, 255, 200);
            noStroke();
            textAlign(LEFT, CENTER);
            textSize(14);
            text(`🌿 ${weed.strain} - ${weed.amount}g (${weed.quality}% quality)`, 30, y + 22);

            let sellPrice = weed.amount * weed.price;
            buttons.push(new Button(
                width - 150, 
                y + 8, 
                130, 
                30, 
                `SELL $${sellPrice}`, 
                () => sellWeed(i),
                [139, 195, 74]
            ));
        }
    }

    // Back button
    buttons.push(new Button(
        width / 2 - 100, 
        height - 60, 
        200, 
        45, 
        '⬅️ BACK TO GROW', 
        () => { gameState = 'growing'; },
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

// === MOUSE/TOUCH HANDLING ===
function mousePressed() {
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

// === WINDOW RESIZE ===
function windowResized() {
    resizeCanvas(min(800, windowWidth), min(600, windowHeight));
}
