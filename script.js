const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');
const finalScoreDisplay = document.getElementById('finalScore');
const finalScoreText = document.getElementById('finalScoreText');
const overlay = document.getElementById('gameOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const actionBtn = document.getElementById('actionBtn');

// تحميل الأصوات
const eatSound = new Audio('eat.mp3');
const deadSound = new Audio('dead.mp3');

// إعدادات اللعبة
const box = 20; // حجم المربع اصغر شوية لجمالية اكثر
const canvasSize = 400; // حجم ثابت مناسب للموبايل
canvas.width = canvasSize;
canvas.height = canvasSize;

let snake = [];
let food = {};
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
highScoreDisplay.textContent = highScore;

let direction = '';
let nextDirection = '';
let gameLoop = null;
let isGameRunning = false;
let gameSpeed = 100;
let particles = []; // للانفجار

// تهيئة اللعبة
function initGame() {
    snake = [{ x: 10 * box, y: 10 * box }];
    direction = ''; 
    nextDirection = '';
    score = 0;
    gameSpeed = 100;
    particles = [];
    scoreDisplay.textContent = score;
    highScoreDisplay.textContent = localStorage.getItem('snakeHighScore') || 0;
    
    food = generateFood();
    isGameRunning = true;
    overlay.classList.add('hidden');
    
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(draw, gameSpeed);
}

// إنهاء اللعبة
function gameOver() {
    deadSound.play();
    clearInterval(gameLoop);
    isGameRunning = false;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        overlayTitle.textContent = "New High Score! 🏆";
        overlayTitle.style.color = "#f1c40f";
    } else {
        overlayTitle.textContent = "GAME OVER";
        overlayTitle.style.color = "red";
    }
    
    highScoreDisplay.textContent = highScore;
    finalScoreDisplay.textContent = score;
    finalScoreText.classList.remove('hidden');
    actionBtn.textContent = "REPLAY 🔄";
    overlay.classList.remove('hidden');
}

function generateFood() {
    let newFood;
    let validPosition = false;
    while (!validPosition) {
        newFood = {
            x: Math.floor(Math.random() * (canvasSize / box)) * box,
            y: Math.floor(Math.random() * (canvasSize / box)) * box
        };
        // التأكد ان الاكل مو فوق الحية
        validPosition = !snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
    }
    return newFood;
}

// نظام الانفجار (Fireworks)
function createExplosion(x, y) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x + box/2, y: y + box/2,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1.0,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`
        });
    }
}

// التحكم بالكيبورد
document.addEventListener('keydown', (event) => {
    if (!isGameRunning) return;
    const key = event.keyCode;
    if (key == 37 && direction != 'RIGHT') nextDirection = 'LEFT';
    else if (key == 38 && direction != 'DOWN') nextDirection = 'UP';
    else if (key == 39 && direction != 'LEFT') nextDirection = 'RIGHT';
    else if (key == 40 && direction != 'UP') nextDirection = 'DOWN';
});

// === التحكم باللمس (أزرار الموبايل) ===
function handleMobileInput(dir) {
    if (!isGameRunning) return;
    if (dir === 'UP' && direction !== 'DOWN') nextDirection = 'UP';
    if (dir === 'DOWN' && direction !== 'UP') nextDirection = 'DOWN';
    if (dir === 'LEFT' && direction !== 'RIGHT') nextDirection = 'LEFT';
    if (dir === 'RIGHT' && direction !== 'LEFT') nextDirection = 'RIGHT';
}

// ربط الأزرار مع منع السكرول والزووم
['btnUp', 'btnDown', 'btnLeft', 'btnRight'].forEach(id => {
    const btn = document.getElementById(id);
    
    // لمس (Touch)
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault(); // يمنع مشاكل الموبايل
        handleMobileInput(id.replace('btn', '').toUpperCase());
    }, { passive: false });
    
    // ماوس (Click) للحاسبة
    btn.addEventListener('mousedown', (e) => {
        handleMobileInput(id.replace('btn', '').toUpperCase());
    });
});

// الرسم
function draw() {
    if (nextDirection) direction = nextDirection;

    // مسح الشاشة
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // رسم الانفجار
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx; p.y += p.vy; p.life -= 0.05;
        if (p.life <= 0) particles.splice(i, 1);
        else {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }

    // رسم الطعام
    ctx.shadowBlur = 15; ctx.shadowColor = "red";
    ctx.fillStyle = "red";
    ctx.beginPath(); ctx.arc(food.x + box/2, food.y + box/2, box/2 - 2, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;

    // رسم الحية
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = (i == 0) ? "#00ff00" : "#00cc00";
        if (i == 0) { // رأس الحية
             ctx.beginPath(); ctx.arc(snake[i].x + box/2, snake[i].y + box/2, box/2, 0, Math.PI*2); ctx.fill();
        } else { // جسم الحية
            ctx.fillRect(snake[i].x + 1, snake[i].y + 1, box - 2, box - 2);
        }
    }

    if (direction == '') return; // اللعبة واقفة تنتظر حركة

    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (direction == 'LEFT') snakeX -= box;
    if (direction == 'UP') snakeY -= box;
    if (direction == 'RIGHT') snakeX += box;
    if (direction == 'DOWN') snakeY += box;

    // حدود الخسارة
    if (snakeX < 0 || snakeX >= canvasSize || snakeY < 0 || snakeY >= canvasSize) return gameOver();
    for (let i = 0; i < snake.length; i++) {
        if (snakeX == snake[i].x && snakeY == snake[i].y) return gameOver();
    }

    let newHead = { x: snakeX, y: snakeY };

    // الأكل
    if (snakeX == food.x && snakeY == food.y) {
        eatSound.currentTime = 0; eatSound.play();
        createExplosion(food.x, food.y);
        score++;
        scoreDisplay.textContent = score;
        food = generateFood();
    } else {
        snake.pop();
    }
    snake.unshift(newHead);
}

actionBtn.addEventListener('click', initGame);

// رسالة البداية
ctx.fillStyle = "white";
ctx.font = "20px Arial";
ctx.textAlign = "center";
ctx.fillText("Press Arrow / Button to Start", canvasSize/2, canvasSize/2);