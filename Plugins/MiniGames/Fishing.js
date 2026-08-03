// Create the canvas entirely from JavaScript
const canvas = document.createElement("canvas");
canvas.width = 600;
canvas.height = 300;
canvas.style.border = "2px solid #333";
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

// Water wave parameters
let t = 0;
let waveHeight = 12;
let waveSpeed = 0.03;

// Bobber physics
let bobber = {
    x: W / 2,
    y: H / 2,
    vy: 0,
    radius: 10
};

// Simple physics constants
const gravity = 0.2;
const buoyancy = 0.3;
const drag = 0.02;

// Fishing state
let fishTimer = null;
let reactionTimer = null;
let fishActive = false;
let fishFight = false;
let gameOver = false;
let message = "";

// Instruction message timer
let instructionActive = true;
setTimeout(() => instructionActive = false, 5000);

// Button rectangle (inside canvas)
const closeButton = {
    x: W / 2 - 60,
    y: H / 2 + 40,
    width: 120,
    height: 40,
    visible: false
};

// Start the fish timer (10–15 seconds)
function startFishTimer() {
    const wait = 10000 + Math.random() * 5000;
    fishTimer = setTimeout(() => fishBites(), wait);
}

startFishTimer();

// When fish bites
function fishBites() {
    fishActive = true;
    fishFight = true;

    // Strong downward pull
    bobber.vy += 10;

    // Add sideways wobble
    bobber.x += (Math.random() - 0.5) * 20;

    // Make water more violent
    waveHeight = 22;
    waveSpeed = 0.06;

    // Splash effect (phase jump)
    t += 0.5;

    // Start 5‑second reaction window
    reactionTimer = setTimeout(() => {
        if (!gameOver) endGame(false);
    }, 5000);
}

// Click = try to catch fish OR click the close button
canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;

    if (closeButton.visible) {
        if (
            mx >= closeButton.x &&
            mx <= closeButton.x + closeButton.width &&
            my >= closeButton.y &&
            my <= closeButton.y + closeButton.height
        ) {
            canvas.remove();
            return;
        }
    }

    if (fishActive && !gameOver) {
        endGame(true);
    }
});

// End game (success or failure)
function endGame(success) {
    gameOver = true;
    fishActive = false;
    fishFight = false;

    clearTimeout(fishTimer);
    clearTimeout(reactionTimer);

    // Calm water again
    waveHeight = 12;
    waveSpeed = 0.03;

    message = success ? "You got a fish!" : "The fish got away...";

    // Show canvas button
    closeButton.visible = true;
}

// Draw instruction message (first 5 seconds)
function drawInstruction() {
    if (!instructionActive || gameOver) return;

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Click on the bobber when the fish is on the line.", W / 2, 40);
}

// Draw result message
function drawMessage() {
    if (!gameOver) return;

    ctx.fillStyle = "white";
    ctx.font = "28px Arial";
    ctx.textAlign = "center";
    ctx.fillText(message, W / 2, H / 2);
}

// Draw close button inside canvas
function drawCloseButton() {
    if (!closeButton.visible) return;

    ctx.fillStyle = "#222";
    ctx.fillRect(closeButton.x, closeButton.y, closeButton.width, closeButton.height);

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(closeButton.x, closeButton.y, closeButton.width, closeButton.height);

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Close", closeButton.x + closeButton.width / 2, closeButton.y + 27);
}

// Draw water
function drawWater() {
    ctx.fillStyle = "#4fa3f7";
    ctx.fillRect(0, 0, W, H);

    ctx.beginPath();
    ctx.moveTo(0, H / 2);

    for (let x = 0; x < W; x++) {
        const y = H / 2 + Math.sin(x * 0.02 + t) * waveHeight;
        ctx.lineTo(x, y);
    }

    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();

    ctx.fillStyle = "#3b82d6";
    ctx.fill();
}

// Update bobber physics
// Horizontal fight target (updated once per second)
let fightTargetX = W / 2;

function updateBobber() {
    if (gameOver) return;

    if (fishFight) {
		// --- Stronger, faster vertical sinusoidal movement ---
		const fightSpeed = 0.9;   // twice as fast
		const amplitude = 80;     // twice as strong

		const baseY = H / 2 + 30; // center of fight zone (lower half)

		// Vertical fight: big, smooth up/down
		bobber.y = baseY + Math.sin(t * fightSpeed) * amplitude;

		// Clamp to lower half
		const minY = H / 2 - 5;
		const maxY = H - bobber.radius - 10;
		if (bobber.y < minY) bobber.y = minY;
		if (bobber.y > maxY) bobber.y = maxY;

		// --- Horizontal random movement (unchanged) ---
		if (Math.floor(t) !== Math.floor(t - waveSpeed)) {
			fightTargetX = W / 2 + (Math.random() * 40 - 20); // ±20px
		}

		bobber.x += (fightTargetX - bobber.x) * 0.08;

		const minX = bobber.radius + 10;
		const maxX = W - bobber.radius - 10;
		if (bobber.x < minX) bobber.x = minX;
		if (bobber.x > maxX) bobber.x = maxX;

		bobber.vy = 0;
		return;
	}

    // NORMAL PHYSICS (when not fighting)
    const waveY = H / 2 + Math.sin(bobber.x * 0.02 + t) * waveHeight;

    bobber.vy += gravity;

    if (bobber.y > waveY) {
        bobber.vy -= buoyancy;
    }

    bobber.vy *= (1 - drag);
    bobber.y += bobber.vy;

    const maxDepth = H - bobber.radius - 10;
    if (bobber.y > maxDepth) {
        bobber.y = maxDepth;
        bobber.vy = 0;
    }
}



// Draw bobber (hidden when game ends)
function drawBobber() {
    if (gameOver) return;

    ctx.beginPath();
    ctx.arc(bobber.x, bobber.y, bobber.radius, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Main loop
function loop() {
    t += waveSpeed;

    drawWater();
    updateBobber();
    drawBobber();
    drawInstruction();
    drawMessage();
    drawCloseButton();

    requestAnimationFrame(loop);
}

loop();
