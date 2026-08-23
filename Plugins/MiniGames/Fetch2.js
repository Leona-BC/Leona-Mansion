function startClawCraneGame() {
    MenuLock(true);

    if (window.clawGameActive) return;
    window.clawGameActive = true;

    // --- Create canvas ---
    const canvasWidth = window.innerWidth * 0.48;
    const canvasHeight = canvasWidth / 2; // 2:1 ratio
    const headerHeight = 32;
    
    const win = window.MiniGameManager.openWindow(
        canvasWidth,
        canvasHeight + headerHeight,
        "Fishing activity"
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

    // --- Overlay canvas ---
    const overlay = document.createElement("canvas");
    overlay.width = canvasWidth;
    overlay.height = canvasHeight;
    overlay.style.width = canvasWidth + "px";
    overlay.style.height = canvasHeight + "px";
    overlay.style.position = "absolute";
    overlay.style.left = canvas.style.left;
    overlay.style.top = canvas.style.top;
    overlay.style.zIndex = "100000";
    overlay.style.pointerEvents = "none";
    overlay.style.cursor = "default";
    win.appendChild(overlay);

    const octx = overlay.getContext("2d");

    // --- Playable zone ---
	const PANEL_WIDTH = canvasWidth * 0.30;
	const PLAY_LEFT = canvasWidth * 0.05;
	const PLAY_RIGHT = canvasWidth - PANEL_WIDTH - 20;

    // --- Buttons ---
    const closeButton = {
        x: W / 2 - 60,
        y: H / 2 + 40,
        width: 120,
        height: 40,
        visible: false
    };

    const fetchButton = {
        x: 450,
        y: 140,
        width: 120,
        height: 40,
        visible: true
    };

    // --- Game state ---
    let gameOver = false;
    let resultMessage = "";
    let clawState = "sweeping";
    let clawY = 0;
    let clawX = (PLAY_LEFT + PLAY_RIGHT) / 2;
    let clawSpeed = 3;
    let clawDir = 1;
	let clawPauseTimer = 0;

    let grabbedObject = null;
    let clawFrameIndex = 0; // 0=open, 1=closing, 2=closed

    // --- Load assets ---
    const bgImg = new Image();
    let bgReady = false;
    bgImg.onload = () => bgReady = true;
    bgImg.src = "https://leona-bc.github.io/Leona-Mansion/Assets/CorridorView.png";

    // --- Claw sprite sheet ---
    const clawSheet = new Image();
    clawSheet.src = "https://leona-bc.github.io/Leona-Mansion/Assets/MouthClaw.png";

    // --- Scaling factor ---
    const CLAW_SCALE = 80 / 538; // original height 538 → scaled to 80px

    // --- Claw frames (scaled) ---
    const clawFrames = [
        { sx: 0,    sy: 90, w: 829 * CLAW_SCALE, h: 538 * CLAW_SCALE },   // open
        { sx: 899,  sy: 90, w: 636 * CLAW_SCALE, h: 538 * CLAW_SCALE },   // closing
        { sx: 1614, sy: 90, w: 539 * CLAW_SCALE, h: 538 * CLAW_SCALE }    // closed
    ];

    // --- Object sprites ---
    const dustImg = new Image(); dustImg.src = "https://leona-bc.github.io/Leona-Mansion/Assets/dust.png";
    const spongeImg = new Image(); spongeImg.src = "https://leona-bc.github.io/Leona-Mansion/Assets/Sponge.png";
    const sockImg = new Image(); sockImg.src = "https://leona-bc.github.io/Leona-Mansion/Assets/Sock.png";
    const underwearImg = new Image(); underwearImg.src = "https://leona-bc.github.io/Leona-Mansion/Assets/Panties.png";
    const ballImg = new Image(); ballImg.src = "https://leona-bc.github.io/Leona-Mansion/Assets/Ball.png";

    // --- Random object placement ---
    const floorY = canvasHeight * 0.70;
	const DROP_Y = canvasHeight * 0.70;
    const objectTypes = [
        { type: "dust", img: dustImg },
        { type: "dust", img: dustImg },
        { type: "dust", img: dustImg },
        { type: "sponge", img: spongeImg },
        { type: "sock", img: sockImg },
        { type: "underwear", img: underwearImg },
        { type: "ball", img: ballImg }
    ];

    const objects = [];

    function placeObjects() {
		const placed = [];
		const MAX_TRIES = 500;

		for (let obj of objectTypes) {
			let tries = 0;
			let x;

			while (true) {
				x = Math.floor(Math.random() * (PLAY_RIGHT - PLAY_LEFT - 40)) + PLAY_LEFT;
				tries++;

				let overlap = false;

				for (let p of placed) {
					// bounding-box overlap check
					if (!(x + 40 < p.x || x > p.x + p.w)) {
						overlap = true;
						break;
					}
				}

				if (!overlap) break;

				if (tries > MAX_TRIES) {
					// widen spacing automatically
					x = PLAY_LEFT + placed.length * 60;
					break;
				}
			}

			placed.push({
				type: obj.type,
				img: obj.img,
				x,
				y: floorY,
				w: 40,
				h: 40
			});
		}

		objects.push(...placed);
	}


    placeObjects();

    // --- Fetch button ---
    canvas.addEventListener("click", (e) => {
        if (gameOver) return;

        const mx = e.offsetX;
        const my = e.offsetY;

        const overFetch =
            mx >= fetchButton.x &&
            mx <= fetchButton.x + fetchButton.width &&
            my >= fetchButton.y &&
            my <= fetchButton.y + fetchButton.height;

        if (overFetch && fetchButton.visible) {
            fetchButton.visible = false;
            clawState = "dropping";
            clawFrameIndex = 0;
        }
    });

    // --- Main loop ---
    let lastTime = performance.now();
    function loop(now) {
        const dt = now - lastTime;
        lastTime = now;

        update(dt);
        drawAll();

        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    // --- Update logic ---
    function update(dt) {
		if (gameOver) return;

		// --- Sweeping ---
		if (clawState === "sweeping") {
			clawFrameIndex = 0;
			clawX += clawDir * clawSpeed * 2;
			if (clawX <= PLAY_LEFT + 20) clawDir = 1;
			if (clawX >= PLAY_RIGHT - 20) clawDir = -1;
		}

		// --- Dropping ---
		if (clawState === "dropping") {
			clawFrameIndex = 0;
			clawY += clawSpeed;

			if (clawY >= DROP_Y) {
    			clawY = DROP_Y;

				clawState = "pause_open";
				clawPauseTimer = 500; // 0.5 sec
			}
		}

		// --- Pause at bottom (open claw) ---
		if (clawState === "pause_open") {
			clawFrameIndex = 0;

			clawPauseTimer -= dt;
			if (clawPauseTimer <= 0) {
				clawState = "closing";
				clawFrameIndex = 1;
				clawPauseTimer = 500; // 0.5 sec
			}
		}

		// --- Closing animation ---
		if (clawState === "closing") {
			clawFrameIndex = 1;

			clawPauseTimer -= dt;
			if (clawPauseTimer <= 0) {
				grabbedObject = checkGrab();

				clawState = "pause_closed";
				clawFrameIndex = grabbedObject ? 2 : 1;
				clawPauseTimer = 500; // 0.5 sec
			}
		}

		// --- Pause closed claw ---
		if (clawState === "pause_closed") {
			clawPauseTimer -= dt;

			if (clawPauseTimer <= 0) {
				clawState = "lifting";
			}
		}

		// --- Lifting ---
		if (clawState === "lifting") {
			clawY -= clawSpeed;

			if (grabbedObject) {
				grabbedObject.y = clawY + 40;
				grabbedObject.x = clawX - grabbedObject.w / 2;
			}

			if (clawY <= 0) {
				evaluateGrab();
			}
		}
	}


    // --- Center-based grab detection ---
    function checkGrab() {
        const clawCenterX = clawX;
        const clawCenterY = clawY + 60;

        let closest = null;
        let closestDist = Infinity;

        for (let obj of objects) {
            const objCenterX = obj.x + obj.w / 2;
            const objCenterY = obj.y + obj.h / 2;

            const dx = objCenterX - clawCenterX;
            const dy = objCenterY - clawCenterY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < closestDist) {
                closestDist = dist;
                closest = obj;
            }
        }

        if (closestDist < 35) {
            return closest;
        }

        return null;
    }

    // --- Evaluate grab result ---
    function evaluateGrab() {
        if (!grabbedObject) {
            resultMessage = "You caught nothing.";
        } else {
            switch (grabbedObject.type) {
                case "dust":
                case "sponge":
                    resultMessage = "You caught something but you let it go.";
                    break;

                case "sock":
                case "underwear":
                    resultMessage = "You caught something but not what you wanted.";
                    break;

                case "ball":
                    resultMessage = "You got the ball!";
                    break;
            }
        }

        gameOver = true;
        closeButton.visible = true;
    }

    // --- Draw Everything ---
    function drawAll() {
        drawBackground();
        drawObjects();
        drawClaw();
        drawControlPanel();
        drawResult();
        drawCloseButton();
    }

    // --- Background ---
    function drawBackground() {
        ctx.clearRect(0, 0, W, H);

        if (!bgReady) {
            ctx.fillStyle = "#222";
            ctx.fillRect(0, 0, W, H);
            return;
        }

        ctx.drawImage(bgImg, 0, 0, W, H);
    }

    // --- Objects ---
    function drawObjects() {
        for (let obj of objects) {
            ctx.drawImage(obj.img, obj.x, obj.y, obj.w, obj.h);
        }
    }

    // --- Claw (animated from sprite sheet, scaled) ---
    function drawClaw() {
        const frame = clawFrames[clawFrameIndex];

        ctx.drawImage(
            clawSheet,
            frame.sx, frame.sy,              // source X,Y
            frame.w / CLAW_SCALE,            // original width
            frame.h / CLAW_SCALE,            // original height
            clawX - frame.w / 2,             // center horizontally
            clawY,                           // draw at clawY
            frame.w, frame.h                 // scaled width/height
        );
    }

    // --- Control panel ---
    function drawControlPanel() {
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        // Panel anchored to the right side
		const PANEL_WIDTH = canvasWidth * 0.30;
		const PANEL_X = canvasWidth - PANEL_WIDTH;
		
		ctx.fillStyle = "rgba(0,0,0,0.4)";
		ctx.fillRect(PANEL_X, 0, PANEL_WIDTH, canvasHeight);
		
		// Text
		ctx.fillStyle = "white";
		ctx.font = "18px Arial";
		ctx.textAlign = "center";
		ctx.fillText("Press the button", PANEL_X + PANEL_WIDTH / 2, 60);
		ctx.fillText("to catch the ball.", PANEL_X + PANEL_WIDTH / 2, 80);
		
		// Fetch button
		if (fetchButton.visible) {
		    fetchButton.x = PANEL_X + PANEL_WIDTH * 0.15;
		    fetchButton.y = canvasHeight * 0.45;
		    fetchButton.width = PANEL_WIDTH * 0.70;
		    fetchButton.height = 40;
		
		    ctx.fillStyle = "#222";
		    ctx.fillRect(fetchButton.x, fetchButton.y, fetchButton.width, fetchButton.height);
		
		    ctx.strokeStyle = "white";
		    ctx.lineWidth = 2;
		    ctx.strokeRect(fetchButton.x, fetchButton.y, fetchButton.width, fetchButton.height);
		
		    ctx.fillStyle = "white";
		    ctx.font = "20px Arial";
		    ctx.textAlign = "center";
		    ctx.fillText("Fetch!", fetchButton.x + fetchButton.width / 2, fetchButton.y + 27);
		}
    }

    // --- Result message ---
    function drawResult() {
        if (!gameOver) return;

        ctx.fillStyle = "white";
        ctx.font = "28px Arial";
        ctx.textAlign = "center";
        ctx.fillText(resultMessage, W / 2, H / 2);
    }

    // --- Close button ---
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

    // --- Close button click ---
    canvas.addEventListener("click", (e) => {
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
        window.clawGameActive = false;
		
        window.MiniGameManager.closeWindow();
        MenuLock(false);
    });
}
