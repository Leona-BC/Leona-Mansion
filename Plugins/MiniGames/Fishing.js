// Fishing Mini‑Game Module
// This file defines ONE function: startFishingGame()
// Nothing runs automatically until you call startFishingGame()

function startFishingGame() {

    // --- Create canvas ---
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 300;
    canvas.style.border = "2px solid #333";

   // Position the canvas (no transforms!)
    canvas.style.position = "absolute";
    canvas.style.zIndex = "99999";
    
    // Center AFTER the browser paints it
    requestAnimationFrame(() => {
        const rect = canvas.getBoundingClientRect();
        canvas.style.left = `calc(50% - ${rect.width / 2}px)`;
        canvas.style.top = `calc(50% - ${rect.height / 2}px)`;

        // Update close button position AFTER centering
        closeButton.x = W / 2 - 60;
        closeButton.y = H / 2 + 40;
    });

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

    // Close button rectangle
    const closeButton = {
        x: W / 2 - 60,
        y: H / 2 + 40,
        width: 120,
        height: 40,
        visible: false
    };

    // --- Start fish timer ---
    function startFishTimer() {
        const wait = 10000 + Math.random() * 5000;
        fishTimer = setTimeout(() => fishBites(), wait);
    }

    // --- Fish bites ---
    function fishBites() {
        fishActive = true;
        fishFight = true;

        bobber.vy += 10;
        bobber.x += (Math.random() - 0.5) * 20;

        waveHeight = 22;
        waveSpeed = 0.06;

        t += 0.5;

        reactionTimer = setTimeout(() => {
            if (!gameOver) endGame(false);
        }, 5000);
    }

    // --- Canvas click handler ---
    canvas.addEventListener("click", (event) => {
        const rect = canvas.getBoundingClientRect();
        const mx = event.clientX - rect.left;
        const my = event.clientY - rect.top;

        // Close button
        if (closeButton.visible) {
            if (
                mx >= closeButton.x &&
                mx <= closeButton.x + closeButton.width &&
                my >= closeButton.y &&
                my <= closeButton.y + closeButton.height
            ) {
                cleanup();
                return;
            }
        }

        // Catch fish
        if (fishActive && !gameOver) {
            endGame(true);
        }
    });

    // --- End game ---
    function endGame(success) {
        gameOver = true;
        fishActive = false;
        fishFight = false;

        clearTimeout(fishTimer);
        clearTimeout(reactionTimer);

        waveHeight = 12;
        waveSpeed = 0.03;

        message = success ? "You got a fish!" : "The fish got away...";

        closeButton.visible = true;
    }

    // --- Cleanup function ---
    function cleanup() {
        clearTimeout(fishTimer);
        clearTimeout(reactionTimer);
        canvas.remove();
    }

    // --- Draw functions ---
    function drawInstruction() {
        if (!instructionActive || gameOver) return;
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Click the bobber when the fish bites!", W / 2, 40);
    }

    function drawMessage() {
        if (!gameOver) return;
        ctx.fillStyle = "white";
        ctx.font = "28px Arial";
        ctx.textAlign = "center";
        ctx.fillText(message, W / 2, H / 2);
    }

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

    function updateBobber() {
        if (gameOver) return;

        bobber.vy += gravity;

        const waveY = H / 2 + Math.sin(bobber.x * 0.02 + t) * waveHeight;

        if (fishFight) {
            bobber.vy += 0.4;
            if (bobber.y > waveY) bobber.vy -= 0.15;
            bobber.vy *= 0.90;
        } else {
            if (bobber.y > waveY) bobber.vy -= buoyancy;
            bobber.vy *= (1 - drag);
        }

        bobber.y += bobber.vy;

        if (bobber.y > H - bobber.radius) {
            bobber.y = H - bobber.radius;
            bobber.vy = 0;
        }
    }

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

    // --- Main loop ---
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

    // --- Start game ---
    startFishTimer();
    loop();
}
