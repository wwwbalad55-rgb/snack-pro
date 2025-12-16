const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const overlay = document.getElementById('gameOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const actionBtn = document.getElementById('actionBtn');

const eatSound = new Audio('eat.mp3');
const deadSound = new Audio('dead.mp3');

// القياسات
const box = 20;
const canvasSize = 320; 
canvas.width = canvasSize;
canvas.height = canvasSize;

let snake = [];
let food = {};
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
highScoreEl.textContent = highScore;

let direction = ''; 
let nextDirection = '';
let gameLoop = null;
let isGameRunning = false;
let gameSpeed = 180; // السرعة بطيئة ومناسبة

let particles = [];
let obstacles = []; // الجدار

const foodIcons = ["🍎", "🍉", "🍇", "🍓", "🍒", "🍑", "🍍", "🍕", "🍔"];
let currentFoodIcon = "🍎";

function initGame() {
    snake = [{ x: 5 * box, y: 5 * box }]; 
    direction = ''; 
    nextDirection = '';
    score = 0;
    particles = [];
    obstacles = []; 
    createCenterWall(); // انشاء الجدار
    
    scoreEl.textContent = score;
    highScoreEl.textContent = localStorage.getItem('snakeHighScore') || 0;
    
    food = generateFood();
    currentFoodIcon = foodIcons[Math.floor(Math.random() * foodIcons.length)];
    
    isGameRunning = true;
    overlay.classList.add('hidden');
    
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(draw, gameSpeed);
}

// دالة الجدار الوسطي
function createCenterWall() {
    for (let i = 4; i < 12; i++) {
        obstacles.push({ x: i * box, y: 8 * box }); 
    }
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) { 
        particles.push({
            x: x + box / 2,
            y: y + box / 2,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1.0, 
            color: color 
        });
    }
}

function gameOver() {
    deadSound.play();
    isGameRunning = false;
    clearInterval(gameLoop);
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        overlayTitle.textContent = "رقم قياسي جديد! 👑";
        overlayTitle.style.color = "#f1c40f";
    } else {
        overlayTitle.textContent = "خسرت!";
        overlayTitle.style.color = "red";
    }
    highScoreEl.textContent = highScore;
    overlay.classList.remove('hidden');
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

function draw() {
    if (nextDirection) direction = nextDirection;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // رسم الجدار
    ctx.fillStyle = "#e74c3c";
    ctx.shadowBlur = 5;
    ctx.shadowColor = "red";
    for (let i = 0; i < obstacles.length; i++) {
        ctx.fillRect(obstacles[i].x, obstacles[i].y, box - 2, box - 2);
    }
    ctx.shadowBlur = 0;

    // رسم الانفجار
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx; p.y += p.vy; p.life -= 0.05;
        if (p.life <= 0) particles.splice(i, 1);
        else {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }

    // رسم الاكل
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(currentFoodIcon, food.x + box/2, food.y + box/2 + 2);

    // رسم الحية
    for (let i = 0; i < snake.length; i++) {
        let hue = (score * 10) % 360; 
        let color = i == 0 ? "#fff" : `hsl(${hue}, 100%, 50%)`;
        ctx.fillStyle = color;
        ctx.fillRect(snake[i].x, snake[i].y, box - 2, box - 2);
        
        if (i == 0) { 
            ctx.fillStyle = "black";
            ctx.fillRect(snake[i].x + 5, snake[i].y + 5, 4, 4);
            ctx.fillRect(snake[i].x + 11, snake[i].y + 5, 4, 4);
        }
    }

    // رسالة البداية الجديدة
    if (direction == '') {
        ctx.fillStyle = "white";
        ctx.font = "bold 20px Cairo";
        ctx.textAlign = "center";
        ctx.fillText("🚀 اضغط للانطلاق", canvasSize/2, canvasSize/2 + 60);
        return;
    }

    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (direction == 'LEFT') snakeX -= box;
    if (direction == 'UP') snakeY -= box;
    if (direction == 'RIGHT') snakeX += box;
    if (direction == 'DOWN') snakeY += box;

    // 🔥 البورتال: اذا عبرت الحدود ترجع من الجهة الثانية 🔥
    if (snakeX < 0) snakeX = canvasSize - box;
    else if (snakeX >= canvasSize) snakeX = 0;
    
    if (snakeY < 0) snakeY = canvasSize - box;
    else if (snakeY >= canvasSize) snakeY = 0;

    // الخسارة (اصطدام بالنفس)
    for (let i = 0; i < snake.length; i++) {
        if (snakeX == snake[i].x && snakeY == snake[i].y) return gameOver();
    }

    // الخسارة (اصطدام بالجدار)
    for (let i = 0; i < obstacles.length; i++) {
        if (snakeX == obstacles[i].x && snakeY == obstacles[i].y) return gameOver();
    }

    let newHead = { x: snakeX, y: snakeY };

    if (snakeX == food.x && snakeY == food.y) {
        eatSound.currentTime = 0; eatSound.play();
        let hue = (score * 10) % 360;
        createExplosion(food.x, food.y, `hsl(${hue}, 100%, 50%)`);
        score++;
        scoreEl.textContent = score;
        currentFoodIcon = foodIcons[Math.floor(Math.random() * foodIcons.length)];
        food = generateFood();
    } else {
        snake.pop();
    }
    snake.unshift(newHead);
}

actionBtn.addEventListener('click', initGame);
initGame();