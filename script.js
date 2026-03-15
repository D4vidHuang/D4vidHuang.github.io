gsap.registerPlugin(ScrollTrigger);

// Background Particle Animation (Restricted to Hero Section)
const bgCanvas = document.getElementById('bg-canvas');
const heroSection = document.getElementById('hero');
const bgCtx = bgCanvas.getContext('2d');

let bgParticles = [];
const bgParticleCount = 80;
const bgConnectionDistance = 120;

function resizeBgCanvas() {
    bgCanvas.width = heroSection.offsetWidth;
    bgCanvas.height = heroSection.offsetHeight;
    initBgParticles();
}

window.addEventListener('resize', resizeBgCanvas);

class BgParticle {
    constructor() {
        this.x = Math.random() * bgCanvas.width;
        this.y = Math.random() * bgCanvas.height;
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = (Math.random() - 0.5) * 0.2;
        this.size = Math.random() * 1.5 + 0.5;
        this.opacity = Math.random() * 0.3 + 0.1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > bgCanvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > bgCanvas.height) this.vy *= -1;
    }

    draw() {
        bgCtx.beginPath();
        bgCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        bgCtx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        bgCtx.fill();
    }
}

function initBgParticles() {
    bgParticles = [];
    for (let i = 0; i < bgParticleCount; i++) {
        bgParticles.push(new BgParticle());
    }
}

function animateBgParticles() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

    for (let i = 0; i < bgParticles.length; i++) {
        bgParticles[i].update();
        bgParticles[i].draw();

        for (let j = i + 1; j < bgParticles.length; j++) {
            let dx = bgParticles[i].x - bgParticles[j].x;
            let dy = bgParticles[i].y - bgParticles[j].y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < bgConnectionDistance) {
                bgCtx.beginPath();
                bgCtx.strokeStyle = `rgba(255, 255, 255, ${(1 - distance / bgConnectionDistance) * 0.15})`;
                bgCtx.lineWidth = 0.5;
                bgCtx.moveTo(bgParticles[i].x, bgParticles[j].y);
                bgCtx.lineTo(bgParticles[j].x, bgParticles[j].y);
                bgCtx.stroke();
            }
        }
    }
    requestAnimationFrame(animateBgParticles);
}

resizeBgCanvas();
animateBgParticles();

// =========================================
// Avatar Pixel Animation with Photo
// =========================================
const avatarCanvas = document.getElementById('avatar-canvas');
if (avatarCanvas) {
    const aCtx = avatarCanvas.getContext('2d');
    let avatarRect = avatarCanvas.getBoundingClientRect();

    const pixelSize = 8;
    let avatarPixels = [];
    let avatarMouseX = -1000;
    let avatarMouseY = -1000;
    let photoLoaded = false;
    let photoData = null;

    // Load the real photo
    const photo = new Image();
    photo.crossOrigin = "anonymous";
    photo.src = 'images/67e70fbf58af3118dc727599_欧签.jpg';

    // Claude-style minimal pixel avatar (abstract/geometric)
    // Using simple shapes: head circle + body
    const pixelAvatar = [
        "........████........",
        "......████████......",
        ".....██████████.....",
        "....████████████....",
        "....████████████....",
        "...██████████████...",
        "...██████████████...",
        "...██████████████...",
        "....████████████....",
        "....████████████....",
        ".....██████████.....",
        "......████████......",
        "........████........",
        "........████........",
        ".......██████.......",
        "......████████......",
        ".....██████████.....",
        "....████....████....",
        "...████......████...",
        "...███........███...",
    ];

    class AvatarPixel {
        constructor(x, y, pixelChar, photoColor) {
            this.x = x;
            this.y = y;
            this.baseX = x;
            this.baseY = y;
            this.pixelChar = pixelChar;
            this.photoColor = photoColor;
            this.noiseLevel = 1;
            this.targetNoise = 1;
        }

        update(mouseX, mouseY) {
            const dx = this.baseX + pixelSize/2 - mouseX;
            const dy = this.baseY + pixelSize/2 - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const denoiseRadius = 100;

            if (dist < denoiseRadius) {
                this.targetNoise = Math.pow(dist / denoiseRadius, 2);
            } else {
                this.targetNoise = 1;
            }

            this.noiseLevel += (this.targetNoise - this.noiseLevel) * 0.12;
        }

        draw(ctx) {
            let color;

            if (this.noiseLevel < 0.5 && this.photoColor) {
                // Show photo pixel
                color = this.photoColor;
            } else {
                // Show Claude-style pixel art (monochrome gradient)
                if (this.pixelChar === '█') {
                    // Gradient from top to bottom for depth
                    const brightness = 180 + (this.y / avatarRect.height) * 40;
                    color = `rgba(${brightness}, ${brightness}, ${brightness}, 0.9)`;
                } else {
                    color = null;
                }
            }

            if (color) {
                ctx.fillStyle = color;
                ctx.fillRect(this.x, this.y, pixelSize - 0.5, pixelSize - 0.5);
            }
        }
    }

    function initAvatarPixels() {
        avatarRect = avatarCanvas.getBoundingClientRect();
        avatarCanvas.width = avatarRect.width * window.devicePixelRatio;
        avatarCanvas.height = avatarRect.height * window.devicePixelRatio;
        aCtx.scale(window.devicePixelRatio, window.devicePixelRatio);

        avatarPixels = [];
        const cols = Math.floor(avatarRect.width / pixelSize);
        const rows = Math.floor(avatarRect.height / pixelSize);

        // Get photo pixel data if loaded
        let tempCanvas, tempCtx;
        if (photoLoaded) {
            tempCanvas = document.createElement('canvas');
            tempCanvas.width = cols;
            tempCanvas.height = rows;
            tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(photo, 0, 0, cols, rows);
            photoData = tempCtx.getImageData(0, 0, cols, rows).data;
        }

        // Calculate offset to center the avatar pattern
        const patternRows = pixelAvatar.length;
        const patternCols = pixelAvatar[0].length;
        const offsetRow = Math.floor((rows - patternRows) / 2);
        const offsetCol = Math.floor((cols - patternCols) / 2);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * pixelSize;
                const y = row * pixelSize;

                // Get pixel char from pattern
                const patternRow = row - offsetRow;
                const patternCol = col - offsetCol;
                let pixelChar = '.';
                if (patternRow >= 0 && patternRow < patternRows &&
                    patternCol >= 0 && patternCol < patternCols) {
                    pixelChar = pixelAvatar[patternRow][patternCol];
                }

                // Get photo color
                let photoColor = null;
                if (photoData) {
                    const idx = (row * cols + col) * 4;
                    const r = photoData[idx];
                    const g = photoData[idx + 1];
                    const b = photoData[idx + 2];
                    photoColor = `rgb(${r}, ${g}, ${b})`;
                }

                avatarPixels.push(new AvatarPixel(x, y, pixelChar, photoColor));
            }
        }
    }

    function animateAvatar() {
        aCtx.clearRect(0, 0, avatarRect.width, avatarRect.height);

        avatarPixels.forEach(pixel => {
            pixel.update(avatarMouseX, avatarMouseY);
            pixel.draw(aCtx);
        });

        requestAnimationFrame(animateAvatar);
    }

    photo.onload = () => {
        photoLoaded = true;
        initAvatarPixels();
    };

    avatarCanvas.addEventListener('mousemove', (e) => {
        const r = avatarCanvas.getBoundingClientRect();
        avatarMouseX = e.clientX - r.left;
        avatarMouseY = e.clientY - r.top;
    });

    avatarCanvas.addEventListener('mouseleave', () => {
        avatarMouseX = -1000;
        avatarMouseY = -1000;
    });

    initAvatarPixels();
    animateAvatar();
    window.addEventListener('resize', initAvatarPixels);
}

// =========================================
// Diffusion Contact Animation - Interactive
// =========================================
const diffusionCanvas = document.getElementById('diffusion-canvas');
if (diffusionCanvas) {
    const dCtx = diffusionCanvas.getContext('2d');

    // Contact info with labels and noisy/clean versions
    const codeLines = [
        { label: "email", noisy: "████████████████████", clean: "d4vidguess@gmail.com" },
        { label: "github", noisy: "██████████████████████", clean: "github.com/D4vidHuang" },
        { label: "scholar", noisy: "████████████████████", clean: "scholar.google.com/..." },
    ];

    // Store URLs for click handling
    const linkData = [
        { url: "mailto:d4vidguess@gmail.com" },
        { url: "https://github.com/D4vidHuang" },
        { url: "https://scholar.google.com/citations?user=C4xHgUMAAAAJ&hl" },
    ];

    let tokens = [];
    let mouseX = -1000;
    let mouseY = -1000;
    const denoiseRadius = 120;
    let lineYPositions = [];

    class CodeToken {
        constructor(char, x, y, isNoisy, cleanChar, lineIdx) {
            this.noisyChar = char;
            this.cleanChar = cleanChar;
            this.x = x;
            this.y = y;
            this.baseX = x;
            this.baseY = y;
            this.noiseLevel = isNoisy ? 1 : 0;
            this.targetNoise = this.noiseLevel;
            this.offsetX = 0;
            this.offsetY = 0;
            this.isNoisy = isNoisy;
            this.lineIdx = lineIdx;
        }

        update(mouseX, mouseY) {
            const dx = this.baseX - mouseX;
            const dy = this.baseY - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < denoiseRadius) {
                this.targetNoise = Math.pow(dist / denoiseRadius, 1.5);
            } else {
                this.targetNoise = 1;
            }

            this.noiseLevel += (this.targetNoise - this.noiseLevel) * 0.08;

            if (this.isNoisy && this.noiseLevel > 0.1) {
                this.offsetX = (Math.random() - 0.5) * this.noiseLevel * 2;
                this.offsetY = (Math.random() - 0.5) * this.noiseLevel * 1.5;
            } else {
                this.offsetX *= 0.9;
                this.offsetY *= 0.9;
            }
        }

        draw(ctx) {
            const displayChar = this.noiseLevel < 0.4 ? this.cleanChar : this.noisyChar;
            const x = this.baseX + this.offsetX;
            const y = this.baseY + this.offsetY;

            let color;
            if (this.noiseLevel < 0.3) {
                color = `rgba(94, 234, 212, ${1 - this.noiseLevel * 0.5})`;
            } else if (this.noiseLevel < 0.6) {
                color = `rgba(192, 132, 252, ${0.8})`;
            } else {
                color = `rgba(100, 100, 100, ${0.4 + this.noiseLevel * 0.4})`;
            }

            ctx.fillStyle = color;
            ctx.fillText(displayChar, x, y);

            if (this.noiseLevel > 0.5 && this.isNoisy) {
                ctx.fillStyle = `rgba(100, 100, 100, ${this.noiseLevel * 0.15})`;
                ctx.fillText(displayChar, x + 1, y + 1);
            }
        }
    }

    function initDiffusionCanvas() {
        const rect = diffusionCanvas.getBoundingClientRect();
        diffusionCanvas.width = rect.width * window.devicePixelRatio;
        diffusionCanvas.height = rect.height * window.devicePixelRatio;
        dCtx.scale(window.devicePixelRatio, window.devicePixelRatio);

        tokens = [];
        lineYPositions = [];
        const fontSize = 12;
        const lineHeight = 38;
        const labelX = 15;
        const contentX = 85;
        const startY = 32;

        dCtx.font = `${fontSize}px 'Courier New', monospace`;

        codeLines.forEach((line, lineIdx) => {
            const y = startY + lineIdx * lineHeight;
            lineYPositions.push({ y: y, height: lineHeight, label: line.label });

            // Create tokens for content only (labels drawn separately)
            let x = contentX;
            for (let i = 0; i < Math.max(line.noisy.length, line.clean.length); i++) {
                const noisyChar = line.noisy[i] || ' ';
                const cleanChar = line.clean[i] || ' ';
                const isNoisy = noisyChar !== cleanChar;

                tokens.push(new CodeToken(noisyChar, x, y, isNoisy, cleanChar, lineIdx));
                x += dCtx.measureText(noisyChar).width;
            }
        });
    }

    function animateDiffusion() {
        const rect = diffusionCanvas.getBoundingClientRect();
        dCtx.clearRect(0, 0, rect.width, rect.height);

        // Denoise radius glow
        if (mouseX > 0 && mouseY > 0) {
            const gradient = dCtx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, denoiseRadius);
            gradient.addColorStop(0, 'rgba(94, 234, 212, 0.1)');
            gradient.addColorStop(0.5, 'rgba(94, 234, 212, 0.03)');
            gradient.addColorStop(1, 'rgba(94, 234, 212, 0)');
            dCtx.fillStyle = gradient;
            dCtx.beginPath();
            dCtx.arc(mouseX, mouseY, denoiseRadius, 0, Math.PI * 2);
            dCtx.fill();
        }

        // Draw labels
        dCtx.font = '11px "Space Grotesk", sans-serif';
        lineYPositions.forEach((linePos) => {
            dCtx.fillStyle = 'rgba(136, 136, 136, 0.7)';
            dCtx.fillText(linePos.label, 15, linePos.y);
        });

        // Tokens
        dCtx.font = '12px "Courier New", monospace';
        tokens.forEach(token => {
            token.update(mouseX, mouseY);
            token.draw(dCtx);
        });

        requestAnimationFrame(animateDiffusion);
    }

    // Mouse tracking
    diffusionCanvas.addEventListener('mousemove', (e) => {
        const rect = diffusionCanvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;

        // Check if hovering over a revealed link
        let hovering = false;
        lineYPositions.forEach((linePos, idx) => {
            const lineTokens = tokens.filter(t => t.lineIdx === idx);
            const avgNoise = lineTokens.reduce((sum, t) => sum + t.noiseLevel, 0) / lineTokens.length;
            if (avgNoise < 0.4 && mouseY > linePos.y - 15 && mouseY < linePos.y + 10) {
                hovering = true;
            }
        });
        diffusionCanvas.style.cursor = hovering ? 'pointer' : 'default';
    });

    diffusionCanvas.addEventListener('mouseleave', () => {
        mouseX = -1000;
        mouseY = -1000;
        diffusionCanvas.style.cursor = 'default';
    });

    // Click to open links
    diffusionCanvas.addEventListener('click', (e) => {
        const rect = diffusionCanvas.getBoundingClientRect();
        const clickY = e.clientY - rect.top;

        lineYPositions.forEach((linePos, idx) => {
            const lineTokens = tokens.filter(t => t.lineIdx === idx);
            const avgNoise = lineTokens.reduce((sum, t) => sum + t.noiseLevel, 0) / lineTokens.length;

            if (avgNoise < 0.4 && clickY > linePos.y - 15 && clickY < linePos.y + 10) {
                window.open(linkData[idx].url, '_blank');
            }
        });
    });

    initDiffusionCanvas();
    animateDiffusion();
    window.addEventListener('resize', initDiffusionCanvas);
}


// Fade in elements on scroll
const fadeElements = document.querySelectorAll('.card, .education-item, .research-item, .project-item, .medal, .interest-pill');
fadeElements.forEach(el => {
    gsap.from(el, {
        scrollTrigger: {
            trigger: el,
            start: "top 90%",
            toggleActions: "play none none reverse"
        },
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out"
    });
});


/* =========================================
   DLLM Animation Logic (CoRefusion)
   ========================================= */

// --- 1. Define Final Code Structure ---
const realCode = [
    [
        {t:"def", k:"tok-keyword"}, {t:"scaled_dot_product_attention", k:"tok-fixed"}, {t:"(", k:"tok-normal"}, 
        {t:"query", k:"tok-fixed"}, {t:",", k:"tok-normal"}, {t:"key", k:"tok-fixed"}, {t:",", k:"tok-normal"}, 
        {t:"value", k:"tok-fixed"}, {t:"):", k:"tok-normal"}
    ],
    [
        {t:"d_k", k:"tok-fixed"}, {t:"=", k:"tok-normal"}, {t:"query", k:"tok-fixed"}, {t:".", k:"tok-normal"}, 
        {t:"shape", k:"tok-normal"}, {t:"[", k:"tok-normal"}, {t:"-1", k:"tok-normal"}, {t:"]", k:"tok-normal"}
    ],
    [
        {t:"scores", k:"tok-fixed"}, {t:"=", k:"tok-normal"}, {t:"torch", k:"tok-normal"}, {t:".", k:"tok-normal"}, 
        {t:"matmul", k:"tok-normal"}, {t:"(", k:"tok-normal"}, {t:"query", k:"tok-fixed"}, {t:",", k:"tok-normal"}, 
        {t:"key", k:"tok-fixed"}, {t:".", k:"tok-normal"}, {t:"transpose", k:"tok-normal"}, {t:"(", k:"tok-normal"}, 
        {t:"-2", k:"tok-normal"}, {t:",", k:"tok-normal"}, {t:"-1", k:"tok-normal"}, {t:")", k:"tok-normal"}, {t:")", k:"tok-normal"}
    ],
    [
        {t:"scale", k:"tok-fixed"}, {t:"=", k:"tok-normal"}, {t:"math", k:"tok-normal"}, {t:".", k:"tok-normal"}, 
        {t:"sqrt", k:"tok-normal"}, {t:"(", k:"tok-normal"}, {t:"d_k", k:"tok-fixed"}, {t:")", k:"tok-normal"}
    ],
    [
        {t:"attn_weights", k:"tok-fixed"}, {t:"=", k:"tok-normal"}, {t:"torch", k:"tok-normal"}, {t:".", k:"tok-normal"}, 
        {t:"softmax", k:"tok-normal"}, {t:"(", k:"tok-normal"}, {t:"scores", k:"tok-fixed"}, {t:"/", k:"tok-normal"}, 
        {t:"scale", k:"tok-fixed"}, {t:",", k:"tok-normal"}, {t:"dim", k:"tok-normal"}, {t:"=", k:"tok-normal"}, 
        {t:"-1", k:"tok-normal"}, {t:")", k:"tok-normal"}
    ],
    [
        {t:"context", k:"tok-fixed"}, {t:"=", k:"tok-normal"}, {t:"torch", k:"tok-normal"}, {t:".", k:"tok-normal"}, 
        {t:"matmul", k:"tok-normal"}, {t:"(", k:"tok-normal"}, {t:"attn_weights", k:"tok-fixed"}, {t:",", k:"tok-normal"}, 
        {t:"value", k:"tok-fixed"}, {t:")", k:"tok-normal"}
    ],
    [
        {t:"return", k:"tok-keyword"}, {t:"context", k:"tok-fixed"}
    ],
    [
        {t:"[EOS]", k:"tok-eos"} // The True EOS
    ]
];

// Extra dummy lines that will exist in MASK form but disappear
const dummyLines = [
    [ {t:"print", k:"tok-normal"}, {t:"(", k:"tok-normal"}, {t:"context", k:"tok-normal"}, {t:")", k:"tok-normal"} ],
    [ {t:"#", k:"tok-normal"}, {t:"End", k:"tok-normal"}, {t:"of", k:"tok-normal"}, {t:"function", k:"tok-normal"} ],
    [ {t:"pass", k:"tok-keyword"} ]
];

const fullStructure = [...realCode, ...dummyLines];

// --- 2. Step Generation Logic ---
const TOTAL_STEPS = 64;

function randStr(len) {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    let s = "";
    for(let i=0; i<len; i++) s += chars[Math.floor(Math.random()*chars.length)];
    return s;
}

function noisyVar(target) {
    const noiseTypes = [
        () => target.substring(0, 2) + randStr(2),
        () => "var_" + randStr(2),
        () => randStr(target.length)
    ];
    return noiseTypes[Math.floor(Math.random() * noiseTypes.length)]();
}

// Generate the timeline for each token
const tokenTimelines = [];

let trueEOSLineIdx = realCode.length - 1; 
let trueEOSTokIdx = 0;

fullStructure.forEach((line, lineIdx) => {
    const lineTimeline = [];
    line.forEach((tok, tokIdx) => {
        let isTrueEOS = (lineIdx === trueEOSLineIdx && tokIdx === trueEOSTokIdx);
        let isDummy = lineIdx > trueEOSLineIdx;
        
        let isFixedVar = tok.k === "tok-fixed"; 
        
        let revealStep = Math.floor(Math.random() * (TOTAL_STEPS * 0.6));
        let refineStep = revealStep;
        let intermediate = "";

        if (isTrueEOS) {
            revealStep = Math.floor(Math.random() * 20); 
            refineStep = revealStep;
        } else if (isDummy) {
            revealStep = Math.floor(Math.random() * (TOTAL_STEPS * 0.5));
            refineStep = revealStep + 20; 
            intermediate = randStr(5);
        } else if (isFixedVar) {
            const earlyBirdChance = Math.random();
            if (earlyBirdChance < 0.3) {
                 revealStep = Math.floor(Math.random() * 15);
                 refineStep = revealStep + Math.floor(Math.random() * 5);
            } else {
                 refineStep = Math.floor(revealStep + Math.random() * (TOTAL_STEPS - revealStep));
            }
            intermediate = noisyVar(tok.t);
        } else {
            revealStep = Math.floor(Math.random() * (TOTAL_STEPS * 0.8));
            refineStep = revealStep;
        }

        lineTimeline.push({
            final: tok,
            revealAt: revealStep,
            refineAt: refineStep,
            intermediateText: intermediate,
            isTrueEOS: isTrueEOS,
            isDummy: isDummy
        });
    });
    tokenTimelines.push(lineTimeline);
});

// Precompute steps
const steps = [];

for (let s = 0; s <= TOTAL_STEPS; s++) {
    const stepLines = [];
    
    let trueEOSRevealed = false;
    
    // First pass
    tokenTimelines.forEach((lineTL, lIdx) => {
        const stepLine = [];
        lineTL.forEach((tl, tIdx) => {
            let currentTok = { text: "", type: "", isHidden: false };
            
            if (tl.isTrueEOS && s >= tl.revealAt) {
                trueEOSRevealed = true;
            }
            
            if (s < tl.revealAt) {
                currentTok.text = "[MASK]";
                currentTok.type = "tok-masked";
                
                if (s < 20 && Math.random() < 0.02) { 
                     currentTok.text = "[EOS]";
                     currentTok.type = "tok-eos";
                }
                
            } else if (s < tl.refineAt) {
                currentTok.text = tl.intermediateText || randStr(4);
                currentTok.type = "tok-confident";
            } else {
                currentTok.text = tl.final.t;
                currentTok.type = tl.final.k;
            }
            
            stepLine.push(currentTok);
        });
        stepLines.push(stepLine);
    });
    
    // Second pass: truncation
    if (trueEOSRevealed) {
        let cutoff = false;
        for(let l=0; l<stepLines.length; l++) {
            for(let t=0; t<stepLines[l].length; t++) {
                if (cutoff) {
                    stepLines[l][t].isHidden = true;
                    stepLines[l][t].type = "tok-hidden";
                }
                if (l === trueEOSLineIdx && t === trueEOSTokIdx) {
                    cutoff = true;
                }
            }
        }
    }

    const t_val = TOTAL_STEPS - s;
    steps.push({
        label: `Steps to Diffuse = ${t_val}`,
        lines: stepLines
    });
}

// --- 3. Rendering & ScrollTrigger Integration ---
const codeContent = document.getElementById('code-content');
const stepLabel = document.getElementById('step-label');
const progressFill = document.getElementById('progress-fill');

function initDLLM() {
    if (!codeContent) return; // Guard clause if element not found

    // Render initial structure (Step 0)
    steps[0].lines.forEach((lineData, lineIdx) => {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'code-line' + (lineIdx > 0 ? ' indent-1' : ''); 
        
        lineData.forEach(() => {
            const span = document.createElement('span');
            span.className = 'tok';
            lineDiv.appendChild(span);
        });
        
        codeContent.appendChild(lineDiv);
    });

    renderStep(0);
    
    // Use GSAP ScrollTrigger to pin and scrub the animation
    ScrollTrigger.create({
        trigger: "#dllm-animation",
        start: "center center", // Start when section center hits viewport center
        end: "+=2000", // Scroll distance to complete animation (adjust for speed)
        pin: true, // Pin the section
        scrub: 1, // Smooth scrubbing
        onUpdate: (self) => {
            // self.progress goes from 0 to 1
            // We want to map 0->1 to Step 0->TOTAL_STEPS
            const stepIndex = Math.floor(self.progress * TOTAL_STEPS);
            renderStep(stepIndex);
        }
    });
}

function renderStep(stepIndex) {
    if (stepIndex < 0 || stepIndex > TOTAL_STEPS) return;

    const stepData = steps[stepIndex];
    if (stepLabel) stepLabel.textContent = stepData.label;

    const lineElements = codeContent.children;
    
    stepData.lines.forEach((lineData, lineIdx) => {
        if (!lineElements[lineIdx]) return;
        const lineEl = lineElements[lineIdx];
        const tokenElements = lineEl.children;
        
        lineData.forEach((tokenData, tokIdx) => {
            if (tokenElements[tokIdx]) {
                const el = tokenElements[tokIdx];
                
                el.textContent = tokenData.text;
                
                if (tokenData.isHidden) {
                    el.className = 'tok tok-hidden';
                } else {
                    el.className = `tok ${tokenData.type}`;
                }
            }
        });
    });

    if (progressFill) {
        const progress = (stepIndex / TOTAL_STEPS) * 100;
        progressFill.style.width = `${progress}%`;
    }
}

// Init DLLM logic after load
window.addEventListener('load', initDLLM);

/* =========================================
   Dfusion CVPR Workshop Visualization
   ========================================= */
const dfusionCanvas = document.getElementById('dfusion-canvas');
if (dfusionCanvas) {
    const dfCtx = dfusionCanvas.getContext('2d');
    let dfRect = dfusionCanvas.getBoundingClientRect();

    // Image sets
    const images = {
        day: { drop: null, blur: null, clear: null },
        night: { drop: null, blur: null, clear: null }
    };

    let imagesLoaded = 0;
    const totalImages = 6;

    // Load all images
    const imagePaths = {
        'day-drop': 'images/Day_Drop_00009.png',
        'day-blur': 'images/Day_Blur_00009.png',
        'day-clear': 'images/Day_Clear_00009.png',
        'night-drop': 'images/Night_Drop_00017.png',
        'night-blur': 'images/Night_Blur_00017.png',
        'night-clear': 'images/Night_Clear_00017.png'
    };

    Object.entries(imagePaths).forEach(([key, path]) => {
        const img = new Image();
        img.src = path;
        img.onload = () => {
            const [time, type] = key.split('-');
            images[time][type] = img;
            imagesLoaded++;
            if (imagesLoaded === totalImages) {
                initDfusionCanvas();
                animateDfusion();
            }
        };
    });

    // Pixel grid state
    let pixels = [];
    const pixelSize = 12;
    let mouseX = -1000;
    let mouseY = -1000;
    let isMouseDown = false;
    const effectRadius = 80;

    class DfusionPixel {
        constructor(x, y, row, col) {
            this.x = x;
            this.y = y;
            this.row = row;
            this.col = col;
            this.state = 0; // 0 = drop, 1 = blur, 2 = clear
            this.targetState = 0;
            this.transitionProgress = 0;
        }

        update(mouseX, mouseY, isMouseDown) {
            const centerX = this.x + pixelSize / 2;
            const centerY = this.y + pixelSize / 2;
            const dx = centerX - mouseX;
            const dy = centerY - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < effectRadius) {
                if (isMouseDown) {
                    this.targetState = 2; // clear
                } else {
                    this.targetState = 1; // blur
                }
            } else {
                this.targetState = 0; // drop
            }

            // Smooth transition
            if (this.state !== this.targetState) {
                this.transitionProgress += 0.15;
                if (this.transitionProgress >= 1) {
                    this.state = this.targetState;
                    this.transitionProgress = 0;
                }
            }
        }

        draw(ctx, dayImages, nightImages, canvasWidth, canvasHeight, imgWidth, imgHeight) {
            // Determine which half (day or night)
            const isNight = this.x >= canvasWidth / 2;
            const imgSet = isNight ? nightImages : dayImages;

            // Calculate source coordinates
            const srcX = isNight
                ? Math.floor((this.col - Math.floor(canvasWidth / pixelSize / 2)) * (imgWidth / (canvasWidth / pixelSize / 2)))
                : Math.floor(this.col * (imgWidth / (canvasWidth / pixelSize / 2)));
            const srcY = Math.floor(this.row * (imgHeight / (canvasHeight / pixelSize)));
            const srcW = Math.ceil(imgWidth / (canvasWidth / pixelSize / 2));
            const srcH = Math.ceil(imgHeight / (canvasHeight / pixelSize));

            // Get current image based on state
            let currentImg;
            if (this.state === 0) currentImg = imgSet.drop;
            else if (this.state === 1) currentImg = imgSet.blur;
            else currentImg = imgSet.clear;

            if (currentImg) {
                ctx.drawImage(
                    currentImg,
                    Math.max(0, srcX), Math.max(0, srcY),
                    srcW, srcH,
                    this.x, this.y,
                    pixelSize, pixelSize
                );
            }
        }
    }

    function initDfusionCanvas() {
        dfRect = dfusionCanvas.getBoundingClientRect();
        dfusionCanvas.width = dfRect.width * window.devicePixelRatio;
        dfusionCanvas.height = dfRect.height * window.devicePixelRatio;
        dfCtx.scale(window.devicePixelRatio, window.devicePixelRatio);

        pixels = [];
        const cols = Math.ceil(dfRect.width / pixelSize);
        const rows = Math.ceil(dfRect.height / pixelSize);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                pixels.push(new DfusionPixel(col * pixelSize, row * pixelSize, row, col));
            }
        }
    }

    function animateDfusion() {
        dfCtx.clearRect(0, 0, dfRect.width, dfRect.height);

        const dayImg = images.day.drop;
        const nightImg = images.night.drop;

        if (dayImg && nightImg) {
            pixels.forEach(pixel => {
                pixel.update(mouseX, mouseY, isMouseDown);
                pixel.draw(
                    dfCtx,
                    images.day,
                    images.night,
                    dfRect.width,
                    dfRect.height,
                    dayImg.width,
                    dayImg.height
                );
            });

            // Draw center divider
            dfCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            dfCtx.lineWidth = 1;
            dfCtx.beginPath();
            dfCtx.moveTo(dfRect.width / 2, 0);
            dfCtx.lineTo(dfRect.width / 2, dfRect.height);
            dfCtx.stroke();

            // Draw labels
            dfCtx.font = '11px "Space Grotesk", sans-serif';
            dfCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            dfCtx.fillText('DAY', 10, 20);
            dfCtx.fillText('NIGHT', dfRect.width / 2 + 10, 20);
        }

        // Draw effect radius indicator
        if (mouseX > 0 && mouseY > 0) {
            const gradient = dfCtx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, effectRadius);
            if (isMouseDown) {
                gradient.addColorStop(0, 'rgba(94, 234, 212, 0.2)');
                gradient.addColorStop(1, 'rgba(94, 234, 212, 0)');
            } else {
                gradient.addColorStop(0, 'rgba(192, 132, 252, 0.15)');
                gradient.addColorStop(1, 'rgba(192, 132, 252, 0)');
            }
            dfCtx.fillStyle = gradient;
            dfCtx.beginPath();
            dfCtx.arc(mouseX, mouseY, effectRadius, 0, Math.PI * 2);
            dfCtx.fill();
        }

        requestAnimationFrame(animateDfusion);
    }

    // Event listeners
    dfusionCanvas.addEventListener('mousemove', (e) => {
        const r = dfusionCanvas.getBoundingClientRect();
        mouseX = e.clientX - r.left;
        mouseY = e.clientY - r.top;
    });

    dfusionCanvas.addEventListener('mouseleave', () => {
        mouseX = -1000;
        mouseY = -1000;
        isMouseDown = false;
    });

    dfusionCanvas.addEventListener('mousedown', () => {
        isMouseDown = true;
    });

    dfusionCanvas.addEventListener('mouseup', () => {
        isMouseDown = false;
    });

    window.addEventListener('resize', () => {
        if (imagesLoaded === totalImages) {
            initDfusionCanvas();
        }
    });
}

/* =========================================
   Taxonomy Visualization (Promise2025)
   Interactive tree with hover language switching
   ========================================= */
const taxonomyTree = document.getElementById('taxonomy-tree');
const taxonomySummary = document.getElementById('taxonomy-summary');
if (taxonomyTree) {
    // Complete error taxonomy data
    const taxonomyData = [
        {
            code: 'MS', name: 'Model-specific', color: '#ef4444',
            data: { total: 5007, chinese: 1191, dutch: 1072, english: 752, greek: 952, polish: 1040 },
            children: [
                { code: 'MS-IG', name: 'Incoherent Generation', data: { total: 259, chinese: 36, dutch: 42, english: 2, greek: 167, polish: 12 } },
                { code: 'MS-CC', name: 'Copy Context', data: { total: 991, chinese: 81, dutch: 291, english: 70, greek: 307, polish: 242 } },
                {
                    code: 'MS-ME', name: 'Memorization', data: { total: 422, chinese: 224, dutch: 36, english: 74, greek: 41, polish: 47 },
                    children: [
                        { code: 'MS-ME1', name: 'PII', data: { total: 236, chinese: 71, dutch: 32, english: 68, greek: 34, polish: 31 } },
                        { code: 'MS-ME2', name: 'URL', data: { total: 114, chinese: 99, dutch: 1, english: 5, greek: 3, polish: 6 } },
                        { code: 'MS-ME3', name: 'Training Data', data: { total: 72, chinese: 54, dutch: 3, english: 1, greek: 4, polish: 10 } }
                    ]
                },
                { code: 'MS-ET', name: 'Early Termination', data: { total: 164, chinese: 34, dutch: 47, english: 13, greek: 51, polish: 19 } },
                { code: 'MS-LT', name: 'Late Termination', data: { total: 2324, chinese: 660, dutch: 405, english: 491, greek: 296, polish: 472 } },
                {
                    code: 'MS-RE', name: 'Repetition', data: { total: 847, chinese: 156, dutch: 251, english: 102, greek: 90, polish: 248 },
                    children: [
                        { code: 'MS-RE1', name: 'Pattern', data: { total: 317, chinese: 55, dutch: 109, english: 79, greek: 6, polish: 68 } },
                        { code: 'MS-RE2', name: 'Verbatim', data: { total: 530, chinese: 101, dutch: 142, english: 23, greek: 84, polish: 180 } }
                    ]
                }
            ]
        },
        {
            code: 'LG', name: 'Linguistic', color: '#f59e0b',
            data: { total: 1728, chinese: 17, dutch: 224, english: 66, greek: 998, polish: 423 },
            children: [
                {
                    code: 'LG-GR', name: 'Grammar', data: { total: 1420, chinese: 0, dutch: 118, english: 65, greek: 887, polish: 350 },
                    children: [
                        { code: 'LG-GR1', name: 'Plurality', data: { total: 17, chinese: 0, dutch: 1, english: 0, greek: 15, polish: 1 } },
                        { code: 'LG-GR2', name: 'Conjugation', data: { total: 169, chinese: 0, dutch: 8, english: 0, greek: 59, polish: 102 } },
                        { code: 'LG-GR3', name: 'Gender', data: { total: 130, chinese: 0, dutch: 23, english: 0, greek: 84, polish: 23 } },
                        { code: 'LG-GR4', name: 'Syntax', data: { total: 227, chinese: 0, dutch: 25, english: 42, greek: 39, polish: 121 } },
                        { code: 'LG-GR5', name: 'Cohesion', data: { total: 876, chinese: 0, dutch: 60, english: 23, greek: 690, polish: 103 } }
                    ]
                },
                { code: 'LG-IS', name: 'Incorrect Synonym', data: { total: 128, chinese: 0, dutch: 0, english: 0, greek: 96, polish: 32 } },
                {
                    code: 'LG-WL', name: 'Wrong Language', data: { total: 180, chinese: 17, dutch: 106, english: 1, greek: 15, polish: 41 },
                    children: [
                        { code: 'LG-WL1', name: 'Undesired Trans.', data: { total: 40, chinese: 1, dutch: 9, english: 0, greek: 12, polish: 18 } },
                        { code: 'LG-WL2', name: 'Incorrect Lang.', data: { total: 140, chinese: 16, dutch: 97, english: 1, greek: 3, polish: 23 } }
                    ]
                }
            ]
        },
        {
            code: 'SE', name: 'Semantic', color: '#8b5cf6',
            data: { total: 8333, chinese: 2915, dutch: 1350, english: 786, greek: 1759, polish: 1523 },
            children: [
                { code: 'SE-MD', name: 'Missing Details', data: { total: 837, chinese: 413, dutch: 107, english: 19, greek: 96, polish: 202 } },
                { code: 'SE-TS', name: 'Too Specific', data: { total: 168, chinese: 91, dutch: 21, english: 1, greek: 13, polish: 42 } },
                {
                    code: 'SE-HA', name: 'Hallucination', data: { total: 4239, chinese: 1639, dutch: 636, english: 406, greek: 928, polish: 630 },
                    children: [
                        { code: 'SE-HA1', name: 'Misplaced Facts', data: { total: 325, chinese: 79, dutch: 105, english: 42, greek: 8, polish: 91 } },
                        { code: 'SE-HA2', name: 'Out of Context', data: { total: 550, chinese: 385, dutch: 80, english: 12, greek: 57, polish: 16 } },
                        { code: 'SE-HA3', name: 'In Context', data: { total: 3364, chinese: 1175, dutch: 451, english: 352, greek: 863, polish: 523 } }
                    ]
                },
                {
                    code: 'SE-CS', name: 'Code Inclusion', data: { total: 3009, chinese: 718, dutch: 574, english: 355, greek: 722, polish: 640 },
                    children: [
                        { code: 'SE-CS1', name: 'Commented', data: { total: 171, chinese: 6, dutch: 68, english: 12, greek: 15, polish: 70 } },
                        { code: 'SE-CS2', name: 'Runnable', data: { total: 2838, chinese: 712, dutch: 506, english: 343, greek: 707, polish: 570 } }
                    ]
                },
                { code: 'SE-OI', name: 'Omitted Identifier', data: { total: 80, chinese: 54, dutch: 12, english: 5, greek: 0, polish: 9 } }
            ]
        },
        {
            code: 'ST', name: 'Syntax', color: '#06b6d4',
            data: { total: 84, chinese: 31, dutch: 2, english: 21, greek: 5, polish: 25 },
            children: [
                { code: 'ST-IF', name: 'Incorrect Format', data: { total: 84, chinese: 31, dutch: 2, english: 21, greek: 5, polish: 25 } }
            ]
        }
    ];

    let currentLang = 'total';

    function getTotal(lang) {
        return taxonomyData.reduce((sum, cat) => sum + cat.data[lang], 0);
    }

    function getCategoryMax(category, lang) {
        let max = category.data[lang];
        if (category.children) {
            category.children.forEach(child => {
                if (child.data[lang] > max) max = child.data[lang];
                if (child.children) {
                    child.children.forEach(sub => {
                        if (sub.data[lang] > max) max = sub.data[lang];
                    });
                }
            });
        }
        return max;
    }

    function renderSummary() {
        const total = getTotal(currentLang);
        taxonomySummary.innerHTML = taxonomyData.map(cat => {
            const value = cat.data[currentLang];
            const percent = ((value / total) * 100).toFixed(1);
            return `
                <div class="summary-row">
                    <span class="summary-color" style="background: ${cat.color}"></span>
                    <span class="summary-name">${cat.name}</span>
                    <span class="summary-value" style="color: ${cat.color}">${value.toLocaleString()}</span>
                    <span class="summary-percent">${percent}%</span>
                </div>
            `;
        }).join('');
    }

    function renderTree() {
        const total = getTotal(currentLang);

        taxonomyTree.innerHTML = taxonomyData.map(category => {
            const catValue = category.data[currentLang];
            const catPercent = ((catValue / total) * 100).toFixed(1);
            const catMax = getCategoryMax(category, currentLang);

            let childrenHtml = '';
            if (category.children) {
                childrenHtml = `<div class="taxonomy-children">
                    ${category.children.map(child => {
                        const childValue = child.data[currentLang];
                        const barWidth = catMax > 0 ? (childValue / catMax) * 100 : 0;

                        let subchildrenHtml = '';
                        if (child.children) {
                            subchildrenHtml = `<div class="taxonomy-subchildren">
                                ${child.children.map(sub => {
                                    const subValue = sub.data[currentLang];
                                    return `
                                        <div class="taxonomy-subitem">
                                            <span class="taxonomy-item-code">${sub.code}</span>
                                            <span class="taxonomy-item-name">${sub.name}</span>
                                            <span class="taxonomy-item-value" style="color: ${category.color}80">${subValue.toLocaleString()}</span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>`;
                        }

                        return `
                            <div class="taxonomy-item">
                                <span class="taxonomy-item-code">${child.code}</span>
                                <span class="taxonomy-item-name">${child.name}</span>
                                <span class="taxonomy-item-value" style="color: ${category.color}">${childValue.toLocaleString()}</span>
                                <div class="taxonomy-item-bar">
                                    <div class="taxonomy-item-bar-fill" style="width: ${barWidth}%; background: ${category.color}"></div>
                                </div>
                            </div>
                            ${subchildrenHtml}
                        `;
                    }).join('')}
                </div>`;
            }

            return `
                <div class="taxonomy-category">
                    <div class="taxonomy-category-header" style="border-color: ${category.color}">
                        <span class="taxonomy-category-name">${category.code} ${category.name}</span>
                        <span class="taxonomy-category-value" style="color: ${category.color}">${catValue.toLocaleString()}</span>
                        <span class="taxonomy-category-percent">${catPercent}%</span>
                    </div>
                    ${childrenHtml}
                </div>
            `;
        }).join('');
    }

    function updateTotal() {
        const total = getTotal(currentLang);
        const totalEl = document.getElementById('taxonomy-total');
        if (totalEl) totalEl.textContent = total.toLocaleString();
    }

    function updateAll() {
        renderTree();
        renderSummary();
        updateTotal();
    }

    // Language hover/click handlers
    document.querySelectorAll('.taxonomy-lang-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            document.querySelectorAll('.taxonomy-lang-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            currentLang = item.dataset.lang;
            updateAll();
        });
    });

    // Initialize
    updateAll();
}
