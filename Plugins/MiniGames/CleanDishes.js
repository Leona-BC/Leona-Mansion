// =====================================================
// DishCleaning.js - Full Standalone Mini-Game
// =====================================================

// -------------------------------
// Global Game State
// -------------------------------
const DishGameState = {
    plates: [],
    currentPlate: null,
    dirtLevel: 1,
    spongeActive: false,
    holdingPlate: false,

    rawMouseX: 0,
    rawMouseY: 0,

    mouseX: 0,
    mouseY: 0,

    lastSpongeX: 0,
    lastSpongeY: 0,
    failed: false,
    trembleLevel: 0,
};

// -------------------------------
// Images
// -------------------------------
const Images = {
    plate: new Image(),
    dirtOverlay: new Image(),
    sponge: new Image(),
    handGrabWrist: new Image(),
};

Images.handGrabWrist.src = "https://leona-bc.github.io/Leona-Mansion/Assets/MaidHand.png";
Images.plate.src = "https://leona-bc.github.io/Leona-Mansion/Assets/Plate.png";
Images.dirtOverlay.src = "https://leona-bc.github.io/Leona-Mansion/Assets/DirtOverlay.png";
Images.sponge.src = "https://leona-bc.github.io/Leona-Mansion/Assets/Sponge.png";

let imagesLoaded = 0;
const totalImages = 4;

function checkImagesLoaded() {
    imagesLoaded++;
}

Images.plate.onload = checkImagesLoaded;
Images.dirtOverlay.onload = checkImagesLoaded;
Images.sponge.onload = checkImagesLoaded;
Images.handGrabWrist.onload = checkImagesLoaded;

// =====================================================
// Start Dish Cleaning Mini-Game
// =====================================================
function startDishesCleaningMiniGame(trembleLevel = 0) {

    DishGameState.trembleLevel = Math.max(0, Math.min(100, trembleLevel));

    // -------------------------------
    // Window
    // -------------------------------
    const gameWindow = document.createElement("div");
    gameWindow.id = "DishCleaningWindow";
    gameWindow.style.position = "absolute";   // only this
    gameWindow.style.left = "-600px";         // custom position
    gameWindow.style.top = "-200px";
    gameWindow.style.width = "600px";
    gameWindow.style.height = "300px";
    gameWindow.style.border = "3px solid white";
    gameWindow.style.zIndex = "9999";
    gameWindow.style.display = "flex";
    gameWindow.style.flexDirection = "column";
    gameWindow.style.alignItems = "center";
    gameWindow.style.justifyContent = "center";
    
    // background
    gameWindow.style.backgroundImage = "url('https://leona-bc.github.io/Leona-Mansion/Assets/DishBackground.png')";
    gameWindow.style.backgroundSize = "cover";
    gameWindow.style.backgroundPosition = "center";
    gameWindow.style.imageRendering = "pixelated";
    
    document.body.appendChild(gameWindow);
    
    // -------------------------------
    // Canvas
    // -------------------------------
    const canvas = document.createElement("canvas");
    canvas.id = "dishCanvas";
    canvas.width = 600;
    canvas.height = 300;
    canvas.style.background = "transparent";
    canvas.style.imageRendering = "pixelated";
    canvas.style.cursor = "none";
    gameWindow.appendChild(canvas);
    
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    // -------------------------------
    // Positions (adjusted for 600×300)
    // -------------------------------
    const SpongeHome = { x: 100, y: 220 };
    const PlatePos   = { x: 300, y: 220 };
    const StackPos   = { x: 500, y: 240 };

    // -------------------------------
    // Canvas Close Button
    // -------------------------------
    const closeButton = {
        x: W / 2 - 60,
        y: H / 2 + 40,
        width: 120,
        height: 40,
        visible: false
    };
    
    // Center AFTER browser paints it
    requestAnimationFrame(() => {
        gameWindow.style.left = "-600px";
        gameWindow.style.top = "-200px";
    
        closeButton.x = W / 2 - 60;
        closeButton.y = H / 2 + 40;
    });

    // -------------------------------
    // Init State
    // -------------------------------
    DishGameState.plates = [];

    for (let i = 0; i < 13; i++) {
        DishGameState.plates.push({
            id: i,
            x: PlatePos.x,
            y: PlatePos.y,
            radius: 80,
            cleaned: false,
            stacked: false,
            angle: 0,
        });
    }

    for (let i = 0; i < 10; i++) {
        DishGameState.plates[i].stacked = true;
        DishGameState.plates[i].cleaned = true;
    }

    DishGameState.currentPlate = DishGameState.plates[10];

    DishGameState.dirtLevel = 1;
    DishGameState.spongeActive = false;
    DishGameState.holdingPlate = false;
    DishGameState.rawMouseX = SpongeHome.x;
    DishGameState.rawMouseY = SpongeHome.y;
    DishGameState.mouseX = SpongeHome.x;
    DishGameState.mouseY = SpongeHome.y;
    DishGameState.lastSpongeX = SpongeHome.x;
    DishGameState.lastSpongeY = SpongeHome.y;
    DishGameState.failed = false;

    // -------------------------------
    // Tremble Helper
    // -------------------------------
    function getTrembleOffset() {
        const level = DishGameState.trembleLevel;
        if (level <= 0) return { x: 0, y: 0 };

        const maxOffset = level * 0.15;
        return {
            x: (Math.random() * maxOffset) - (maxOffset / 2),
            y: (Math.random() * maxOffset) - (maxOffset / 2)
        };
    }

    // -------------------------------
    // Helper: Get top plate position
    // -------------------------------
    function getTopPlatePosition() {
        const stacked = DishGameState.plates.filter(p => p.stacked);
        const topIndex = stacked.length - 1;

        return {
            x: StackPos.x,
            y: StackPos.y - (topIndex * 8)
        };
    }

    // -------------------------------
    // Draw Functions
    // -------------------------------
    function drawPlate(ctx, plate) {
        ctx.save();
        ctx.translate(plate.x, plate.y);
        ctx.rotate(plate.angle);
        ctx.drawImage(
            Images.plate,
            -plate.radius,
            -plate.radius,
            plate.radius * 2,
            plate.radius * 2
        );
        ctx.restore();
    }

    function drawPlateStack(ctx) {
        const stacked = DishGameState.plates.filter(p => p.stacked);

        stacked.forEach((plate, index) => {
            plate.x = StackPos.x;
            plate.y = StackPos.y - (index * 8);
            plate.angle = 0;
            drawPlate(ctx, plate);
        });
    }

    function drawCurrentPlate(ctx) {
        if (!DishGameState.currentPlate) return;
        if (DishGameState.holdingPlate) return;
        drawPlate(ctx, DishGameState.currentPlate);
    }

    function drawHeldPlate(ctx) {
        if (!DishGameState.holdingPlate || !DishGameState.currentPlate) return;
        drawPlate(ctx, DishGameState.currentPlate);
    }

    function drawDirt(ctx) {
        if (!DishGameState.currentPlate) return;
        if (DishGameState.dirtLevel <= 0) return;

        ctx.globalAlpha = DishGameState.dirtLevel;

        ctx.drawImage(
            Images.dirtOverlay,
            DishGameState.currentPlate.x - DishGameState.currentPlate.radius,
            DishGameState.currentPlate.y - DishGameState.currentPlate.radius,
            DishGameState.currentPlate.radius * 2,
            DishGameState.currentPlate.radius * 2
        );

        ctx.globalAlpha = 1;
    }

    function drawWorldSponge(ctx) {
        if (!DishGameState.spongeActive) {
            ctx.drawImage(
                Images.sponge,
                SpongeHome.x - 40,
                SpongeHome.y - 40,
                80,
                80
            );
        }
    }

    function drawHeldSponge(ctx) {
        if (!DishGameState.spongeActive) return;

        ctx.drawImage(
            Images.sponge,
            DishGameState.mouseX - 40,
            DishGameState.mouseY - 40,
            80,
            80
        );
    }

    function drawCursor(ctx) {
        ctx.drawImage(
            Images.handGrabWrist,
            DishGameState.mouseX - 32,
            DishGameState.mouseY - 32,
            64,
            64
        );
    }

    function drawInstruction(ctx) {
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";

        if (DishGameState.failed) {
            ctx.fillText("The stack collapsed!", W / 2, 40);
            return;
        }

        if (DishGameState.dirtLevel > 0 && DishGameState.currentPlate) {
            ctx.fillText("Clean the plate", W / 2, 40);
        } else if (DishGameState.currentPlate) {
            ctx.fillText("Place the plate on the stack", W / 2, 40);
        } else {
            ctx.fillText("All plates cleaned!", W / 2, 40);
        }
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

    // -------------------------------
    // Scrubbing Logic (RAW mouse)
    // -------------------------------
    function scrubPlate() {
        if (!DishGameState.currentPlate) return;
        if (!DishGameState.spongeActive) return;
        if (DishGameState.dirtLevel <= 0) return;

        const moved =
            Math.abs(DishGameState.rawMouseX - DishGameState.lastSpongeX) > 2 ||
            Math.abs(DishGameState.rawMouseY - DishGameState.lastSpongeY) > 2;

        DishGameState.lastSpongeX = DishGameState.rawMouseX;
        DishGameState.lastSpongeY = DishGameState.rawMouseY;

        if (!moved) return;

        const dx = DishGameState.rawMouseX - DishGameState.currentPlate.x;
        const dy = DishGameState.rawMouseY - DishGameState.currentPlate.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > DishGameState.currentPlate.radius + 40) return;

        DishGameState.dirtLevel -= 0.005;
        if (DishGameState.dirtLevel < 0) DishGameState.dirtLevel = 0;
    }

    // -------------------------------
    // Next Plate
    // -------------------------------
    function goToNextPlate() {
        const remaining = DishGameState.plates.find(p => !p.stacked && p.cleaned === false);

        if (!remaining) {
            DishGameState.currentPlate = null;
            closeButton.visible = true;
            return;
        }

        remaining.x = PlatePos.x;
        remaining.y = PlatePos.y;
        remaining.angle = 0;
        DishGameState.currentPlate = remaining;
        DishGameState.dirtLevel = 1;
    }

    // -------------------------------
    // Collapse Stack (Failure)
// -------------------------------
    function collapseStack() {
        DishGameState.failed = true;
        closeButton.visible = true;

        DishGameState.plates.forEach(p => {
            p.stacked = false;
            p.cleaned = true;

            // Adjusted scatter for 600×300 canvas
            p.x = StackPos.x + (Math.random() * 160 - 80);   // ±80px
            p.y = StackPos.y + (Math.random() * 80 - 40);    // ±40px

            p.angle = (Math.random() * Math.PI * 2);
        });

        DishGameState.currentPlate = null;
        DishGameState.spongeActive = false;
        DishGameState.holdingPlate = false;
    }

    // -------------------------------
    // Mouse Events
    // -------------------------------
    canvas.addEventListener("mousemove", e => {
        const rect = canvas.getBoundingClientRect();
        DishGameState.rawMouseX = e.clientX - rect.left;
        DishGameState.rawMouseY = e.clientY - rect.top;

        if (DishGameState.failed) return;

        if (DishGameState.spongeActive) {
            scrubPlate();
        }
    });

    canvas.addEventListener("mousedown", e => {
        if (DishGameState.failed) return;

        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        DishGameState.rawMouseX = mx;
        DishGameState.rawMouseY = my;

        if (DishGameState.dirtLevel > 0) {
            const dx = mx - SpongeHome.x;
            const dy = my - SpongeHome.y;

            if (Math.abs(dx) < 40 && Math.abs(dy) < 40) {
                DishGameState.spongeActive = true;
                DishGameState.lastSpongeX = mx;
                DishGameState.lastSpongeY = my;
            }
            return;
        }

        if (DishGameState.currentPlate) {
            const p = DishGameState.currentPlate;
            const dxp = mx - p.x;
            const dyp = my - p.y;

            if (Math.abs(dxp) < p.radius && Math.abs(dyp) < p.radius) {
                DishGameState.holdingPlate = true;
            }
        }
    });

    canvas.addEventListener("mouseup", e => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Close button click
        if (closeButton.visible) {
            if (
                mx >= closeButton.x &&
                mx <= closeButton.x + closeButton.width &&
                my >= closeButton.y &&
                my <= closeButton.y + closeButton.height
            ) {
                document.body.removeChild(gameWindow);
                return;
            }
        }

        if (DishGameState.failed) return;

        if (DishGameState.spongeActive) {
            DishGameState.spongeActive = false;
        }

        if (DishGameState.holdingPlate && DishGameState.currentPlate) {
            DishGameState.holdingPlate = false;

            const p = DishGameState.currentPlate;
            const top = getTopPlatePosition();

            const tremble = DishGameState.trembleLevel;
            const baseBuffer = p.radius * 0.25;
            const multiplier = 1 - (tremble / 150);
            const buffer = baseBuffer * multiplier;

            const safeX = Math.abs(p.x - top.x) < buffer;
            const safeY = Math.abs(p.y - top.y) < buffer;

            const dx = p.x - top.x;
            const dy = p.y - top.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const collapseThreshold = p.radius * 1.2;

            if (safeX && safeY) {
                p.stacked = true;
                p.cleaned = true;
                p.angle = 0;
                goToNextPlate();
            }
            else if (distance < collapseThreshold) {
                collapseStack();
            }
            else {
                p.x = PlatePos.x;
                p.y = PlatePos.y;
            }
        }
    });

    // -------------------------------
    // Draw Loop (collapse fix + hand on top)
// -------------------------------
    function drawLoop() {
        ctx.clearRect(0, 0, W, H);

        const tremble = getTrembleOffset();
        DishGameState.mouseX = DishGameState.rawMouseX + tremble.x;
        DishGameState.mouseY = DishGameState.rawMouseY + tremble.y;

        if (DishGameState.holdingPlate && DishGameState.currentPlate) {
            DishGameState.currentPlate.x = DishGameState.mouseX;
            DishGameState.currentPlate.y = DishGameState.mouseY;
        }

        if (!DishGameState.failed) {
            drawPlateStack(ctx);
            drawCurrentPlate(ctx);
            drawDirt(ctx);
            drawHeldPlate(ctx);
        } else {
            // ⭐ Draw ALL plates when collapsed
            DishGameState.plates.forEach(p => drawPlate(ctx, p));
        }

        drawWorldSponge(ctx);
        drawHeldSponge(ctx);

        drawInstruction(ctx);
        drawCloseButton();

        // ⭐ HAND DRAWN LAST
        drawCursor(ctx);

        requestAnimationFrame(drawLoop);
    }

    if (imagesLoaded === totalImages) {
        drawLoop();
    } else {
        const startWhenReady = () => {
            if (imagesLoaded === totalImages) {
                drawLoop();
                document.removeEventListener("DishImagesReady", startWhenReady);
            }
        };
        document.addEventListener("DishImagesReady", startWhenReady);
    }
}
