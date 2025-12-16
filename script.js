const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');
const finalScoreDisplay = document.getElementById('finalScore');
const finalScoreText = document.getElementById('finalScoreText');
const overlay = document.getElementById('gameOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const actionBtn = document.getElementById('actionBtn');

// الأصوات
const eatSound = new Audio('eat.mp3');
const deadSound = new Audio('dead.mp3');

// الإعدادات
const box = 30;
const canvasSize = 480;
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
let isPaused = false;
let gameSpeed = 120;

// مصفوفة الجزيئات (للانفجار)
let particles = [];

function initGame() {
    snake = [{ x: 8 * box, y: 8 * box }];
    direction = ''; 
    nextDirection = '';
    score = 0;
    gameSpeed = 120;
    particles = []; // تصفير الجزيئات
    scoreDisplay.textContent = score;
    highScoreDisplay.textContent = localStorage.getItem('snakeHighScore') || 0;
    
    food = generateFood();
    isGameRunning = true;
    isPaused = false;
    overlay.classList.add('hidden');
    
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(draw, gameSpeed);
}

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
        validPosition = !snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
    }
    return newFood;
}

// دالة صنع الانفجار
function createExplosion(x, y) {
    for (let i = 0; i < 15; i++) { // 15 قطعة بكل انفجار
        particles.push({
            x: x + box / 2, // تبدأ من نص التفاحة
            y: y + box / 2,
            vx: (Math.random() - 0.5) * 10, // سرعة عشوائية بالاتجاهات
            vy: (Math.random() - 0.5) * 10,
            life: 1.0, // عمر الجزيء (يبدأ 1 ويقل)
            color: `hsl(${Math.random() * 360}, 100%, 50%)` // لون عشوائي
        });
    }
}

document.addEventListener('keydown', (event) => {
    const key = event.keyCode;
    if (key === 32 && isGameRunning) {
        if (isPaused) {
            gameLoop = setInterval(draw, gameSpeed);
            isPaused = false;
        } else {
            clearInterval(gameLoop);
            isPaused = true;
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.fillRect(0,0,canvasSize,canvasSize);
            ctx.fillStyle = "white";
            ctx.font = "40px Arial";
            ctx.textAlign = "center";
            ctx.fillText("PAUSED", canvasSize/2, canvasSize/2);
        }
        return;
    }

    if (!isGameRunning || isPaused) return;

    if (key == 37 && direction != 'RIGHT') nextDirection = 'LEFT';
    else if (key == 38 && direction != 'DOWN') nextDirection = 'UP';
    else if (key == 39 && direction != 'LEFT') nextDirection = 'RIGHT';
    else if (key == 40 && direction != 'UP') nextDirection = 'DOWN';
});

function draw() {
    if (nextDirection) direction = nextDirection;

    // مسح الشاشة مع ترك أثر خفيف (Trail Effect) اختياري، هنا مسح كامل
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // 1. رسم وتحديث الجزيئات (الانفجار)
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05; // يختفي تدريجياً

        if (p.life <= 0) {
            particles.splice(i, 1); // حذف الجزيء الميت
        } else {
            ctx.globalAlpha = p.life; // شفافية حسب العمر
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0; // ارجاع الشفافية للطبيعي
        }
    }

    // 2. رسم الطعام
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ff3333";
    ctx.fillStyle = "#ff3333";
    ctx.beginPath();
    ctx.arc(food.x + box/2, food.y + box/2, box/2 - 2, 0, 2*Math.PI);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(food.x + box/2 - 4, food.y + box/2 - 4, 3, 0, 2*Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 3. رسم الحية
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = (i == 0) ? "#00ff00" : "#00cc00";
        ctx.shadowBlur = 5;
        ctx.shadowColor = "black";
        
        if (i == 0) {
            ctx.beginPath();
            ctx.arc(snake[i].x + box/2, snake[i].y + box/2, box/2, 0, 2*Math.PI);
            ctx.fill();
            // عيون
            ctx.fillStyle = "black";
            ctx.beginPath(); ctx.arc(snake[i].x + box/2 - 5, snake[i].y + box/2 - 5, 3, 0, 2*Math.PI); ctx.fill();
            ctx.beginPath(); ctx.arc(snake[i].x + box/2 + 5, snake[i].y + box/2 - 5, 3, 0, 2*Math.PI); ctx.fill();
        } else {
            ctx.beginPath();
            ctx.roundRect(snake[i].x + 1, snake[i].y + 1, box - 2, box - 2, 5);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    if (direction == '') return;

    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (direction == 'LEFT') snakeX -= box;
    if (direction == 'UP') snakeY -= box;
    if (direction == 'RIGHT') snakeX += box;
    if (direction == 'DOWN') snakeY += box;

    // الخسارة
    if (snakeX < 0 || snakeX >= canvasSize || snakeY < 0 || snakeY >= canvasSize) {
        return gameOver();
    }
    for (let i = 0; i < snake.length; i++) {
         if (snakeX == snake[i].x && snakeY == snake[i].y) {
             return gameOver();
         }
    }

    let newHead = { x: snakeX, y: snakeY };

    // الأكل
    if (snakeX == food.x && snakeY == food.y) {
        eatSound.currentTime = 0;
        eatSound.play();
        
        // تشغيل الانفجار بموقع الطعام 💥
        createExplosion(food.x, food.y);
        
        score++;
        scoreDisplay.textContent = score;

        if (score % 5 === 0 && gameSpeed > 50) {
            gameSpeed -= 10; 
            clearInterval(gameLoop);
            gameLoop = setInterval(draw, gameSpeed);
        }

        food = generateFood();
    } else {
        snake.pop();
    }
    snake.unshift(newHead);
}

actionBtn.addEventListener('click', initGame);
// === التحكم عن طريق أزرار الشاشة (للموبايل) ===
document.getElementById('btnUp').addEventListener('touchstart', function(e) { 
    e.preventDefault(); // يمنع زووم الشاشة
    if (direction != 'DOWN') nextDirection = 'UP'; 
});
document.getElementById('btnDown').addEventListener('touchstart', function(e) { 
    e.preventDefault();
    if (direction != 'UP') nextDirection = 'DOWN'; 
});
document.getElementById('btnLeft').addEventListener('touchstart', function(e) { 
    e.preventDefault();
    if (direction != 'RIGHT') nextDirection = 'LEFT'; 
});
document.getElementById('btnRight').addEventListener('touchstart', function(e) { 
    e.preventDefault();
    if (direction != 'LEFT') nextDirection = 'RIGHT'; 
});

// دعم للماوس أيضاً (اذا تجرب بالحاسبة)
document.getElementById('btnUp').addEventListener('click', () => { if (direction != 'DOWN') nextDirection = 'UP'; });
document.getElementById('btnDown').addEventListener('click', () => { if (direction != 'UP') nextDirection = 'DOWN'; });
document.getElementById('btnLeft').addEventListener('click', () => { if (direction != 'RIGHT') nextDirection = 'LEFT'; });
document.getElementById('btnRight').addEventListener('click', () => { if (direction != 'LEFT') nextDirection = 'RIGHT'; });
ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
ctx.font = "20px Arial";
ctx.textAlign = "center";
ctx.fillText("Ready?", canvasSize/2, canvasSize/2);