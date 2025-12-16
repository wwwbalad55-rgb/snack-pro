const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const eatSound = new Audio('eat.mp3');
const deadSound = new Audio('dead.mp3');

// إعدادات الشاشة
const box = 20;
const canvasSize = 320;
canvas.width = canvasSize;
canvas.height = canvasSize;

let snake = [];
let food = {};
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let direction = ''; 
let nextDirection = '';
let isRunning = false;
let obstacles = [];
let lastRenderTime = 0;
let gameSpeed = 10; // سرعة التحديث (مرات بالثانية)

document.getElementById('highScore').innerText = highScore;

// القوائم
function showMainMenu() {
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
}

function startGame(diff) {
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    
    // 🛠️ تصحيح مكان البداية: الزاوية (4,4) بعيداً عن الجدران
    snake = [{x: 4 * box, y: 4 * box}];
    direction = '';
    nextDirection = '';
    score = 0;
    document.getElementById('score').innerText = score;

    // بناء الخريطة (وسط + زوايا)
    buildMap();
    food = generateFood();
    
    // ضبط السرعة: السهل أبطأ، الصعب أسرع
    gameSpeed = (diff === 'easy') ? 8 : 14;

    isRunning = true;
    window.requestAnimationFrame(mainLoop);
}

// محرك اللعبة (بدل setInterval القديم)
function mainLoop(currentTime) {
    if (!isRunning) return;
    window.requestAnimationFrame(mainLoop);

    const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
    if (secondsSinceLastRender < 1 / gameSpeed) return;

    lastRenderTime = currentTime;
    update();
    draw();
}

function buildMap() {
    obstacles = [];
    // الجدار الوسطي
    for(let i=5; i<11; i++) obstacles.push({x: i*box, y: 8*box});
    
    // الزوايا القاتلة
    obstacles.push({x: 1*box, y: 1*box}, {x: 2*box, y: 1*box}, {x: 1*box, y: 2*box});
    obstacles.push({x: 14*box, y: 1*box}, {x: 13*box, y: 1*box}, {x: 14*box, y: 2*box});
    obstacles.push({x: 1*box, y: 14*box}, {x: 2*box, y: 14*box}, {x: 1*box, y: 13*box});
    obstacles.push({x: 14*box, y: 14*box}, {x: 13*box, y: 14*box}, {x: 14*box, y: 13*box});
}

function update() {
    if (nextDirection) direction = nextDirection;
    if (direction == '') return;

    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (direction == 'LEFT') snakeX -= box;
    if (direction == 'UP') snakeY -= box;
    if (direction == 'RIGHT') snakeX += box;
    if (direction == 'DOWN') snakeY += box;

    // البورتال (عبور الحواف)
    if(snakeX < 0) snakeX = canvasSize - box;
    else if(snakeX >= canvasSize) snakeX = 0;
    if(snakeY < 0) snakeY = canvasSize - box;
    else if(snakeY >= canvasSize) snakeY = 0;

    // الاصطدام
    if(checkCollision(snakeX, snakeY)) {
        gameOver();
        return;
    }

    // الأكل
    if(snakeX == food.x && snakeY == food.y){
        score++;
        document.getElementById('score').innerText = score;
        eatSound.currentTime = 0; eatSound.play().catch(()=>{});
        food = generateFood();
        // تسريع خفيف جداً مع كل أكلة
        if(gameSpeed < 18) gameSpeed += 0.2;
    } else {
        snake.pop();
    }

    snake.unshift({x: snakeX, y: snakeY});
}

function draw() {
    // مسح الشاشة
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // رسم الجدران
    ctx.fillStyle = "#e74c3c";
    for(let obs of obstacles) {
        ctx.fillRect(obs.x, obs.y, box-2, box-2);
    }

    // رسم الطعام
    ctx.font = "20px Arial";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("🍎", food.x + box/2, food.y + box/2 + 2);

    // رسم الحية (بدون ظل = سرعة عالية)
    for(let i=0; i<snake.length; i++){
        ctx.fillStyle = (i===0) ? "#fff" : "#2ecc71";
        ctx.fillRect(snake[i].x, snake[i].y, box-2, box-2);
        
        if(i===0) { // عيون
            ctx.fillStyle = "black";
            ctx.fillRect(snake[i].x+5, snake[i].y+5, 4, 4);
            ctx.fillRect(snake[i].x+11, snake[i].y+5, 4, 4);
        }
    }
}

function checkCollision(x, y) {
    for(let i=0; i<snake.length; i++){
        if(x == snake[i].x && y == snake[i].y) return true;
    }
    for(let obs of obstacles){
        if(x == obs.x && y == obs.y) return true;
    }
    return false;
}

function generateFood() {
    let newFood;
    while(true) {
        newFood = {
            x: Math.floor(Math.random() * (canvasSize/box)) * box,
            y: Math.floor(Math.random() * (canvasSize/box)) * box
        };
        if(!checkCollision(newFood.x, newFood.y)) break;
    }
    return newFood;
}

function gameOver() {
    isRunning = false;
    deadSound.play().catch(()=>{});
    if(score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
    }
    document.getElementById('highScore').innerText = highScore;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

function handleInput(dir) {
    if(!isRunning) return;
    if(dir == "LEFT" && direction != "RIGHT") nextDirection = "LEFT";
    if(dir == "UP" && direction != "DOWN") nextDirection = "UP";
    if(dir == "RIGHT" && direction != "LEFT") nextDirection = "RIGHT";
    if(dir == "DOWN" && direction != "UP") nextDirection = "DOWN";
}

document.getElementById('btnUp').onpointerdown = (e) => { e.preventDefault(); handleInput('UP'); };
document.getElementById('btnDown').onpointerdown = (e) => { e.preventDefault(); handleInput('DOWN'); };
document.getElementById('btnLeft').onpointerdown = (e) => { e.preventDefault(); handleInput('LEFT'); };
document.getElementById('btnRight').onpointerdown = (e) => { e.preventDefault(); handleInput('RIGHT'); };

document.addEventListener('keydown', (e) => {
    if(e.keyCode == 37) handleInput('LEFT');
    if(e.keyCode == 38) handleInput('UP');
    if(e.keyCode == 39) handleInput('RIGHT');
    if(e.keyCode == 40) handleInput('DOWN');
});