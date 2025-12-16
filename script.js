const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const eatSound = new Audio('eat.mp3');
const deadSound = new Audio('dead.mp3');

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
let particles = [];
let foodIcons = ["🍎", "🍉", "🍇", "🍓", "🍒", "🍑", "🍍", "🍕", "🍔"];
let currentFoodIcon = "🍎";

// === إعدادات الأداء (المحرك) ===
let lastRenderTime = 0;
let gameSpeed = 10; 

// === إعدادات المستخدم ===
let selectedSkin = localStorage.getItem('snakeSkin') || '#2ecc71';
let selectedMap = 1; 
let difficulty = 'easy'; 

// === إدارة الشاشات ===
function showMainMenu() { switchScreen('mainMenu'); }
function showShop() { switchScreen('shopScreen'); renderShop(); }
function showMapSelection() { switchScreen('mapScreen'); }

function switchScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

// === المتجر ===
const skins = [
    { color: '#2ecc71', name: 'أخضر' },
    { color: '#3498db', name: 'أزرق' },
    { color: '#f1c40f', name: 'ذهبي' },
    { color: '#e74c3c', name: 'أحمر' },
    { color: '#9b59b6', name: 'بنفسجي' },
    { color: '#ffffff', name: 'أبيض' }
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

// === اختيار الخريطة ===
function selectMap(id, btn) {
    selectedMap = id;
    document.querySelectorAll('#mapScreen .options-grid:first-of-type .opt-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}
function selectDiff(diff, btn) {
    difficulty = diff;
    document.querySelectorAll('#mapScreen .options-grid:last-of-type .opt-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

// === اللعبة ===
function startGame() {
    switchScreen('gameScreen');
    initGame();
    window.requestAnimationFrame(mainLoop);
}

function initGame() {
    // مكان البداية الآمن (الزاوية)
    snake = [{ x: 4 * box, y: 4 * box }];
    direction = '';
    nextDirection = '';
    score = 0;
    particles = [];
    obstacles = [];
    
    // السرعة: السهل=8، الصعب=13 (أرقام موزونة للسلاسة)
    gameSpeed = difficulty === 'hard' ? 13 : 8;
    
    buildMap();
    document.getElementById('score').innerText = score;
    document.getElementById('highScore').innerText = highScore;
    document.getElementById('gameOverlay').classList.add('hidden');
    
    food = generateFood();
    currentFoodIcon = foodIcons[Math.floor(Math.random() * foodIcons.length)];
    isRunning = true;
}

function buildMap() {
    obstacles = [];
    if (selectedMap === 2) { // وسط
        for (let i = 4; i < 12; i++) obstacles.push({ x: i * box, y: 8 * box });
    } else if (selectedMap === 3) { // زوايا + وسط
        for (let i = 5; i < 11; i++) obstacles.push({ x: i * box, y: 8 * box });
        obstacles.push({x: 1*box, y: 1*box}, {x: 2*box, y: 1*box}, {x: 1*box, y: 2*box}); 
        obstacles.push({x: 14*box, y: 1*box}, {x: 13*box, y: 1*box}, {x: 14*box, y: 2*box}); 
        obstacles.push({x: 1*box, y: 14*box}, {x: 2*box, y: 14*box}, {x: 1*box, y: 13*box}); 
        obstacles.push({x: 14*box, y: 14*box}, {x: 13*box, y: 14*box}, {x: 14*box, y: 13*box}); 
    }
}

function resetGame() { initGame(); }

function mainLoop(currentTime) {
    if (!isRunning) return;
    window.requestAnimationFrame(mainLoop);
    
    const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
    if (secondsSinceLastRender < 1 / gameSpeed) return;
    
    lastRenderTime = currentTime;
    update();
    draw();
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

    // البورتال
    if (snakeX < 0) snakeX = canvasSize - box;
    else if (snakeX >= canvasSize) snakeX = 0;
    if (snakeY < 0) snakeY = canvasSize - box;
    else if (snakeY >= canvasSize) snakeY = 0;

    // الاصطدامات
    for (let i = 0; i < snake.length; i++) {
        if (snakeX == snake[i].x && snakeY == snake[i].y) return gameOver();
    }
    for (let obs of obstacles) {
        if (snakeX == obs.x && snakeY == obs.y) return gameOver();
    }

    // الأكل
    if (snakeX == food.x && snakeY == food.y) {
        eatSound.currentTime = 0; eatSound.play().catch(()=>{});
        createExplosion(food.x, food.y, selectedSkin);
        score++;
        document.getElementById('score').innerText = score;
        currentFoodIcon = foodIcons[Math.floor(Math.random() * foodIcons.length)];
        food = generateFood();
    } else {
        snake.pop();
    }
    snake.unshift({ x: snakeX, y: snakeY });
}

function draw() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // الحواجز
    ctx.fillStyle = "#e74c3c";
    obstacles.forEach(obs => ctx.fillRect(obs.x, obs.y, box - 2, box - 2));

    // الانفجارات (خفيفة وبدون ظل)
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

    // الطعام
    ctx.font = "20px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(currentFoodIcon, food.x + box/2, food.y + box/2 + 2);

    // الحية (بدون توهج = سرعة عالية)
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
    if (particles.length > 10) particles.shift(); // تقليل العدد
    for (let i = 0; i < 6; i++) {
        particles.push({
            x: x + box/2, y: y + box/2,
            vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8,
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
        let collision = snake.some(s => s.x === newFood.x && s.y === newFood.y) || 
                        obstacles.some(o => o.x === newFood.x && o.y === newFood.y);
        if (!collision) break;
    }
    return newFood;
}

function gameOver() {
    isRunning = false;
    deadSound.play().catch(()=>{});
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
    }
    document.getElementById('highScore').innerText = highScore;
    document.getElementById('gameOverlay').classList.remove('hidden');
}

function handleInput(dir) {
    if (!isRunning) return;
    if (dir === 'UP' && direction !== 'DOWN') nextDirection = 'UP';
    if (dir === 'DOWN' && direction !== 'UP') nextDirection = 'DOWN';
    if (dir === 'LEFT' && direction !== 'RIGHT') nextDirection = 'LEFT';
    if (dir === 'RIGHT' && direction !== 'LEFT') nextDirection = 'RIGHT';
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
showMainMenu();
document.getElementById('highScore').innerText = highScore;