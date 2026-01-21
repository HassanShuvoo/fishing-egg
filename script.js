const birdElement = document.getElementById('bird');
const gameContainer = document.getElementById('game-container');
const scoreElement = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const finalScoreElement = document.getElementById('final-score');

// Game constants
const GRAVITY = 0.5;
const JUMP_STRENGTH = -8;
const PIPE_SPEED = 3;
const PIPE_SPAWN_RATE = 1500; // ms
const PIPE_GAP = 180; // Vertical space between pipes

// Game state
let birdY = 300;
let birdVelocity = 0;
let isGameRunning = false;
let score = 0;
let pipes = []; // Array to store pipe elements and data
let lastPipeTime = 0;
let gameLoopId;

// Bird Visuals
const BIRD_EMOJI = '🐦';

// Pipe Visuals
const PIPE_EMOJI = '🟪'; // Purple Square

// Initialize
function init() {
    // birdElement.innerText = BIRD_EMOJI; // Removed, using IMG tag

    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', resetGame);

    // Input handling
    window.addEventListener('keydown', handleInput);
    gameContainer.addEventListener('mousedown', handleInput);
    gameContainer.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent scrolling
        handleInput(e);
    }, { passive: false });
}

function handleInput(e) {
    if ((e.code === 'Space' || e.type === 'mousedown' || e.type === 'touchstart') && isGameRunning) {
        jump();
    }
}

function jump() {
    birdVelocity = JUMP_STRENGTH;
}

function startGame() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    isGameRunning = true;

    // Reset state
    birdY = gameContainer.clientHeight / 2;
    birdVelocity = 0;
    score = 0;
    scoreElement.innerText = score;
    pipes = [];

    // Clear existing pipes from DOM
    document.querySelectorAll('.pipe').forEach(p => p.remove());

    lastPipeTime = performance.now();
    gameLoopId = requestAnimationFrame(gameLoop);
}

function resetGame() {
    startGame();
}

function gameLoop(timestamp) {
    if (!isGameRunning) return;

    updateBird();
    updatePipes(timestamp);
    checkCollisions();

    if (isGameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

function updateBird() {
    birdVelocity += GRAVITY;
    birdY += birdVelocity;

    // Rotation based on velocity
    let rotation = Math.min(Math.max(birdVelocity * 3, -25), 90);
    birdElement.style.transform = `translateY(0px) rotate(${rotation}deg)`; // Reset translateY handled by top
    birdElement.style.top = `${birdY}px`;

    // Floor/Ceiling collision
    if (birdY + birdElement.clientHeight > gameContainer.clientHeight || birdY < 0) {
        gameOver();
    }
}

function createPipe() {
    const pipeX = gameContainer.clientWidth;
    const minPipeHeight = 50;
    const maxPipeHeight = gameContainer.clientHeight - PIPE_GAP - minPipeHeight;
    const topHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight)) + minPipeHeight;

    // Top Pipe
    const topPipe = document.createElement('div');
    topPipe.className = 'pipe';
    topPipe.style.left = `${pipeX}px`;
    topPipe.style.top = '0';
    topPipe.style.height = `${topHeight}px`;
    topPipe.style.width = '50px'; // fixed width
    // Fill with emojis
    fillPipeWithEmojis(topPipe, topHeight);

    // Bottom Pipe
    const bottomPipe = document.createElement('div');
    bottomPipe.className = 'pipe';
    bottomPipe.style.left = `${pipeX}px`;
    bottomPipe.style.top = `${topHeight + PIPE_GAP}px`;
    bottomPipe.style.height = `${gameContainer.clientHeight - (topHeight + PIPE_GAP)}px`;
    bottomPipe.style.width = '50px';
    // Fill with emojis
    fillPipeWithEmojis(bottomPipe, gameContainer.clientHeight - (topHeight + PIPE_GAP));

    gameContainer.appendChild(topPipe);
    gameContainer.appendChild(bottomPipe);

    pipes.push({
        topElement: topPipe,
        bottomElement: bottomPipe,
        x: pipeX,
        passed: false
    });
}

function fillPipeWithEmojis(element, height) {
    // Emojis are roughly 40px tall (matches css)
    const count = Math.ceil(height / 40);
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `<div class="pipe-segment">${PIPE_EMOJI}</div>`;
    }
    // We want to overflow hidden or just let them clip
    element.innerHTML = html;
    element.style.overflow = 'hidden'; // Clip the emojis
}

function updatePipes(timestamp) {
    // Spawn new pipe
    if (timestamp - lastPipeTime > PIPE_SPAWN_RATE) {
        createPipe();
        lastPipeTime = timestamp;
    }

    // Move pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        let pipe = pipes[i];
        pipe.x -= PIPE_SPEED;
        pipe.topElement.style.left = `${pipe.x}px`;
        pipe.bottomElement.style.left = `${pipe.x}px`;

        // Score update
        if (!pipe.passed && pipe.x + 50 < 50) { // 50 is bird x roughly
            score++;
            scoreElement.innerText = score;
            pipe.passed = true;
        }

        // Remove off-screen pipes
        if (pipe.x < -60) {
            pipe.topElement.remove();
            pipe.bottomElement.remove();
            pipes.splice(i, 1);
        }
    }
}

function checkCollisions() {
    const birdRect = birdElement.getBoundingClientRect();

    pipes.forEach(pipe => {
        const topRect = pipe.topElement.getBoundingClientRect();
        const bottomRect = pipe.bottomElement.getBoundingClientRect();

        // Shrink the hit box slightly for better feel
        const hitBoxPadding = 5;

        // Check Top Pipe
        if (
            birdRect.right - hitBoxPadding > topRect.left &&
            birdRect.left + hitBoxPadding < topRect.right &&
            birdRect.top + hitBoxPadding < topRect.bottom
        ) {
            gameOver();
        }

        // Check Bottom Pipe
        if (
            birdRect.right - hitBoxPadding > bottomRect.left &&
            birdRect.left + hitBoxPadding < bottomRect.right &&
            birdRect.bottom - hitBoxPadding > bottomRect.top
        ) {
            gameOver();
        }
    });
}

function gameOver() {
    isGameRunning = false;
    cancelAnimationFrame(gameLoopId);
    finalScoreElement.innerText = score;
    gameOverScreen.classList.remove('hidden');
}

init();
