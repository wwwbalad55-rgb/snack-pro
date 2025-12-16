const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const overlay = document.getElementById('gameOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const actionBtn = document.getElementById('actionBtn');

const eatSound = new Audio('eat.mp3');
const deadSound = new Audio('dead.mp3');

// إعدادات اللعبة
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
let gameSpeed = 130; 

let particles = [];
let obstacles = []; // مصفوفة الحواجز

// قائمة الأطعمة (فواكه واكل)
const foodIcons = ["🍎", "🍉", "🍇", "🍓", "🍒", "🍑", "🍍", "🍕", "🍔"];
let currentFoodIcon = "🍎"; // الفاكهة الحالية

function initGame() {
    snake = [{ x: 5 * box, y: 5 * box }]; 
    direction = ''; 
    nextDirection = '';
    score = 0;
    gameSpeed = 130;
    particles = [];
    obstacles = []; // تصفير الحواجز
    scoreEl.textContent = score;
    highScoreEl.textContent = localStorage.getItem('snakeHighScore') || 0;
    
    food = generateFood();
    currentFoodIcon = foodIcons[Math.floor(Math.random() * foodIcons.length)]; // اختيار فاكهة عشوائية
    
    isGameRunning = true;
    overlay.classList.add('hidden');
    
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(draw, gameSpeed);
}

// دالة صنع الحواجز (المرحلة الثانية)
function createLevelTwo() {
    // رسم حواجز على شكل + بالنص أو زوايا
    // هذا الكود يضيف طابوق بالوسط
    for (let i = 5; i < 11; i++) {
        obstacles.push({ x: i * box, y: 5 * box }); // خط افقي
        obstacles.push({ x: i * box, y: 10 * box }); // خط افقي ثاني
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
        // التأكد ان الاكل مو فوق الحية ولا فوق الحواجز
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

    // الخلفية
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // 1. تفعيل المرحلة الثانية عند الوصول لـ 15 نقطة
    if (score === 15 && obstacles.length === 0) {
        createLevelTwo();
        // ومضة تحذيرية
        ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
        ctx.fillRect(0, 0, canvasSize, canvasSize);
    }

    // 2. رسم الحواجز (الطابوق) 🧱
    ctx.fillStyle = "#7f8c8d"; // لون رصاصي
    ctx.shadowBlur = 5;
    ctx.shadowColor = "white";
    for (let i = 0; i < obstacles.length; i++) {
        ctx.fillRect(obstacles[i].x, obstacles[i].y, box - 2, box - 2);
        // رسمة صغيرة داخل الطابوقة
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.strokeRect(obstacles[i].x, obstacles[i].y, box - 2, box - 2);
    }
    ctx.shadowBlur = 0;

    // 3. رسم الانفجار
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

    // 4. رسم الأكل (إيموجي) 🍎
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // نرسم الإيموجي بوسط المربع بالضبط
    ctx.fillText(currentFoodIcon, food.x + box/2, food.y + box/2 + 2);

    // 5. رسم الحية
    for (let i = 0; i < snake.length; i++) {
        let hue = (score * 10) % 360; 
        let color = i == 0 ? "#fff" : `hsl(${hue}, 100%, 50%)`;
        ctx.fillStyle = color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.fillRect(snake[i].x, snake[i].y, box - 2, box - 2);
        
        if (i == 0) { // عيون
            ctx.shadowBlur = 0;
            ctx.fillStyle = "black";
            ctx.fillRect(snake[i].x + 5, snake[i].y + 5, 4, 4);
            ctx.fillRect(snake[i].x + 11, snake[i].y + 5, 4, 4);
        }
    }
    ctx.shadowBlur = 0;

    if (direction == '') {
        ctx.fillStyle = "white";
        ctx.font = "bold 20px Cairo";
        ctx.textAlign = "center";
        ctx.fillText("🚀 اضغط للانطلاق", canvasSize/2, canvasSize/2 + 60);
        return;
    }

    // الحركة
    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (direction == 'LEFT') snakeX -= box;
    if (direction == 'UP') snakeY -= box;
    if (direction == 'RIGHT') snakeX += box;
    if (direction == 'DOWN') snakeY += box;

    // خسارة 1: الاصطدام بالحائط الخارجي
    if (snakeX < 0 || snakeX >= canvasSize || snakeY < 0 || snakeY >= canvasSize) return gameOver();
    
    // خسارة 2: الاصطدام بالنفس
    for (let i = 0; i < snake.length; i++) {
        if (snakeX == snake[i].x && snakeY == snake[i].y) return gameOver();
    }

    // خسارة 3: الاصطدام بالحواجز الجديدة 🧱
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

        // تغيير الفاكهة عشوائياً بعد الأكل
        currentFoodIcon = foodIcons[Math.floor(Math.random() * foodIcons.length)];

        if (gameSpeed > 60) { 
            gameSpeed -= 2; 
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
initGame();