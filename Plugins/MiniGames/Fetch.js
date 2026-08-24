function startFetchScentPrototype(dist) {
    MenuLock(true);

    if (window.fetchGameActive) return;
    window.fetchGameActive = true;

    // --- Create main canvas ---
   const canvasWidth = window.innerWidth * 0.48;
    const canvasHeight = canvasWidth / 2; // 2:1 ratio
    const headerHeight = 32;
    
    const win = window.MiniGameManager.openWindow(
        canvasWidth,
        canvasHeight + headerHeight,
        "Room Cleaning activity"
    );
    
    const canvas = document.createElement("canvas");
    // Drawing buffer
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Display size
    canvas.style.width = canvasWidth + "px";
    canvas.style.height = canvasHeight + "px";
    
    // ⭐ CRITICAL FIXES
    canvas.style.position = "relative";   // not absolute, not fixed
    canvas.style.flex = "none";           // prevents covering the header
    canvas.style.display = "block";       // ensures normal layout
    canvas.style.margin = "0";            // no weird offsets
    canvas.style.padding = "0";
    canvas.style.boxSizing = "border-box";
    
    win.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
	
	 // Overlay canvas for duster
    const overlay = document.createElement("canvas");
    overlay.width = canvasWidth;
    overlay.height = canvasHeight;
    overlay.style.width = canvasWidth + "px";
    overlay.style.height = canvasHeight + "px";
    overlay.style.position = "absolute";
	overlay.style.left = canvas.offsetLeft + "px";
	overlay.style.top = canvas.offsetTop + "px";
	overlay.style.zIndex = "100000";
	overlay.style.cursor = "none";
	overlay.style.pointerEvents = "auto";

    win.appendChild(overlay);

    window.MiniGameManager.onClose = () => {
        canvas.remove();
        overlay.remove();
        window.fetchGameActive = false;
    };

    const octx = overlay.getContext("2d");

    // --- Close button ---
    const closeButton = {
        x: W / 2 - 60,
        y: H / 2 + 40,
        width: 120,
        height: 40,
        visible: false
    };

    // --- Distance → heat level ---
    let heatLevel = "far";

    if (dist === 0) heatLevel = "see";
    else if (dist === 1) heatLevel = "veryclose";
    else if (dist === 2) heatLevel = "close";
    else if (dist === 3) heatLevel = "near";
    else if (dist > 3) heatLevel = "far";

    // --- Distance → message ---
    let resultMessage = "";
    if (dist === 0) resultMessage = "You see the ball!";
    else if (dist === 1) resultMessage = "Very close!";
    else if (dist === 2) resultMessage = "Close.";
    else if (dist === 3) resultMessage = "Near.";
    else if (dist > 3) resultMessage = "Far.";
    else resultMessage = "";

    // --- Game state ---
    let gameOver = false;
    let showInstruction = true;

    let noseX = W / 2;
    let noseY = H / 2;

    // ⭐ If no distance info, skip the game entirely
    if (dist === null || dist === undefined) {
        gameOver = true;
        resultMessage = "No clue where it is.";
        closeButton.visible = true;
    }

    // --- Heat level → sprite scale ---
    const ODOR_SCALE = {
        see:       0.40,
        veryclose: 0.38,
        close:     0.35,
        near:      0.32,
        far:       0.28
    }[heatLevel];

    let sniffTime = 0;
    const sniffRequired = 2500;

    let totalTime = 0;
    const maxTime = 10000;

    let lastTime = performance.now();

    // --- Load corridor background ---
    const bgImg = new Image();
    let bgReady = false;
    bgImg.onload = () => bgReady = true;
    bgImg.src = "https://leona-bc.github.io/Leona-Mansion/Assets/CorridorView.png";

    // --- Load odor sprite sheet ---
    const odorImg = new Image();
    let odorReady = false;
    odorImg.onload = () => odorReady = true;
    odorImg.src = "https://leona-bc.github.io/Leona-Mansion/Assets/odorSprites.png";

    // --- Load muzzle image ---
    const muzzleImg = new Image();
    let muzzleReady = false;
    muzzleImg.onload = () => muzzleReady = true;
    muzzleImg.src = "https://leona-bc.github.io/Leona-Mansion/Assets/SniffingNose.png";

    let frame = 0;
    let frameTimer = 0;

    let t = 0;
    let odorX = W / 2;
    let odorY = H / 2;
    let angle = 0;

    // --- Mouse movement ---
    overlay.addEventListener("mousemove", (e) => {
        noseX = e.offsetX;
        noseY = e.offsetY;
    });

    // --- Main loop ---
    function loop(now) {
        const dt = now - lastTime;
        lastTime = now;

        if (!gameOver) {
            totalTime += dt;

            if (totalTime >= maxTime) {
                gameOver = true;
                resultMessage = "You've got distracted and lost the trail.";
                closeButton.visible = true;
            }

            updateAnimation(dt);
            updateOdorMovement(dt);

            const onScent = checkRectangleHitbox();

            if (onScent) {
                sniffTime += dt;
                if (sniffTime >= sniffRequired) {
                    gameOver = true;
                    closeButton.visible = true;
                }
            } else {
                sniffTime = 0;
            }
        }

        drawAll();
        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

    // --- Animation ---
    function updateAnimation(dt) {
        frameTimer += dt;
        if (frameTimer > 100) {
            frame = (frame + 1) % 4;
            frameTimer = 0;
        }
    }

    // --- Movement ---
    function updateOdorMovement(dt) {
        t += dt * 0.001;

		const radiusX = W * 0.20;   // 20% of canvas width
		const radiusY = H * 0.15;   // 15% of canvas height
		const odorCenterY = H * 0.65;
		
		odorX = W / 2 + Math.cos(t * 0.8) * radiusX;
		odorY = odorCenterY + Math.sin(t * 1.1) * radiusY;

        const dx = Math.cos(t * 0.8) * 80;
        const dy = Math.sin(t * 1.1) * 60;
        angle = Math.atan2(dy, dx);
    }

    // --- Rotated rectangle hitbox ---
    function checkRectangleHitbox() {
        if (!odorReady) return false;

        const fw = odorImg.width / 4;
        const fh = odorImg.height;

        const halfW = (fw * ODOR_SCALE) * 0.50;
        const halfH = (fh * ODOR_SCALE) * 0.30;

        let dx = noseX - odorX;
        let dy = noseY - odorY;

        let cosA = Math.cos(-angle);
        let sinA = Math.sin(-angle);

        let rx = dx * cosA - dy * sinA;
        let ry = dx * sinA + dy * cosA;

        return (
            Math.abs(rx) < halfW &&
            Math.abs(ry) < halfH
        );
    }

    // --- Draw Everything ---
    function drawAll() {
        drawBackground();

        // ⭐ Hide odor trail when no ball exists
        if (dist !== null && dist !== undefined) {
            drawOdor();
        }

        drawInstruction();
        drawTimerBar();
        drawResult();
        drawCloseButton();
        drawNose();
        drawSniffProgress();
    }

    // --- Corridor background panning (HORIZON/FLOOR MAPPING) ---
    function drawBackground() {
        ctx.clearRect(0, 0, W, H);

        if (!bgReady) {
            ctx.fillStyle = "#222";
            ctx.fillRect(0, 0, W, H);
            return;
        }

        const maxScrollX = bgImg.width - W;
        const mouseNormX = noseX / W;
        const offsetX = mouseNormX * maxScrollX;

        const horizonY = bgImg.height * 0.35;
        const floorY = bgImg.height - H;

        const mouseNormY = noseY / H;
        const offsetY = horizonY + (floorY - horizonY) * mouseNormY;

        ctx.drawImage(
            bgImg,
            -offsetX,
            -offsetY,
            bgImg.width,
            bgImg.height
        );
    }

    // --- Odor sprite ---
    function drawOdor() {
        if (!odorReady) return;
		if (gameOver) return;

        const fw = odorImg.width / 4;
        const fh = odorImg.height;

        ctx.save();
        ctx.translate(odorX, odorY);
        ctx.rotate(angle);

        ctx.drawImage(
            odorImg,
            frame * fw, 0, fw, fh,
            -fw * ODOR_SCALE / 2,
            -fh * ODOR_SCALE / 2,
            fw * ODOR_SCALE,
            fh * ODOR_SCALE
        );

        ctx.restore();
    }

    function drawInstruction() {
        if (!showInstruction || gameOver) return;

        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Keep the pet's nose near the scent.", W / 2, 40);
    }

    // --- Timer bar ---
    function drawTimerBar() {
        if (gameOver) return;

        const progress = Math.min(totalTime / maxTime, 1);

        const barWidth = W - 40;
        const barHeight = 12;
        const x = 20;
        const y = H - 25;

        ctx.fillStyle = "#222";
        ctx.fillRect(x, y, barWidth, barHeight);

        ctx.fillStyle = "#88ff88";
        ctx.fillRect(x, y, barWidth * (1 - progress), barHeight);

        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }

    function drawResult() {
        if (!gameOver) return;

        ctx.fillStyle = "white";
        ctx.font = "28px Arial";
        ctx.textAlign = "center";
        ctx.fillText(resultMessage, W / 2, H / 2);
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

    // --- Draw muzzle image (NOSE TIP ALIGNMENT) ---
    function drawNose() {
        octx.clearRect(0, 0, W, H);

        if (!muzzleReady) return;

        const size = 32;

        octx.save();
        octx.translate(noseX, noseY);

        const tipOffset  = size * 0.10;
        const tipOffsetX = size * 0.10;

        octx.drawImage(
            muzzleImg,
            -tipOffsetX,
            -tipOffset,
            size,
            size
        );

        octx.restore();
    }

    function drawSniffProgress() {
        if (gameOver) return;

        const progress = Math.min(sniffTime / sniffRequired, 1);

        ctx.save();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(W - 60, 60, 25, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "#88ff88";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(
            W - 60,
            60,
            20,
            -Math.PI / 2,
            -Math.PI / 2 + progress * Math.PI * 2
        );
        ctx.stroke();

        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Sniff", W - 60, 65);
        ctx.restore();
    }

    // --- Close Button ---
    overlay.addEventListener("click", (e) => {
        if (!closeButton.visible) return;

        const mx = e.offsetX;
        const my = e.offsetY;

        const overButton =
            mx >= closeButton.x &&
            mx <= closeButton.x + closeButton.width &&
            my >= closeButton.y &&
            my <= closeButton.y + closeButton.height;

        if (!overButton) return;

        canvas.remove();
        overlay.remove();
        window.fetchGameActive = false;
        window.MiniGameManager.closeWindow();
        MenuLock(false);
    });
}
