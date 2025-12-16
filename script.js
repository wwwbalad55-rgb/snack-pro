const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const overlay = document.getElementById('gameOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const actionBtn = document.getElementById('actionBtn');

// الأصوات
const eatSound = new Audio('eat.mp3');
const deadSound = new Audio('dead.mp3');

// إعدادات اللعبة الثابتة (لضمان عملها ع الموبايل)
const box = 20;
// يجب أن يكون الرقم من مضاعفات 20 (320 ÷ 20 = 16 مربع)
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
let particles = [];

function initGame() {
    // نبدأ من الوسط تقريباً
    snake = [{ x: 5 * box, y: 5 * box }];
    direction = ''; 
    nextDirection = '';
    score = 0;
    scoreEl.textContent = score;
    highScoreEl.textContent = localStorage.getItem('snakeHighScore') || 0;
    
    food = generateFood();
    isGameRunning = true;
    overlay.classList.add('hidden');
    
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(draw, 130); // سرعة متوسطة
}

function gameOver() {
    deadSound.play();
    clearInterval(gameLoop);
    isGameRunning = false;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        overlayTitle.textContent = "New Record! 👑";
        overlayTitle.style.color = "#f1c40f";
    } else {
        overlayTitle.textContent = "GAME OVER";
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
        // تأكد أن الطعام ليس فوق الثعبان
        let onSnake = snake.some(s => s.x === newFood.x && s.y === newFood.y);
        if (!onSnake) break;
    }
    return newFood;
}

// التحكم (أزرار الشاشة + كيبورد)
function handleInput(dir) {
    if (!isGameRunning) return;
    if (dir === 'UP' && direction !== 'DOWN') nextDirection = 'UP';
    if (dir === 'DOWN' && direction !== 'UP') nextDirection = 'DOWN';
    if (dir === 'LEFT' && direction !== 'RIGHT') nextDirection = 'LEFT';
    if (dir === 'RIGHT' && direction !== 'LEFT') nextDirection = 'RIGHT';
}

// ربط أزرار الشاشة
document.getElementById('btnUp').onpointerdown = (e) => { e.preventDefault(); handleInput('UP'); };
document.getElementById('btnDown').onpointerdown = (e) => { e.preventDefault(); handleInput('DOWN'); };
document.getElementById('btnLeft').onpointerdown = (e) => { e.preventDefault(); handleInput('LEFT'); };
document.getElementById('btnRight').onpointerdown = (e) => { e.preventDefault(); handleInput('RIGHT'); };

// ربط الكيبورد
document.addEventListener('keydown', (e) => {
    if (e.keyCode == 37) handleInput('LEFT');
    else if (e.keyCode == 38) handleInput('UP');
    else if (e.keyCode == 39) handleInput('RIGHT');
    else if (e.keyCode == 40) handleInput('DOWN');
});

function draw() {
    if (nextDirection) direction = nextDirection;

    // مسح الشاشة
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // رسم الطعام
    ctx.fillStyle = "red";
    ctx.beginPath(); ctx.arc(food.x + box/2, food.y + box/2, box/2 - 2, 0, Math.PI*2); ctx.fill();

    // رسم الثعبان
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = (i == 0) ? "#00ff00" : "#00cc00";
        ctx.fillRect(snake[i].x, snake[i].y, box - 1, box - 1);
    }

    if (!direction) return;

    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (direction == 'LEFT') snakeX -= box;
    if (direction == 'UP') snakeY -= box;
    if (direction == 'RIGHT') snakeX += box;
    if (direction == 'DOWN') snakeY += box;

    if (snakeX < 0 || snakeX >= canvasSize || snakeY < 0 || snakeY >= canvasSize) return gameOver();
    for (let i = 0; i < snake.length; i++) {
        if (snakeX == snake[i].x && snakeY == snake[i].y) return gameOver();
    }

    let newHead = { x: snakeX, y: snakeY };

    if (snakeX == food.x && snakeY == food.y) {
        eatSound.currentTime = 0; eatSound.play();
        score++;
        scoreEl.textContent = score;
        food = generateFood();
    } else {
        snake.pop();
    }
    snake.unshift(newHead);
}

actionBtn.addEventListener('click', initGame);

// رسالة البداية
ctx.fillStyle = "white";
ctx.font = "16px Arial";
ctx.textAlign = "center";
ctx.fillText("اضغط أي زر للبدء", canvasSize/2, canvasSize/2);