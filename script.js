const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const eatSound = new Audio('eat.mp3');
const deadSound = new Audio('dead.mp3');

// إعدادات الشاشة
const box = 20;
const canvasSize = 320;
canvas.width = canvasSize;
canvas.height = canvasSize;

// متغيرات اللعبة
let snake = [];
let food = {};
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let direction = ''; 
let nextDirection = '';
let isGameRunning = false;
let obstacles = [];
let particles = [];
let currentFoodIcon = "🍎";
const foodIcons = ["🍎", "🍉", "🍇", "🍓", "🍒", "🍑", "🍍", "🍕", "🍔"];

// متغيرات المحرك الجديد (للسلاسة)
let lastRenderTime = 0;
let gameSpeed = 10; // عدد المرات بالثانية (كل ما زاد الرقم زادت السرعة)

// إعدادات المستخدم
let selectedSkin = localStorage.getItem('snakeSkin') || '#2ecc71';
let selectedMap = 1; 
let difficulty = 'easy'; 

// === إدارة القوائم ===
function showMainMenu() { switchScreen('mainMenu'); }
function showShop() { switchScreen('shopScreen'); renderShop(); }
function showMapSelection() { switchScreen('mapScreen'); }

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
}

// === المتجر ===
const skins = [
    { color: '#2ecc71', name: 'كلاسيك' },
    { color: '#3498db', name: 'أزرق' },
    { color: '#f1c40f', name: 'ذهبي' },
    { color: '#e74c3c', name: 'أحمر' },
    { color: '#9b59b6', name: 'بنفسجي' }
];

function renderShop() {
    const container = document.getElementById('skinsContainer');
    container.innerHTML = '';
    skins.forEach(skin => {
        const div = document.createElement('div');
        div.className = `skin-item ${selectedSkin === skin.color ? 'selected' : ''}`;
        div.style.backgroundColor = skin.color;
        div.onclick = () => {
            selectedSkin = skin.color;
            localStorage.setItem('snakeSkin', selectedSkin);
            renderShop(); 
        };
        container.appendChild(div);
    });
}

function selectMap(mapId, btn) {
    selectedMap = mapId;
    document.querySelectorAll('#mapScreen .options-grid:first-of-type .opt-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

function selectDiff(diff, btn) {
    difficulty = diff;
    document.querySelectorAll('#mapScreen .options-grid:last-of-type .opt-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

// === محرك اللعبة الجديد (The Engine) ⚙️ ===
function startGame() {
    switchScreen('gameScreen');
    initGame();
    // تشغيل حلقة اللعبة
    window.requestAnimationFrame(main);
}

function main(currentTime) {
    if (isGameRunning) {
        window.requestAnimationFrame(main);
    } else {
        return;
    }

    // حساب الوقت لضمان السلاسة (Delta Time)
    const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
    if (secondsSinceLastRender < 1 / gameSpeed) return;
    
    lastRenderTime = currentTime;
    update(); // التحديث
    draw();   // الرسم
}

function initGame() {
    snake = [{ x: 4 * box, y: 4 * box }];
    direction = '';
    nextDirection = '';
    score = 0;
    particles = [];
    obstacles = [];
    
    // ضبط السرعة حسب الصعوبة
    // Easy = 6 frames/sec (سلس وبطيء)
    // Hard = 10 frames/sec (سريع)
    gameSpeed = difficulty === 'hard' ? 10 : 6;
    
    buildMap();

    document.getElementById('score').textContent = score;
    document.getElementById('highScore').textContent = highScore;
    document.getElementById('gameOverlay').classList.add('hidden');
    
    food = generateFood();
    currentFoodIcon = foodIcons[Math.floor(Math.random() * foodIcons.length)];
    isGameRunning = true;
}

function buildMap() {
    obstacles = [];
    if (selectedMap === 2) {
        for (let i = 4; i < 12; i++) obstacles.push({ x: i * box, y: 8 * box });
    }
    else if (selectedMap === 3) {
        for (let i = 5; i < 11; i++) obstacles.push({ x: i * box, y: 8 * box });
        obstacles.push({x: 1*box, y: 1*box}, {x: 2*box, y: 1*box}, {x: 1*box, y: 2*box}); 
        obstacles.push({x: 14*box, y: 1*box}, {x: 13*box, y: 1*box}, {x: 14*box, y: 2*box}); 
        obstacles.push({x: 1*box, y: 14*box}, {x: 2*box, y: 14*box}, {x: 1*box, y: 13*box}); 
        obstacles.push({x: 14*box, y: 14*box}, {x: 13*box, y: 14*box}, {x: 14*box, y: 13*box}); 
    }
}

// دالة المنطق (Update Logic)
function update() {
    if (nextDirection) direction = nextDirection;
    if (direction == '') return;

    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (direction == 'LEFT') snakeX -= box;
    if (direction == 'UP') snakeY -= box;
    if (direction == 'RIGHT') snakeX += box;
    if (direction == 'DOWN') snakeY += box;

    // Portal logic
    if (selectedMap === 4) { 
        if (snakeX < 0 || snakeX >= canvasSize || snakeY < 0 || snakeY >= canvasSize) return gameOver();
    } else {
        if (snakeX < 0) snakeX = canvasSize - box;
        else if (snakeX >= canvasSize) snakeX = 0;
        if (snakeY < 0) snakeY = canvasSize - box;
        else if (snakeY >= canvasSize) snakeY = 0;
    }

    // Check collisions
    for (let i = 0; i < snake.length; i++) {
        if (snakeX == snake[i].x && snakeY == snake[i].y) return gameOver();
    }
    for (let i = 0; i < obstacles.length; i++) {
        if (snakeX == obstacles[i].x && snakeY == obstacles[i].y) return gameOver();
    }

    // Eat food
    if (snakeX == food.x && snakeY == food.y) {
        eatSound.currentTime = 0; eatSound.play();
        createExplosion(food.x, food.y, selectedSkin);
        score++;
        document.getElementById('score').textContent = score;
        currentFoodIcon = foodIcons[Math.floor(Math.random() * foodIcons.length)];
        food = generateFood();
        // زيادة بسيطة جداً بالسرعة عند الاكل لزيادة الحماس
        if (gameSpeed < 15) gameSpeed += 0.1;
    } else {
        snake.pop();
    }
    
    let newHead = { x: snakeX, y: snakeY };
    snake.unshift(newHead);
}

// دالة الرسم (Rendering)
function draw() {
    // مسح الشاشة
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // رسم الحواجز
    ctx.fillStyle = "#e74c3c";
    obstacles.forEach(obs => { ctx.fillRect(obs.x, obs.y, box - 2, box - 2); });
    
    if (selectedMap === 4) {
        ctx.strokeStyle = "#c0392b"; ctx.lineWidth = 4; ctx.strokeRect(0,0,canvasSize,canvasSize);
    }

    // رسم الانفجارات
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx; p.y += p.vy; p.life -= 0.1; 
        if (p.life <= 0) particles.splice(i, 1);
        else {
            ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }

    // رسم الطعام
    ctx.font = "20px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(currentFoodIcon, food.x + box/2, food.y + box/2 + 2);

    // رسم الحية
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = i === 0 ? "#fff" : selectedSkin;
        ctx.fillRect(snake[i].x, snake[i].y, box - 2, box - 2);
        
        if (i === 0) { // عيون
            ctx.fillStyle = "black";
            ctx.fillRect(snake[i].x + 5, snake[i].y + 5, 4, 4);
            ctx.fillRect(snake[i].x + 11, snake[i].y + 5, 4, 4);
        }
    }
}

function createExplosion(x, y, color) {
    if (particles.length > 15) particles.shift(); 
    for (let i = 0; i < 6; i++) { 
        particles.push({
            x: x + box / 2, y: y + box / 2,
            vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8,
            life: 1.0, color: color 
        });
    }
}

function generateFood() {
    let newFood;
    while (true) {
        newFood = {
            x: Math.floor(Math.random() * (canvasSize / box)) * box,
            y: Math.floor(Math.random() * (canvasSize / box)) * box
        };
        let onSnake = snake.some(s => s.x === newFood.x && s.y === newFood.y);
        let onObstacle = obstacles.some(o => o.x === newFood.x && o.y === newFood.y);
        if (!onSnake && !onObstacle) break;
    }
    return newFood;
}

function gameOver() {
    deadSound.play();
    isGameRunning = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        document.getElementById('overlayTitle').textContent = "رقم قياسي! 👑";
    } else {
        document.getElementById('overlayTitle').textContent = "خسرت!";
    }
    document.getElementById('highScore').textContent = highScore;
    document.getElementById('gameOverlay').classList.remove('hidden');
}

function handleInput(dir) {
    if (!isGameRunning) return;
    if (dir === 'UP' && direction !== 'DOWN') nextDirection = 'UP';
    if (dir === 'DOWN' && direction !== 'UP') nextDirection = 'DOWN';
    if (dir === 'LEFT' && direction !== 'RIGHT') nextDirection = 'LEFT';
    if (dir === 'RIGHT' && direction !== 'LEFT') nextDirection = 'RIGHT';
}

document.getElementById('btnUp').addEventListener('pointerdown', (e) => { e.preventDefault(); handleInput('UP'); });
document.getElementById('btnDown').addEventListener('pointerdown', (e) => { e.preventDefault(); handleInput('DOWN'); });
document.getElementById('btnLeft').addEventListener('pointerdown', (e) => { e.preventDefault(); handleInput('LEFT'); });
document.getElementById('btnRight').addEventListener('pointerdown', (e) => { e.preventDefault(); handleInput('RIGHT'); });

document.addEventListener('keydown', (e) => {
    if (e.keyCode == 37) handleInput('LEFT');
    else if (e.keyCode == 38) handleInput('UP');
    else if (e.keyCode == 39) handleInput('RIGHT');
    else if (e.keyCode == 40) handleInput('DOWN');
});

showMainMenu();
document.getElementById('highScore').textContent = highScore;