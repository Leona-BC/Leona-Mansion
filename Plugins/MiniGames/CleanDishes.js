// =====================================================
// DishCleaning.js - Unified with Maid Clean-Up System
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

    active: false
};

// -------------------------------
// Images
// -------------------------------
const Images = {
    plate: new Image(),
    dirtOverlay: new Image(),
    sponge: new Image(),
    handGrabWrist: new Image(),
    background: new Image()
};

Images.handGrabWrist.src = "https://leona-bc.github.io/Leona-Mansion/Assets/MaidHand.png";
Images.plate.src = "https://leona-bc.github.io/Leona-Mansion/Assets/Plate.png";
Images.dirtOverlay.src = "https://leona-bc.github.io/Leona-Mansion/Assets/DirtOverlay.png";
Images.sponge.src = "https://leona-bc.github.io/Leona-Mansion/Assets/Sponge.png";
Images.background.src = "https://leona-bc.github.io/Leona-Mansion/Assets/DishBackground.png";

let imagesLoaded = 0;
const totalImages = 5;

function checkImagesLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        document.dispatchEvent(new Event("DishImagesReady"));
    }
}

Images.plate.onload = checkImagesLoaded;
Images.dirtOverlay.onload = checkImagesLoaded;
Images.sponge.onload = checkImagesLoaded;
Images.handGrabWrist.onload = checkImagesLoaded;
Images.background.onload = checkImagesLoaded;

// =====================================================
// Start Dish Cleaning Mini-Game (Popup Window Version)
// =====================================================
function startDishesCleaningMiniGame(trembleLevel = 0) {
    MenuLock(true);

    if (DishGameState.active) return;
    DishGameState.active = true;

    DishGameState.trembleLevel = Math.max(0, Math.min(100, trembleLevel));

    // -------------------------------
    // MAIN CANVAS (inside popup window)
    // -------------------------------
    // --- Create canvas ---
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

    // -------------------------------
    // OVERLAY CANVAS (hand + sponge)
    // -------------------------------
    const overlay = document.createElement("canvas");
    overlay.width = canvasWidth;
    overlay.height = canvasHeight;
    overlay.style.width = canvasWidth + "px";
    overlay.style.height = canvasHeight + "px";
    
    overlay.style.position = "relative";   // SAME AS CANVAS
    overlay.style.flex = "none";           // SAME AS CANVAS
    overlay.style.display = "block";       // SAME AS CANVAS
    overlay.style.margin = "0";
    overlay.style.padding = "0";
    overlay.style.boxSizing = "border-box";
    
    overlay.style.zIndex = "100000";
    overlay.style.pointerEvents = "auto";  // CRITICAL
    overlay.style.cursor = "none";

    win.appendChild(overlay);
    const octx = overlay.getContext("2d");

    // -------------------------------
    // Positions (ratio-based)
// -------------------------------
    const baseYRatio = 220 / 300; // keep alignment with background
    const SpongeHome = {
        x: canvasWidth * (100 / 600),
        y: canvasHeight * baseYRatio
    };
    const PlatePos = {
        x: canvasWidth * (300 / 600),
        y: canvasHeight * baseYRatio
    };
    const StackPos = {
        x: canvasWidth * (500 / 600),
        y: canvasHeight * baseYRatio + 20 // PlatePos.y + 20
    };

    // -------------------------------
    // Close Button
    // -------------------------------
    const closeButton = {
        x: canvasWidth / 2 - 60,
        y: canvasHeight / 2 + 40,
        width: 120,
        height: 40,
        visible: false
    };

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
            angle: 0
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
    // Draw Functions (main canvas)
// -------------------------------
    function drawBackground() {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.drawImage(Images.background, 0, 0, canvasWidth, canvasHeight);
    }

    function drawPlate(ctxLocal, plate) {
        ctxLocal.save();
        ctxLocal.translate(plate.x, plate.y);
        ctxLocal.rotate(plate.angle);
        ctxLocal.drawImage(
            Images.plate,
            -plate.radius,
            -plate.radius,
            plate.radius * 2,
            plate.radius * 2
        );
        ctxLocal.restore();
    }

    function drawPlateStack(ctxLocal) {
        const stacked = DishGameState.plates.filter(p => p.stacked);

        stacked.forEach((plate, index) => {
            plate.x = StackPos.x;
            plate.y = StackPos.y - (index * 8);
            plate.angle = 0;
            drawPlate(ctxLocal, plate);
        });
    }

    function drawCurrentPlate(ctxLocal) {
        if (!DishGameState.currentPlate) return;
        if (DishGameState.holdingPlate) return;
        drawPlate(ctxLocal, DishGameState.currentPlate);
    }

    function drawHeldPlate(ctxLocal) {
        if (!DishGameState.holdingPlate || !DishGameState.currentPlate) return;
        drawPlate(ctxLocal, DishGameState.currentPlate);
    }

    function drawDirt(ctxLocal) {
        if (!DishGameState.currentPlate) return;
        if (DishGameState.dirtLevel <= 0) return;

        ctxLocal.globalAlpha = DishGameState.dirtLevel;

        ctxLocal.drawImage(
            Images.dirtOverlay,
            DishGameState.currentPlate.x - DishGameState.currentPlate.radius,
            DishGameState.currentPlate.y - DishGameState.currentPlate.radius,
            DishGameState.currentPlate.radius * 2,
            DishGameState.currentPlate.radius * 2
        );

        ctxLocal.globalAlpha = 1;
    }

    function drawWorldSponge(ctxLocal) {
        if (!DishGameState.spongeActive) {
            ctxLocal.drawImage(
                Images.sponge,
                SpongeHome.x - 40,
                SpongeHome.y - 40,
                80,
                80
            );
        }
    }

    function drawInstruction(ctxLocal) {
        ctxLocal.fillStyle = "white";
        ctxLocal.font = "20px Arial";
        ctxLocal.textAlign = "center";

        if (DishGameState.failed) {
            ctxLocal.fillText("The stack collapsed!", canvasWidth / 2, 40);
            return;
        }

        if (DishGameState.dirtLevel > 0 && DishGameState.currentPlate) {
            ctxLocal.fillText("Clean the plate", canvasWidth / 2, 40);
        } else if (DishGameState.currentPlate) {
            ctxLocal.fillText("Place the plate on the stack", canvasWidth / 2, 40);
        } else {
            ctxLocal.fillText("All plates cleaned!", canvasWidth / 2, 40);
        }
    }

    function drawCloseButton(ctxLocal) {
        if (!closeButton.visible) return;

        ctxLocal.fillStyle = "#222";
        ctxLocal.fillRect(closeButton.x, closeButton.y, closeButton.width, closeButton.height);

        ctxLocal.strokeStyle = "white";
        ctxLocal.lineWidth = 2;
        ctxLocal.strokeRect(closeButton.x, closeButton.y, closeButton.width, closeButton.height);

        ctxLocal.fillStyle = "white";
        ctxLocal.font = "20px Arial";
        ctxLocal.textAlign = "center";
        ctxLocal.fillText("Close", closeButton.x + closeButton.width / 2, closeButton.y + 27);
    }

    // -------------------------------
    // Overlay Draw (hand + held sponge)
// -------------------------------
    function drawHeldSponge(octxLocal) {
        if (!DishGameState.spongeActive) return;

        octxLocal.drawImage(
            Images.sponge,
            DishGameState.mouseX - 40,
            DishGameState.mouseY - 40,
            80,
            80
        );
    }

    function drawCursor(octxLocal) {
        octxLocal.drawImage(
            Images.handGrabWrist,
            DishGameState.mouseX - 32,
            DishGameState.mouseY - 32,
            64,
            64
        );
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

            p.x = StackPos.x + (Math.random() * 160 - 80);
            p.y = StackPos.y + (Math.random() * 80 - 40);

            p.angle = (Math.random() * Math.PI * 2);
        });

        DishGameState.currentPlate = null;
        DishGameState.spongeActive = false;
        DishGameState.holdingPlate = false;
    }

    // -------------------------------
    // Mouse Events (overlay)
// -------------------------------
    overlay.addEventListener("mousemove", e => {
        DishGameState.rawMouseX = e.offsetX;
        DishGameState.rawMouseY = e.offsetY;

        if (DishGameState.failed) return;

        if (DishGameState.spongeActive) {
            scrubPlate();
        }
    });

    overlay.addEventListener("mousedown", e => {
        if (DishGameState.failed) return;

        const mx = e.offsetX;
        const my = e.offsetY;

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

    overlay.addEventListener("mouseup", e => {
        const mx = e.offsetX;
        const my = e.offsetY;

        // Close button click
        if (closeButton.visible) {
            if (
                mx >= closeButton.x &&
                mx <= closeButton.x + closeButton.width &&
                my >= closeButton.y &&
                my <= closeButton.y + closeButton.height
            ) {
                DishGameState.active = false;
                canvas.remove();
                overlay.remove();
                window.MiniGameManager.closeWindow();
                MenuLock(false);
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
    // Draw Loop
    // -------------------------------
    function drawLoop() {
        if (!DishGameState.active) return;

        const tremble = getTrembleOffset();
        DishGameState.mouseX = DishGameState.rawMouseX + tremble.x;
        DishGameState.mouseY = DishGameState.rawMouseY + tremble.y;

        if (DishGameState.holdingPlate && DishGameState.currentPlate) {
            DishGameState.currentPlate.x = DishGameState.mouseX;
            DishGameState.currentPlate.y = DishGameState.mouseY;
        }

        // Main canvas
        drawBackground();
        if (!DishGameState.failed) {
            drawPlateStack(ctx);
            drawCurrentPlate(ctx);
            drawDirt(ctx);
            drawHeldPlate(ctx);
        } else {
            DishGameState.plates.forEach(p => drawPlate(ctx, p));
        }
        drawWorldSponge(ctx);
        drawInstruction(ctx);
        drawCloseButton(ctx);

        // Overlay canvas
        octx.clearRect(0, 0, canvasWidth, canvasHeight);
        drawHeldSponge(octx);
        drawCursor(octx);

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
