// Maid Clean‑Up Mini‑Game Module
// Defines ONE function: startMaidCleanUpGame(imageURL, clumsyLevel)

function startMaidCleanUpGame(imageURL, clumsyLevel = 0, dustLevel = 100) {
    MenuLock(true);
    
    // Prevent multiple instances
    if (window.maidGameActive) return;
    window.maidGameActive = true;

    // --- Create canvas ---
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 300;

    canvas.style.width = "600px";
    canvas.style.height = "300px";
    canvas.style.border = "2px solid #333";
    canvas.style.position = "absolute";
    canvas.style.zIndex = "99999";

    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    // Overlay canvas for duster
    const overlay = document.createElement("canvas");
    overlay.width = 600;
    overlay.height = 300;
    overlay.style.width = "600px";
    overlay.style.height = "300px";
    overlay.style.position = "absolute";
    overlay.style.left = canvas.style.left;
    overlay.style.top = canvas.style.top;
    overlay.style.zIndex = "100000";
    overlay.style.pointerEvents = "none";
    overlay.style.cursor = "none";

    document.body.appendChild(overlay);
    const octx = overlay.getContext("2d");

    // --- Center canvas AFTER paint ---
    requestAnimationFrame(() => {
        canvas.style.left = "-600px";
        canvas.style.top = "-200px";
        overlay.style.left = "-600px";
        overlay.style.top = "-200px";
    });

    // --- Close button ---
    const closeButton = {
        x: W / 2 - 60,
        y: H / 2 + 40,
        width: 120,
        height: 40,
        visible: false
    };

    // --- Game state ---
    let gameOver = false;
    let message = "";
    let showInstruction = true;

    // --- Duster position ---
    let mouseX = W / 2;
    let mouseY = H / 2;
    let angle = 0;

    // --- Load assets ---
    const dusterImg = new Image();
    dusterImg.src = "https://leona-bc.github.io/Leona-Mansion/Assets/duster.png";

    const dustImg = new Image();
    dustImg.src = "https://leona-bc.github.io/Leona-Mansion/Assets/dust.png";

    const bgImg = new Image();
    bgImg.src = imageURL;

    let dustList = [];

    // --- Initialize dust once background loads ---
    bgImg.onload = () => {
        initDust();
        drawAll();
    };

    function initDust() {
        let dustCount = dustLevel; // default

        // Dust level based on image size
        if (W * H < 200000) dustCount = 40;
        if (W * H > 300000) dustCount = 180;

        dustList = [];

        for (let i = 0; i < dustCount; i++) {
            dustList.push({
                x: Math.random() * (W - 32),
                y: Math.random() * (H - 32),
                stage: 4,
                cleaned: false,
                inside: false
            });
        }
    }

    // --- Pointer Lock Activation ---
    canvas.addEventListener("click", () => {
        if (!document.pointerLockElement) {
            canvas.requestPointerLock();
        }
    });

    document.addEventListener("pointerlockchange", () => {
        if (document.pointerLockElement === canvas) {
            showInstruction = false;
            document.addEventListener("mousemove", onLockedMouseMove);
        } else {
            document.removeEventListener("mousemove", onLockedMouseMove);
            showInstruction = true;
            drawAll();
        }
    });

    // --- Pointer Lock Movement ---
    function onLockedMouseMove(e) {
        const dx = e.movementX;
        const dy = e.movementY;

        // Clumsiness resistance
        const resistance = clumsyLevel * 0.15;

        if (dy < 0) {
            mouseY += dy * (1 - resistance);
        } else {
            mouseY += dy;
        }

        mouseX += dx;

        // Clamp inside canvas
        if (mouseX < 0) mouseX = 0;
        if (mouseY < 0) mouseY = 0;
        if (mouseX > W) mouseX = W;
        if (mouseY > H) mouseY = H;

        angle = Math.atan2(dy, dx);

        if (!gameOver) {
            cleanDust();
            checkCompletion();
        }

        drawAll();
    }

    // --- Draw Everything ---
    function drawAll() {
        drawBackground();
        drawDust();
        drawInstruction();
        drawMessage();
        drawCloseButton();
        drawDuster();
    }

    function drawBackground() {
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(bgImg, 0, 0, W, H);
    }

    function drawDust() {
        dustList.forEach(d => {
            if (d.cleaned) return;
            ctx.globalAlpha = d.stage / 4;
            ctx.drawImage(dustImg, d.x, d.y, 32, 32);
            ctx.globalAlpha = 1.0;
        });
    }

    function drawInstruction() {
        if (!showInstruction || gameOver) return;

        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
            "Click inside to start cleaning. Press ESC to release the mouse.",
            W / 2,
            40
        );
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

    function drawDuster() {
        octx.clearRect(0, 0, W, H);
        octx.save();
        octx.translate(mouseX, mouseY);
        octx.rotate(angle);
        octx.drawImage(dusterImg, -32, -32, 64, 64);
        octx.restore();
    }

    // --- Cleaning Logic ---
    function cleanDust() {
        const radius = 30;
        let cleanedSomething = false;

        dustList.forEach(d => {
            if (d.cleaned) return;

            const dx = d.x - mouseX;
            const dy = d.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const inside = dist < radius;

            if (inside && !d.inside) {
                d.stage--;
                if (d.stage <= 0) d.cleaned = true;
                cleanedSomething = true;
                d.inside = true;
            }

            if (!inside && d.inside) {
                d.inside = false;
            }
        });

        if (cleanedSomething) drawAll();
    }

    function getProgress() {
        let total = dustList.length * 4;
        let cleaned = 0;
        dustList.forEach(d => cleaned += (4 - d.stage));
        return cleaned / total;
    }

    function checkCompletion() {
        if (gameOver) return;

        if (getProgress() >= 0.95) {
            gameOver = true;
            message = "Room cleaned!";
            closeButton.visible = true;
            drawAll();
        }
    }

    // --- Close Button Click ---
    canvas.addEventListener("click", () => {
        if (!closeButton.visible) return;

        const overButton =
            mouseX >= closeButton.x &&
            mouseX <= closeButton.x + closeButton.width &&
            mouseY >= closeButton.y &&
            mouseY <= closeButton.y + closeButton.height;

        if (!overButton) return;

        document.exitPointerLock();
        canvas.remove();
        overlay.remove();
        window.maidGameActive = false;
        MenuLock(false);
    });
}
