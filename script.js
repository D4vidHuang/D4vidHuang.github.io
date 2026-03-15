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
// Diffusion Code Animation - Interactive
// =========================================
const diffusionCanvas = document.getElementById('diffusion-canvas');
if (diffusionCanvas) {
    const dCtx = diffusionCanvas.getContext('2d');

    // Code tokens representing a refactoring transformation
    const codeLines = [
        { noisy: "def  calc_sum(a, b):", clean: "def  calculate_sum(x, y):" },
        { noisy: "    rslt = a + b", clean: "    result = x + y" },
        { noisy: "    return rslt", clean: "    return result" },
    ];

    let tokens = [];
    let mouseX = -1000;
    let mouseY = -1000;
    const denoiseRadius = 150;

    class CodeToken {
        constructor(char, x, y, isNoisy, cleanChar) {
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
        }

        update(mouseX, mouseY) {
            const dx = this.baseX - mouseX;
            const dy = this.baseY - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Denoise when mouse is near
            if (dist < denoiseRadius) {
                this.targetNoise = dist / denoiseRadius;
            } else {
                this.targetNoise = 1;
            }

            // Smooth transition
            this.noiseLevel += (this.targetNoise - this.noiseLevel) * 0.1;

            // Add jitter based on noise level
            if (this.isNoisy && this.noiseLevel > 0.1) {
                this.offsetX = (Math.random() - 0.5) * this.noiseLevel * 3;
                this.offsetY = (Math.random() - 0.5) * this.noiseLevel * 2;
            } else {
                this.offsetX *= 0.9;
                this.offsetY *= 0.9;
            }
        }

        draw(ctx) {
            const displayChar = this.noiseLevel < 0.5 ? this.cleanChar : this.noisyChar;
            const x = this.baseX + this.offsetX;
            const y = this.baseY + this.offsetY;

            // Color based on noise level
            let color;
            if (this.noiseLevel < 0.3) {
                color = `rgba(94, 234, 212, ${1 - this.noiseLevel})`; // Teal - clean
            } else if (this.noiseLevel < 0.7) {
                color = `rgba(192, 132, 252, ${0.8})`; // Purple - transitioning
            } else {
                color = `rgba(136, 136, 136, ${0.6 + this.noiseLevel * 0.3})`; // Gray - noisy
            }

            ctx.fillStyle = color;
            ctx.fillText(displayChar, x, y);

            // Add blur effect for noisy tokens
            if (this.noiseLevel > 0.5 && this.isNoisy) {
                ctx.fillStyle = `rgba(136, 136, 136, ${this.noiseLevel * 0.2})`;
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
        const fontSize = 16;
        const lineHeight = 36;
        const startX = 40;
        const startY = 80;

        dCtx.font = `${fontSize}px 'Courier New', monospace`;

        codeLines.forEach((line, lineIdx) => {
            const y = startY + lineIdx * lineHeight;
            let x = startX;

            for (let i = 0; i < Math.max(line.noisy.length, line.clean.length); i++) {
                const noisyChar = line.noisy[i] || ' ';
                const cleanChar = line.clean[i] || ' ';
                const isNoisy = noisyChar !== cleanChar;

                tokens.push(new CodeToken(noisyChar, x, y, isNoisy, cleanChar));
                x += dCtx.measureText(noisyChar).width;
            }
        });
    }

    function animateDiffusion() {
        const rect = diffusionCanvas.getBoundingClientRect();
        dCtx.clearRect(0, 0, rect.width, rect.height);

        // Draw subtle grid background
        dCtx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        dCtx.lineWidth = 1;
        for (let x = 0; x < rect.width; x += 30) {
            dCtx.beginPath();
            dCtx.moveTo(x, 0);
            dCtx.lineTo(x, rect.height);
            dCtx.stroke();
        }
        for (let y = 0; y < rect.height; y += 30) {
            dCtx.beginPath();
            dCtx.moveTo(0, y);
            dCtx.lineTo(rect.width, y);
            dCtx.stroke();
        }

        // Draw denoise radius indicator
        if (mouseX > 0 && mouseY > 0) {
            const gradient = dCtx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, denoiseRadius);
            gradient.addColorStop(0, 'rgba(94, 234, 212, 0.1)');
            gradient.addColorStop(0.5, 'rgba(94, 234, 212, 0.05)');
            gradient.addColorStop(1, 'rgba(94, 234, 212, 0)');
            dCtx.fillStyle = gradient;
            dCtx.beginPath();
            dCtx.arc(mouseX, mouseY, denoiseRadius, 0, Math.PI * 2);
            dCtx.fill();
        }

        // Draw labels
        dCtx.font = '11px "Space Grotesk", sans-serif';
        dCtx.fillStyle = 'rgba(136, 136, 136, 0.6)';
        dCtx.fillText('// noisy code', 40, 45);
        dCtx.fillStyle = 'rgba(94, 234, 212, 0.6)';
        dCtx.fillText('→ denoised', 130, 45);

        // Update and draw tokens
        dCtx.font = '16px "Courier New", monospace';
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
    });

    diffusionCanvas.addEventListener('mouseleave', () => {
        mouseX = -1000;
        mouseY = -1000;
    });

    // Initialize
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
        label: `Diffusion Step = ${t_val}`,
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
