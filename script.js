const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const overlay = document.getElementById('gameOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const actionBtn = document.getElementById('actionBtn');

const eatSound = new Audio('eat.mp3');
const deadSound = new Audio('dead.mp3');

// إعدادات القياسات
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

// مصفوفة الانفجار (الجسيمات)
let particles = [];

function initGame() {
    snake = [{ x: 5 * box, y: 5 * box }]; 
    direction = ''; 
    nextDirection = '';
    score = 0;
    particles = []; // تصفير الانفجارات القديمة
    scoreEl.textContent = score;
    highScoreEl.textContent = localStorage.getItem('snakeHighScore') || 0;
    
    food = generateFood();
    isGameRunning = true;
    overlay.classList.add('hidden');
    
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(draw, 130);
}

// دالة صنع الانفجار
function createExplosion(x, y) {
    for (let i = 0; i < 15; i++) { // عدد الشظايا
        particles.push({
            x: x + box / 2,
            y: y + box / 2,
            vx: (Math.random() - 0.5) * 10, // سرعة الانتشار
            vy: (Math.random() - 0.5) * 10,
            life: 1.0, // شفافية الشظية
            color: `hsl(${Math.random() * 360}, 100%, 50%)` // ألوان عشوائية
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
        if (!onSnake) break;
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

// التحكم
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

    // 1. مسح الشاشة
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // 2. رسم وتحديث الانفجار (الشظايا) 🔥
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05; // اختفاء تدريجي

        if (p.life <= 0) {
            particles.splice(i, 1); // مسح الشظية اذا اختفت
        } else {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }

    // 3. رسم الطعام
    ctx.fillStyle = "red";
    ctx.beginPath(); ctx.arc(food.x + box/2, food.y + box/2, box/2 - 2, 0, Math.PI*2); ctx.fill();

    // 4. رسم الحية
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = (i == 0) ? "#00ff00" : "#00cc00";
        ctx.fillRect(snake[i].x, snake[i].y, box - 1, box - 1);
        
        if (i == 0) {
            ctx.fillStyle = "black";
            ctx.fillRect(snake[i].x + 5, snake[i].y + 5, 4, 4);
            ctx.fillRect(snake[i].x + 11, snake[i].y + 5, 4, 4);
        }
    }

    // 5. شاشة البداية
    if (direction == '') {
        ctx.fillStyle = "white";
        ctx.font = "bold 20px Cairo";
        ctx.textAlign = "center";
        ctx.fillText("جاهز؟ اضغط للانطلاق 🚀", canvasSize/2, canvasSize/2 + 50);
        return;
    }

    // 6. الحركة والمنطق
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
        createExplosion(food.x, food.y); // تشغيل الانفجار هنا 💥
        score++;
        scoreEl.textContent = score;
        food = generateFood();
    } else {
        snake.pop();
    }
    snake.unshift(newHead);
}

actionBtn.addEventListener('click', initGame);
initGame();