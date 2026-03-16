gsap.registerPlugin(ScrollTrigger);

// =========================================
// Thumbnail Canvas Animation - Research Specific
// =========================================
function initThumbnailCanvas(canvasId, type) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    let animationId;
    let time = 0;

    if (type === 'corefusion') {
        // CoReFusion: Code denoising visualization
        const codeLines = [
            { text: 'def attention(q, k, v):', color: '#c084fc' },
            { text: '    scores = matmul(q, k)', color: '#5eead4' },
            { text: '    weights = softmax(scores)', color: '#5eead4' },
            { text: '    return matmul(weights, v)', color: '#5eead4' },
        ];
        const noiseChars = '█▓▒░';
        let noiseLevel = 0.8;
        let direction = -0.001; // Slowed down from -0.005

        function animate() {
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, rect.width, rect.height);

            // Oscillate noise level (slower)
            noiseLevel += direction;
            if (noiseLevel <= 0.1) direction = 0.0008; // Slowed down
            if (noiseLevel >= 0.9) direction = -0.001; // Slowed down

            ctx.font = '11px "Courier New", monospace';
            const lineHeight = 22;
            const startY = 25;
            const startX = 15;

            codeLines.forEach((line, idx) => {
                const y = startY + idx * lineHeight;
                let x = startX;

                for (let i = 0; i < line.text.length; i++) {
                    const char = line.text[i];
                    // Use deterministic noise based on position, not random each frame
                    const noiseThreshold = (Math.sin(i * 0.5 + idx * 2 + time * 0.02) + 1) / 2;
                    const shouldNoise = noiseThreshold < noiseLevel && char !== ' ';

                    if (shouldNoise) {
                        ctx.fillStyle = `rgba(136, 136, 136, ${0.3 + noiseThreshold * 0.4})`;
                        const noiseIdx = Math.floor((i + idx + Math.floor(time * 0.05)) % noiseChars.length);
                        ctx.fillText(noiseChars[noiseIdx], x, y);
                    } else {
                        ctx.fillStyle = line.color;
                        ctx.fillText(char, x, y);
                    }
                    x += ctx.measureText(char).width;
                }
            });

            // Draw step indicator
            ctx.fillStyle = '#5eead4';
            ctx.font = '10px "Space Grotesk", sans-serif';
            ctx.fillText(`t = ${Math.floor((1 - noiseLevel) * 64)}`, rect.width - 45, 18);

            time++;
            animationId = requestAnimationFrame(animate);
        }
        animate();

    } else if (type === 'dfusion') {
        // Dfusion: Day/Night image restoration
        const pixelSize = 8;
        const cols = Math.floor(rect.width / pixelSize);
        const rows = Math.floor(rect.height / pixelSize);
        let pixels = [];

        // Create pixel grid with day/night split
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const isNight = col >= cols / 2;
                const isRaindrop = Math.random() < 0.15;
                pixels.push({
                    x: col * pixelSize,
                    y: row * pixelSize,
                    isNight,
                    isRaindrop,
                    baseColor: isNight
                        ? `hsl(220, 30%, ${10 + row / rows * 20}%)`
                        : `hsl(200, 60%, ${40 + row / rows * 30}%)`,
                    dropColor: isNight ? '#334' : '#89a',
                    phase: Math.random() * Math.PI * 2
                });
            }
        }

        function animate() {
            time += 0.03;
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, rect.width, rect.height);

            pixels.forEach(p => {
                const wave = Math.sin(time + p.phase) * 0.5 + 0.5;
                if (p.isRaindrop && wave > 0.6) {
                    ctx.fillStyle = p.dropColor;
                } else {
                    ctx.fillStyle = p.baseColor;
                }
                ctx.fillRect(p.x, p.y, pixelSize - 1, pixelSize - 1);
            });

            // Draw divider and labels
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.moveTo(rect.width / 2, 0);
            ctx.lineTo(rect.width / 2, rect.height);
            ctx.stroke();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '9px "Space Grotesk", sans-serif';
            ctx.fillText('DAY', 8, 14);
            ctx.fillText('NIGHT', rect.width / 2 + 8, 14);

            animationId = requestAnimationFrame(animate);
        }
        animate();

    } else if (type === 'taxonomy') {
        // Taxonomy: Error category bar chart
        const categories = [
            { name: 'MS', value: 5007, color: '#ef4444' },
            { name: 'LG', value: 1728, color: '#f59e0b' },
            { name: 'SE', value: 8333, color: '#8b5cf6' },
            { name: 'ST', value: 84, color: '#06b6d4' }
        ];
        const maxVal = Math.max(...categories.map(c => c.value));
        const barWidth = (rect.width - 60) / categories.length - 10;
        const maxBarHeight = rect.height - 50;

        function animate() {
            time += 0.02;
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, rect.width, rect.height);

            categories.forEach((cat, idx) => {
                const x = 30 + idx * (barWidth + 10);
                const targetHeight = (cat.value / maxVal) * maxBarHeight;
                const wave = Math.sin(time + idx * 0.5) * 5;
                const height = targetHeight + wave;
                const y = rect.height - 25 - height;

                // Bar with gradient
                const gradient = ctx.createLinearGradient(x, y, x, rect.height - 25);
                gradient.addColorStop(0, cat.color);
                gradient.addColorStop(1, cat.color + '40');
                ctx.fillStyle = gradient;
                ctx.fillRect(x, y, barWidth, height);

                // Label
                ctx.fillStyle = '#888';
                ctx.font = '9px "Space Grotesk", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(cat.name, x + barWidth / 2, rect.height - 10);

                // Value on top
                ctx.fillStyle = cat.color;
                ctx.font = '8px "Courier New", monospace';
                ctx.fillText(cat.value.toLocaleString(), x + barWidth / 2, y - 5);
            });

            ctx.textAlign = 'left';
            animationId = requestAnimationFrame(animate);
        }
        animate();

    } else if (type === 'babel') {
        // Babel: Multilingual code comments cycling through languages
        const comments = [
            { lang: 'ZH', text: '// 计算两数之和', flag: '🇨🇳' },
            { lang: 'NL', text: '// Bereken de som', flag: '🇳🇱' },
            { lang: 'PL', text: '// Oblicz sumę', flag: '🇵🇱' },
            { lang: 'EL', text: '// Υπολογίστε το άθροισμα', flag: '🇬🇷' },
            { lang: 'EN', text: '// Calculate the sum', flag: '🇬🇧' },
        ];
        let currentLangIdx = 0;
        let phase = 0;
        let lastSwitch = 0;

        function animate() {
            time += 0.02;
            phase = (phase + 0.012) % 1;

            // Switch language every ~3 seconds
            if (time - lastSwitch > 3) {
                lastSwitch = time;
                currentLangIdx = (currentLangIdx + 1) % comments.length;
                phase = 0;
            }

            const currentComment = comments[currentLangIdx];

            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, rect.width, rect.height);

            // Draw code background
            ctx.fillStyle = 'rgba(30, 30, 40, 0.8)';
            ctx.fillRect(10, 15, rect.width - 20, 35);

            // Draw Java code line
            ctx.font = '10px "Courier New", monospace';
            ctx.fillStyle = '#c084fc';
            ctx.fillText('public', 15, 30);
            ctx.fillStyle = '#5eead4';
            ctx.fillText(' int add(a, b)', 50, 30);

            // Draw comment being generated with noise effect
            ctx.fillStyle = 'rgba(30, 30, 40, 0.8)';
            ctx.fillRect(10, 55, rect.width - 20, 30);

            // Language indicator
            ctx.fillStyle = '#888';
            ctx.font = '9px "Space Grotesk", sans-serif';
            ctx.fillText(currentComment.lang, rect.width - 30, 68);

            ctx.font = '10px "Courier New", monospace';
            let x = 15;
            const commentChars = currentComment.text.split('');
            commentChars.forEach((char, i) => {
                const revealThreshold = phase * commentChars.length * 1.5;
                if (i < revealThreshold) {
                    ctx.fillStyle = '#888';
                    ctx.fillText(char, x, 72);
                } else {
                    ctx.fillStyle = 'rgba(136, 136, 136, 0.3)';
                    ctx.fillText('█', x, 72);
                }
                x += ctx.measureText(char).width;
            });

            // Draw error indicator bars at bottom
            const barY = rect.height - 12;
            const barWidth = (rect.width - 30) / 3;
            const errorTypes = ['SE', 'MS', 'LG'];
            errorTypes.forEach((type, i) => {
                const barX = 15 + i * (barWidth + 5);
                const colors = { 'SE': '#8b5cf6', 'MS': '#ef4444', 'LG': '#f59e0b' };
                const heights = { 'SE': 0.6, 'MS': 0.35, 'LG': 0.05 };
                const wave = Math.sin(time + i) * 0.05;

                ctx.fillStyle = colors[type] + '40';
                ctx.fillRect(barX, barY - 8, barWidth - 5, 8);
                ctx.fillStyle = colors[type];
                ctx.fillRect(barX, barY - 8, (barWidth - 5) * (heights[type] + wave), 8);
            });

            animationId = requestAnimationFrame(animate);
        }
        animate();

    } else if (type === 'coverage') {
        // Coverage: Treemap-style grammar rule visualization
        const rules = [
            { name: 'identifier', freq: 0.42, color: '#22c55e' },
            { name: 'expression', freq: 0.28, color: '#22c55e' },
            { name: 'string', freq: 0.15, color: '#f59e0b' },
            { name: 'call_expr', freq: 0.08, color: '#f59e0b' },
            { name: 'for_stmt', freq: 0.04, color: '#ef4444' },
            { name: 'lambda', freq: 0.02, color: '#ef4444' },
            { name: 'context_mgr', freq: 0.01, color: '#ef4444' },
        ];

        function animate() {
            time += 0.02;
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, rect.width, rect.height);

            // Draw treemap-style blocks
            let x = 8;
            let y = 8;
            const maxWidth = rect.width - 16;
            const maxHeight = rect.height - 30;
            let rowHeight = 0;

            rules.forEach((rule, idx) => {
                const wave = Math.sin(time + idx * 0.5) * 2;
                const blockWidth = Math.max(20, rule.freq * maxWidth * 1.5 + wave);
                const blockHeight = Math.max(15, rule.freq * maxHeight * 0.8);

                if (x + blockWidth > maxWidth + 8) {
                    x = 8;
                    y += rowHeight + 4;
                    rowHeight = 0;
                }

                rowHeight = Math.max(rowHeight, blockHeight);

                // Block with gradient
                const gradient = ctx.createLinearGradient(x, y, x + blockWidth, y + blockHeight);
                gradient.addColorStop(0, rule.color + '60');
                gradient.addColorStop(1, rule.color + '20');
                ctx.fillStyle = gradient;
                ctx.fillRect(x, y, blockWidth - 2, blockHeight - 2);

                // Border
                ctx.strokeStyle = rule.color + '80';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, blockWidth - 2, blockHeight - 2);

                // Label for larger blocks
                if (blockWidth > 35 && blockHeight > 18) {
                    ctx.fillStyle = '#fff';
                    ctx.font = '7px "Courier New", monospace';
                    ctx.fillText(rule.name.substring(0, 6), x + 3, y + 11);
                }

                x += blockWidth;
            });

            // Bottom label
            ctx.fillStyle = '#666';
            ctx.font = '8px "Space Grotesk", sans-serif';
            ctx.fillText('Grammar Coverage Distribution', 8, rect.height - 6);

            animationId = requestAnimationFrame(animate);
        }
        animate();
    }

    return () => cancelAnimationFrame(animationId);
}

// Initialize all thumbnail canvases
document.addEventListener('DOMContentLoaded', () => {
    initThumbnailCanvas('thumb-corefusion', 'corefusion');
    initThumbnailCanvas('thumb-dfusion', 'dfusion');
    initThumbnailCanvas('thumb-taxonomy', 'taxonomy');
    initThumbnailCanvas('thumb-babel', 'babel');
    initThumbnailCanvas('thumb-coverage', 'coverage');
});

// =========================================
// Modal Interaction
// =========================================
const modal = document.getElementById('animation-modal');
const modalClose = document.getElementById('modal-close');
const thumbnails = document.querySelectorAll('.animation-thumbnail');
let currentAnimation = null;

function openModal(animationType) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Hide all animations
    document.querySelectorAll('.modal-animation').forEach(el => {
        el.style.display = 'none';
    });

    // Show selected animation
    const targetModal = document.getElementById(`modal-${animationType}`);
    if (targetModal) {
        targetModal.style.display = 'flex';
    }

    currentAnimation = animationType;

    // Initialize the animation
    if (animationType === 'corefusion') {
        initDLLMAnimation();
    } else if (animationType === 'dfusion') {
        initDfusionAnimation();
    } else if (animationType === 'taxonomy') {
        initTaxonomyVisualization();
    } else if (animationType === 'babel') {
        initBabelVisualization();
    } else if (animationType === 'coverage') {
        initCoverageVisualization();
    }
}

function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    currentAnimation = null;
}

thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
        const animationType = thumb.dataset.animation;
        openModal(animationType);
    });
});

if (modalClose) {
    modalClose.addEventListener('click', closeModal);
}

if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// ESC key to close
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
        closeModal();
    }
});

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

// --- 3. Rendering for Modal ---
// Wrap DLLM init in a function for modal
let dllmInitialized = false;
function initDLLMAnimation() {
    if (dllmInitialized) return;
    dllmInitialized = true;

    const codeContent = document.getElementById('code-content');
    const stepLabel = document.getElementById('step-label');
    const progressFill = document.getElementById('progress-fill');

    if (!codeContent) return;

    // Render initial structure (Step 0)
    codeContent.innerHTML = '';
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

    renderStepModal(0);

    // Use mouse wheel within modal for animation control
    const modalCorefusion = document.getElementById('modal-corefusion');
    let currentStep = 0;

    if (modalCorefusion) {
        modalCorefusion.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 2 : -2;
            currentStep = Math.max(0, Math.min(TOTAL_STEPS, currentStep + delta));
            renderStepModal(currentStep);
        });
    }

    function renderStepModal(stepIndex) {
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
}

/* =========================================
   Dfusion CVPR Workshop Visualization
   ========================================= */
let dfusionInitialized = false;
function initDfusionAnimation() {
    if (dfusionInitialized) return;

    const dfusionCanvas = document.getElementById('dfusion-canvas');
    if (!dfusionCanvas) return;

    dfusionInitialized = true;
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
let taxonomyInitialized = false;
function initTaxonomyVisualization() {
    if (taxonomyInitialized) return;

    const taxonomyTree = document.getElementById('taxonomy-tree');
    const taxonomySummary = document.getElementById('taxonomy-summary');
    if (!taxonomyTree) return;

    taxonomyInitialized = true;
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

/* =========================================
   Babel Visualization (LLM of Babel)
   Chinese Code Comment Error Analysis
   ========================================= */
let babelInitialized = false;
function initBabelVisualization() {
    if (babelInitialized) return;

    const babelCanvas = document.getElementById('babel-canvas');
    if (!babelCanvas) return;

    babelInitialized = true;
    const ctx = babelCanvas.getContext('2d');
    let rect = babelCanvas.getBoundingClientRect();
    babelCanvas.width = rect.width * window.devicePixelRatio;
    babelCanvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Error taxonomy data from the thesis (Chinese results)
    const errorData = [
        { code: 'SE', name: 'Semantic', count: 197, color: '#8b5cf6',
          children: [
            { code: 'SE-HA', name: 'Hallucination', count: 113 },
            { code: 'SE-CS', name: 'Code Snippet', count: 63 },
            { code: 'SE-TG', name: 'Too General', count: 21 }
          ]
        },
        { code: 'MS', name: 'Model-specific', count: 134, color: '#ef4444',
          children: [
            { code: 'MS-NG', name: 'No Generation', count: 31 },
            { code: 'MS-ME', name: 'Memorization', count: 27 },
            { code: 'MS-CC', name: 'Copy Context', count: 23 }
          ]
        },
        { code: 'ST', name: 'Syntax', count: 27, color: '#06b6d4',
          children: [
            { code: 'ST-IF', name: 'Incorrect Format', count: 27 }
          ]
        },
        { code: 'LG', name: 'Linguistic', count: 0, color: '#f59e0b',
          children: []
        }
    ];

    // Cosine similarity data for visualization
    const cosineSimilarityData = {
        normal: { median: 0.95, iqr: [0.93, 0.97] },
        hallucinated: { median: 0.92, iqr: [0.88, 0.95] }
    };

    let mouseX = -1000;
    let mouseY = -1000;
    let hoveredBar = null;
    let time = 0;

    function animate() {
        time += 0.015;
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, rect.width, rect.height);

        const leftWidth = rect.width * 0.55;
        const rightWidth = rect.width * 0.4;
        const rightX = rect.width * 0.58;

        // Vertical offset to center content
        const offsetY = (rect.height - 220) / 2;

        // === LEFT SIDE: Error Taxonomy Bar Chart ===
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px "Space Grotesk", sans-serif';
        ctx.fillText('Error Distribution (Chinese)', 15, offsetY + 15);

        const maxCount = Math.max(...errorData.map(e => e.count));
        const barHeight = 28;
        const barGap = 12;
        const startY = offsetY + 35;
        const maxBarWidth = leftWidth - 80;

        hoveredBar = null;
        errorData.forEach((error, idx) => {
            const y = startY + idx * (barHeight + barGap);
            const barWidth = maxCount > 0 ? (error.count / maxCount) * maxBarWidth : 0;
            const wave = Math.sin(time + idx * 0.5) * 3;

            // Check hover
            if (mouseX >= 15 && mouseX <= 15 + barWidth + wave &&
                mouseY >= y && mouseY <= y + barHeight) {
                hoveredBar = error;
            }

            // Bar background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(60, y, maxBarWidth, barHeight);

            // Bar fill with animation
            const gradient = ctx.createLinearGradient(60, y, 60 + barWidth + wave, y);
            gradient.addColorStop(0, error.color);
            gradient.addColorStop(1, error.color + '80');
            ctx.fillStyle = gradient;
            ctx.fillRect(60, y, Math.max(0, barWidth + wave), barHeight);

            // Label
            ctx.fillStyle = error.color;
            ctx.font = 'bold 10px "Courier New", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(error.code, 15, y + 18);

            // Count
            ctx.fillStyle = '#888';
            ctx.font = '10px "Space Grotesk", sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(error.count.toString(), leftWidth - 10, y + 18);
        });

        // Hover tooltip for error details
        if (hoveredBar && hoveredBar.children.length > 0) {
            const tooltipX = mouseX + 15;
            const tooltipY = mouseY - 10;
            const tooltipWidth = 150;
            const tooltipHeight = 20 + hoveredBar.children.length * 18;

            ctx.fillStyle = 'rgba(20, 20, 20, 0.95)';
            ctx.strokeStyle = hoveredBar.color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px "Space Grotesk", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(hoveredBar.name + ' Errors', tooltipX + 8, tooltipY + 14);

            hoveredBar.children.forEach((child, i) => {
                ctx.fillStyle = '#888';
                ctx.font = '9px "Courier New", monospace';
                ctx.fillText(`${child.code}: ${child.count}`, tooltipX + 8, tooltipY + 30 + i * 16);
            });
        }

        // === RIGHT SIDE: Cosine Similarity Box Plot ===
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px "Space Grotesk", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Cosine Similarity', rightX, offsetY + 15);

        const boxY = offsetY + 45;
        const boxHeight = 35;
        const boxGap = 50;
        const scaleMin = 0.85;
        const scaleMax = 1.0;
        const scaleWidth = rightWidth - 20;

        // Draw scale
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rightX, boxY + boxHeight * 2 + boxGap + 15);
        ctx.lineTo(rightX + scaleWidth, boxY + boxHeight * 2 + boxGap + 15);
        ctx.stroke();

        // Scale labels
        ctx.fillStyle = '#666';
        ctx.font = '8px "Courier New", monospace';
        ctx.textAlign = 'center';
        for (let i = 0; i <= 3; i++) {
            const val = scaleMin + (scaleMax - scaleMin) * (i / 3);
            const x = rightX + (i / 3) * scaleWidth;
            ctx.fillText(val.toFixed(2), x, boxY + boxHeight * 2 + boxGap + 28);
        }

        // Draw box plots
        const groups = [
            { label: 'Normal', data: cosineSimilarityData.normal, color: '#22c55e', y: boxY },
            { label: 'Hallucinated', data: cosineSimilarityData.hallucinated, color: '#ef4444', y: boxY + boxHeight + boxGap }
        ];

        groups.forEach(group => {
            const medianX = rightX + ((group.data.median - scaleMin) / (scaleMax - scaleMin)) * scaleWidth;
            const q1X = rightX + ((group.data.iqr[0] - scaleMin) / (scaleMax - scaleMin)) * scaleWidth;
            const q3X = rightX + ((group.data.iqr[1] - scaleMin) / (scaleMax - scaleMin)) * scaleWidth;

            // Label
            ctx.fillStyle = '#888';
            ctx.font = '9px "Space Grotesk", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(group.label, rightX, group.y - 5);

            // Box
            ctx.fillStyle = group.color + '30';
            ctx.fillRect(q1X, group.y, q3X - q1X, boxHeight);
            ctx.strokeStyle = group.color;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(q1X, group.y, q3X - q1X, boxHeight);

            // Median line with pulse
            const pulse = Math.sin(time * 2) * 2;
            ctx.strokeStyle = group.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(medianX + pulse, group.y);
            ctx.lineTo(medianX + pulse, group.y + boxHeight);
            ctx.stroke();

            // Median value
            ctx.fillStyle = group.color;
            ctx.font = 'bold 10px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(group.data.median.toFixed(2), medianX, group.y + boxHeight + 12);
        });

        // Key insight text
        ctx.fillStyle = '#5eead4';
        ctx.font = '9px "Space Grotesk", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Lower similarity = Hallucination detected', rightX, offsetY + 210);

        ctx.textAlign = 'left';
        requestAnimationFrame(animate);
    }

    // Mouse tracking
    babelCanvas.addEventListener('mousemove', (e) => {
        const r = babelCanvas.getBoundingClientRect();
        mouseX = e.clientX - r.left;
        mouseY = e.clientY - r.top;
        babelCanvas.style.cursor = hoveredBar ? 'pointer' : 'default';
    });

    babelCanvas.addEventListener('mouseleave', () => {
        mouseX = -1000;
        mouseY = -1000;
        babelCanvas.style.cursor = 'default';
    });

    animate();
}

// =========================================
// Coverage Visualization (Honor Program)
// =========================================
let coverageInitialized = false;

function initCoverageVisualization() {
    if (coverageInitialized) return;

    const coverageCanvas = document.getElementById('coverage-canvas');
    if (!coverageCanvas) return;

    coverageInitialized = true;
    const ctx = coverageCanvas.getContext('2d');
    let rect = coverageCanvas.getBoundingClientRect();
    coverageCanvas.width = rect.width * window.devicePixelRatio;
    coverageCanvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Grammar rule data based on the paper (Python as default)
    const languageData = {
        python: {
            name: 'Python',
            rules: [
                { name: 'identifier', count: 41.7, color: '#22c55e' },
                { name: 'expression_statement', count: 25.3, color: '#22c55e' },
                { name: 'string_literal', count: 12.8, color: '#3b82f6' },
                { name: 'call_expression', count: 8.4, color: '#3b82f6' },
                { name: 'binary_expression', count: 5.2, color: '#f59e0b' },
                { name: 'for_statement', count: 2.8, color: '#f59e0b' },
                { name: 'if_statement', count: 1.9, color: '#ef4444' },
                { name: 'lambda_expression', count: 0.8, color: '#ef4444' },
                { name: 'context_manager', count: 0.4, color: '#ef4444' },
                { name: 'list_comprehension', count: 0.3, color: '#ef4444' },
                { name: 'generator_expression', count: 0.2, color: '#ef4444' },
                { name: 'decorator', count: 0.1, color: '#ef4444' },
            ],
            topRulePercent: 41.7,
            top10Percent: 97.9
        },
        java: {
            name: 'Java',
            rules: [
                { name: 'identifier', count: 38.2, color: '#22c55e' },
                { name: 'method_invocation', count: 22.1, color: '#22c55e' },
                { name: 'class_declaration', count: 15.4, color: '#3b82f6' },
                { name: 'field_access', count: 9.8, color: '#3b82f6' },
                { name: 'variable_declarator', count: 6.2, color: '#f59e0b' },
                { name: 'for_statement', count: 3.1, color: '#f59e0b' },
                { name: 'if_statement', count: 2.4, color: '#ef4444' },
                { name: 'lambda_expression', count: 1.2, color: '#ef4444' },
                { name: 'try_statement', count: 0.8, color: '#ef4444' },
                { name: 'enum_declaration', count: 0.4, color: '#ef4444' },
                { name: 'interface_declaration', count: 0.3, color: '#ef4444' },
                { name: 'annotation', count: 0.1, color: '#ef4444' },
            ],
            topRulePercent: 38.2,
            top10Percent: 96.5
        },
        javascript: {
            name: 'JavaScript',
            rules: [
                { name: 'identifier', count: 35.8, color: '#22c55e' },
                { name: 'call_expression', count: 24.6, color: '#22c55e' },
                { name: 'string', count: 14.2, color: '#3b82f6' },
                { name: 'member_expression', count: 10.1, color: '#3b82f6' },
                { name: 'arrow_function', count: 5.8, color: '#f59e0b' },
                { name: 'object', count: 4.2, color: '#f59e0b' },
                { name: 'array', count: 2.1, color: '#ef4444' },
                { name: 'template_string', count: 1.4, color: '#ef4444' },
                { name: 'class_declaration', count: 0.9, color: '#ef4444' },
                { name: 'async_function', count: 0.5, color: '#ef4444' },
                { name: 'generator_function', count: 0.2, color: '#ef4444' },
                { name: 'decorator', count: 0.1, color: '#ef4444' },
            ],
            topRulePercent: 35.8,
            top10Percent: 95.2
        },
        rust: {
            name: 'Rust',
            rules: [
                { name: 'identifier', count: 32.4, color: '#22c55e' },
                { name: 'macro_invocation', count: 21.8, color: '#22c55e' },
                { name: 'call_expression', count: 16.2, color: '#3b82f6' },
                { name: 'field_expression', count: 11.4, color: '#3b82f6' },
                { name: 'let_declaration', count: 7.8, color: '#f59e0b' },
                { name: 'match_expression', count: 4.2, color: '#f59e0b' },
                { name: 'impl_item', count: 2.8, color: '#ef4444' },
                { name: 'trait_item', count: 1.6, color: '#ef4444' },
                { name: 'lifetime', count: 0.9, color: '#ef4444' },
                { name: 'async_block', count: 0.5, color: '#ef4444' },
                { name: 'unsafe_block', count: 0.3, color: '#ef4444' },
                { name: 'extern_crate', count: 0.1, color: '#ef4444' },
            ],
            topRulePercent: 32.4,
            top10Percent: 94.8
        },
        go: {
            name: 'Go',
            rules: [
                { name: 'identifier', count: 40.2, color: '#22c55e' },
                { name: 'call_expression', count: 23.4, color: '#22c55e' },
                { name: 'selector_expression', count: 13.8, color: '#3b82f6' },
                { name: 'short_var_declaration', count: 8.6, color: '#3b82f6' },
                { name: 'if_statement', count: 5.4, color: '#f59e0b' },
                { name: 'for_statement', count: 3.8, color: '#f59e0b' },
                { name: 'func_literal', count: 2.1, color: '#ef4444' },
                { name: 'defer_statement', count: 1.2, color: '#ef4444' },
                { name: 'go_statement', count: 0.7, color: '#ef4444' },
                { name: 'select_statement', count: 0.4, color: '#ef4444' },
                { name: 'type_assertion', count: 0.2, color: '#ef4444' },
                { name: 'channel_type', count: 0.1, color: '#ef4444' },
            ],
            topRulePercent: 40.2,
            top10Percent: 97.1
        }
    };

    let currentLang = 'python';
    let mouseX = -1000;
    let mouseY = -1000;
    let hoveredRule = null;
    let time = 0;

    // Tokenization offset data (from paper Figure 6)
    const tokenOffsetData = [
        { lang: 'C#', offset: 4.8 },
        { lang: 'JS', offset: 4.2 },
        { lang: 'C', offset: 3.9 },
        { lang: 'C++', offset: 3.5 },
        { lang: 'Python', offset: 3.1 },
        { lang: 'Go', offset: 2.8 },
        { lang: 'Rust', offset: 2.4 },
        { lang: 'Java', offset: 2.1 },
        { lang: 'Scala', offset: 1.8 },
    ];

    function animate() {
        time += 0.015;
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, rect.width, rect.height);

        const data = languageData[currentLang];
        const offsetY = 15;

        // === LEFT SIDE: Treemap visualization ===
        const treemapWidth = rect.width * 0.55;
        const treemapHeight = rect.height - 100;
        const treemapX = 15;
        const treemapY = offsetY + 35;

        // Title with language selector buttons
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px "Space Grotesk", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Grammar Coverage:', treemapX, offsetY + 20);

        // Language selector buttons (prominent, next to title)
        const langs = Object.keys(languageData);
        let btnX = treemapX + 100;
        const btnY = offsetY + 8;
        const btnHeight = 18;
        const btnPadding = 8;

        langs.forEach((lang) => {
            const isActive = lang === currentLang;
            const label = languageData[lang].name;
            ctx.font = isActive ? 'bold 9px "Space Grotesk", sans-serif' : '9px "Space Grotesk", sans-serif';
            const textWidth = ctx.measureText(label).width;
            const btnWidth = textWidth + btnPadding * 2;

            // Store button bounds for click detection
            languageData[lang].btnBounds = { x: btnX, y: btnY, w: btnWidth, h: btnHeight };

            // Button background
            if (isActive) {
                ctx.fillStyle = '#5eead4';
                ctx.beginPath();
                ctx.roundRect(btnX, btnY, btnWidth, btnHeight, 4);
                ctx.fill();
                ctx.fillStyle = '#0a0a0a';
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.beginPath();
                ctx.roundRect(btnX, btnY, btnWidth, btnHeight, 4);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.fillStyle = '#888';
            }

            // Button text
            ctx.textAlign = 'center';
            ctx.fillText(label, btnX + btnWidth / 2, btnY + 13);
            ctx.textAlign = 'left';

            btnX += btnWidth + 6;
        });

        // Draw treemap blocks
        let x = treemapX;
        let y = treemapY;
        let rowHeight = 0;
        const totalCount = data.rules.reduce((sum, r) => sum + r.count, 0);

        hoveredRule = null;
        data.rules.forEach((rule, idx) => {
            const wave = Math.sin(time + idx * 0.3) * 2;
            const areaRatio = rule.count / totalCount;
            const blockWidth = Math.max(30, areaRatio * treemapWidth * 2.5 + wave);
            const blockHeight = Math.max(25, areaRatio * treemapHeight * 1.5);

            if (x + blockWidth > treemapX + treemapWidth) {
                x = treemapX;
                y += rowHeight + 4;
                rowHeight = 0;
            }

            rowHeight = Math.max(rowHeight, blockHeight);

            // Check hover
            if (mouseX >= x && mouseX <= x + blockWidth &&
                mouseY >= y && mouseY <= y + blockHeight) {
                hoveredRule = rule;
            }

            // Block fill
            const isHovered = hoveredRule === rule;
            const gradient = ctx.createLinearGradient(x, y, x + blockWidth, y + blockHeight);
            gradient.addColorStop(0, rule.color + (isHovered ? '90' : '50'));
            gradient.addColorStop(1, rule.color + (isHovered ? '60' : '20'));
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, blockWidth - 3, blockHeight - 3);

            // Border
            ctx.strokeStyle = rule.color + (isHovered ? 'ff' : '80');
            ctx.lineWidth = isHovered ? 2 : 1;
            ctx.strokeRect(x, y, blockWidth - 3, blockHeight - 3);

            // Label
            if (blockWidth > 45 && blockHeight > 22) {
                ctx.fillStyle = '#fff';
                ctx.font = '8px "Courier New", monospace';
                const label = rule.name.length > 10 ? rule.name.substring(0, 10) + '..' : rule.name;
                ctx.fillText(label, x + 4, y + 14);

                ctx.fillStyle = '#888';
                ctx.font = '7px "Space Grotesk", sans-serif';
                ctx.fillText(`${rule.count.toFixed(1)}%`, x + 4, y + 24);
            }

            x += blockWidth;
        });

        // Hover tooltip
        if (hoveredRule) {
            const tooltipX = Math.min(mouseX + 15, rect.width - 130);
            const tooltipY = mouseY - 40;

            ctx.fillStyle = 'rgba(20, 20, 20, 0.95)';
            ctx.strokeStyle = hoveredRule.color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(tooltipX, tooltipY, 120, 35, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 9px "Courier New", monospace';
            ctx.fillText(hoveredRule.name, tooltipX + 8, tooltipY + 14);

            ctx.fillStyle = hoveredRule.color;
            ctx.font = '9px "Space Grotesk", sans-serif';
            ctx.fillText(`${hoveredRule.count.toFixed(1)}% of corpus`, tooltipX + 8, tooltipY + 27);
        }

        // === RIGHT SIDE: Pareto insight + Tokenization offset ===
        const rightX = rect.width * 0.6;
        const rightWidth = rect.width * 0.38;

        // Pareto insight box
        ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
        ctx.strokeStyle = '#22c55e40';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(rightX, offsetY + 20, rightWidth, 55, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 10px "Space Grotesk", sans-serif';
        ctx.fillText('Pareto Distribution', rightX + 10, offsetY + 38);

        ctx.fillStyle = '#888';
        ctx.font = '9px "Space Grotesk", sans-serif';
        ctx.fillText(`Top 1 rule: ${data.topRulePercent}%`, rightX + 10, offsetY + 52);
        ctx.fillText(`Top 10 rules: ${data.top10Percent}%`, rightX + 10, offsetY + 66);

        // Tokenization offset chart
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px "Space Grotesk", sans-serif';
        ctx.fillText('Tokenization Offset', rightX, offsetY + 100);

        const barStartY = offsetY + 115;
        const barHeight = 12;
        const barGap = 4;
        const maxOffset = Math.max(...tokenOffsetData.map(d => d.offset));

        tokenOffsetData.forEach((item, idx) => {
            const barY = barStartY + idx * (barHeight + barGap);
            const barWidth = (item.offset / maxOffset) * (rightWidth - 35);
            const wave = Math.sin(time + idx * 0.4) * 3;

            // Bar background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(rightX + 30, barY, rightWidth - 35, barHeight);

            // Bar fill
            const barColor = item.offset > 3.5 ? '#ef4444' : item.offset > 2.5 ? '#f59e0b' : '#22c55e';
            ctx.fillStyle = barColor + '80';
            ctx.fillRect(rightX + 30, barY, Math.max(0, barWidth + wave), barHeight);

            // Label
            ctx.fillStyle = '#666';
            ctx.font = '7px "Courier New", monospace';
            ctx.textAlign = 'right';
            ctx.fillText(item.lang, rightX + 26, barY + 9);
        });

        ctx.textAlign = 'left';

        // Key insight
        ctx.fillStyle = '#5eead4';
        ctx.font = '8px "Space Grotesk", sans-serif';
        ctx.fillText('Higher offset = More tokenization mismatch', rightX, rect.height - 15);

        requestAnimationFrame(animate);
    }

    // Mouse tracking - update cursor for language buttons
    coverageCanvas.addEventListener('mousemove', (e) => {
        const r = coverageCanvas.getBoundingClientRect();
        mouseX = e.clientX - r.left;
        mouseY = e.clientY - r.top;

        // Check if hovering over language buttons
        let overButton = false;
        const langs = Object.keys(languageData);
        langs.forEach((lang) => {
            const btn = languageData[lang].btnBounds;
            if (btn && mouseX >= btn.x && mouseX <= btn.x + btn.w &&
                mouseY >= btn.y && mouseY <= btn.y + btn.h) {
                overButton = true;
            }
        });

        coverageCanvas.style.cursor = (hoveredRule || overButton) ? 'pointer' : 'default';
    });

    coverageCanvas.addEventListener('mouseleave', () => {
        mouseX = -1000;
        mouseY = -1000;
        coverageCanvas.style.cursor = 'default';
    });

    // Click to change language (using button bounds)
    coverageCanvas.addEventListener('click', (e) => {
        const r = coverageCanvas.getBoundingClientRect();
        const clickX = e.clientX - r.left;
        const clickY = e.clientY - r.top;

        // Check if click is on a language button
        const langs = Object.keys(languageData);
        langs.forEach((lang) => {
            const btn = languageData[lang].btnBounds;
            if (btn && clickX >= btn.x && clickX <= btn.x + btn.w &&
                clickY >= btn.y && clickY <= btn.y + btn.h) {
                currentLang = lang;
            }
        });
    });

    animate();
}
