// ==UserScript==
// @name         Leona's Map Activities
// @namespace    https://gitgud.io/LeonaBC/leonamansion
// @supportURL   https://gitgud.io/LeonaBC/leonamansion
// @version      0.2
// @description  Some fun activities for maps by Leona
// @author       Leona
// @include      /^https:\/\/(www\.)?bondage(projects\.elementfx|-(europe|asia))\.com\/.*/
// @match        https://bondageprojects.elementfx.com/*
// @match        https://bondage-europe.com/*
// @match        https://bondage-asia.com/*
// @match        https://www.bondageprojects.elementfx.com/*
// @match        https://www.bondage-europe.com/*
// @match        https://www.bondage-asia.com/*
// @icon         none
// @grant        none
// @require      https://gitgud.io/LeonaBC/leonamansion@main/Plugins/expand/bcmodsdk.js
// @downloadURL  https://gitgud.io/LeonaBC/leonamansion/Plugins/LeonaMansion.user.js
// @updateURL    https://gitgud.io/LeonaBC/leonamansion/Plugins/LeonaMansion.user.js
// ==/UserScript==

(function() {
    const MOD_VER = "0.1";
    let modApi = null;

    window.LeonaMansion = window.LeonaMansion ?? {};
    if (window.LeonaMansion.RM) return;
    window.LeonaMansion.RM = MOD_VER;

    function DebugMsg(msg) {
        console.error("Leona Mansion Debug: " + msg);
    }
 
    function sendLocalMessage(message) {
        try {
            if (CurrentScreen !== "ChatRoom") {
                console.warn("Not in a chatroom");
                return;
            }
            ChatRoomMessage({
                Content: `<font color="#00FF00">[Leona's Map Activities Beta] ${message}</font>`,
                Type: "LocalMessage",
                Sender: Player.MemberNumber
            });
        } catch (e) {
            console.error("sendLocalMessage failed:", e.message);
        }
    }
    
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    async function mainThread() {
        while(true) {

            UpdateManagerVisibility(false);
            
            if (ChatRoomData != null &&
                ChatRoomData.MapData.Type == "Always") {
    
                if (canFishHere()) {
    
                    if (!buttonRegistry["Start Fishing"]) {
                        AddButton("Start Fishing", () => startFishingGame());
                    }
    
                } else {
                    if (buttonRegistry["Start Fishing"]) {
                        RemoveButton("Start Fishing");
                    }
                }

                if (checkMaidCleanUp()) {
    
                    if (!buttonRegistry["Start Cleaning"]) {
                        AddButton("Start Cleaning", () => startMaidCleanUpGame("https://leona-bc.github.io/Leona-Mansion/Assets/Mansion-BG.png", Math.ceil(CharacterGetClumsiness(Player)), 100, 3));
                    }
    
                } else {
                    if (buttonRegistry["Start Cleaning"]) {
                        RemoveButton("Start Cleaning");
                    }
                }

                if (hasSinkNearby()) {
    
                    if (!buttonRegistry["Clean Dishes"]) {
                        AddButton("Clean Dishes", () => startDishesCleaningMiniGame(Player.ArousalSettings.Progress));
                    }
    
                } else {
                    if (buttonRegistry["Clean Dishes"]) {
                        RemoveButton("Clean Dishes");
                    }
                }
            }

            await sleep(500);
        }
    }
        
    function waitForBcModSdk(timeout = 30000) {
        const start = Date.now();
        return new Promise(resolve => {
            const check = () => {
                if (typeof bcModSdk !== 'undefined' && bcModSdk?.registerMod) {
                    resolve(true);
                } else if (Date.now() - start > timeout) {
                    DebugMsg("waitForBcModSdk failed.");
                    resolve(false);
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }
    
    // Module loading utility
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src + _BCOM_CACHE_BUST;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

   async function loadModules() {
        try {
            await new Promise((resolve, reject) => {
                const btnContainerScript = document.createElement("script");
                btnContainerScript.src = "https://leona-bc.github.io/Leona-Mansion/Plugins/Tools/ButtonsContainer.js";
                btnContainerScript.onload = resolve;
                btnContainerScript.onerror = reject;
                document.head.appendChild(btnContainerScript);
            });

            await new Promise((resolve, reject) => {
                const MGMngrContainerScript = document.createElement("script");
                MGMngrContainerScript.src = "https://leona-bc.github.io/Leona-Mansion/Plugins/Tools/MiniGameManager.js";
                MGMngrContainerScript.onload = resolve;
                MGMngrContainerScript.onerror = reject;
                document.head.appendChild(MGMngrContainerScript);
            });
    
            await new Promise((resolve, reject) => {
                const fishingMiniGamescript = document.createElement("script");
                fishingMiniGamescript.src = "https://leona-bc.github.io/Leona-Mansion/Plugins/MiniGames/Fishing.js";
                fishingMiniGamescript.onload = resolve;
                fishingMiniGamescript.onerror = reject;
                document.head.appendChild(fishingMiniGamescript);
            });
    
            await new Promise((resolve, reject) => {
                const maidMiniGamescript = document.createElement("script");
                maidMiniGamescript.src = "https://leona-bc.github.io/Leona-Mansion/Plugins/MiniGames/MaidCleanUp.js";
                maidMiniGamescript.onload = resolve;
                maidMiniGamescript.onerror = reject;
                document.head.appendChild(maidMiniGamescript);
            });
    
            await new Promise((resolve, reject) => {
                const dishesCleanupMiniGamescript = document.createElement("script");
                dishesCleanupMiniGamescript.src = "https://leona-bc.github.io/Leona-Mansion/Plugins/MiniGames/CleanDishes.js";
                dishesCleanupMiniGamescript.onload = resolve;
                dishesCleanupMiniGamescript.onerror = reject;
                document.head.appendChild(dishesCleanupMiniGamescript);
            });
    
            DebugMsg("loadModules Load successful.");
        } catch (error) {
            DebugMsg("loadModules Load failed.");
        }
    }

    async function initializeModApi() {
        const success = await waitForBcModSdk();
        if (!success) {
            DebugMsg("initializeModApi failed.");
            return null;
        }

        try {
            modApi = bcModSdk.registerMod({
                name: 'Leona Mansion',
                fullName: 'Bondage Club - Leona Mansion',
                version: MOD_VER,
                repository: "https://gitgud.io/LeonaBC/leonamansion",
            });
            DebugMsg("initializeModApi Load successful.");
            return modApi;
        } catch (e) {
            DebugMsg("initializeModApi load failed.");
            return null;
        }
    }
    
    function waitForGame(timeout = 30000) {
        const start = Date.now();
        return new Promise(resolve => {
            const check = () => {
                if (typeof CurrentScreen !== 'undefined' &&
                    typeof DrawImage === 'function' &&
                    typeof DrawButton === 'function' &&
                    typeof MouseIn === 'function' &&
                    typeof Player !== 'undefined' &&
                    Player?.ExtensionSettings &&
                    Player?.OnlineSharedSettings) {
                    resolve(true);
                } else if (Date.now() - start > timeout) {
                    DebugMsg("waitForGame timed out.");
                    resolve(false);
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }

    function isStandingOnWall(px, py) {    
        const tile = ChatRoomMapViewGetTileAtPos(px, py);
        return tile && tile.Type === "Wall";
    }

    function checkMaidCleanUp() {
        const px = Player.Position.X;
        const py = Player.Position.Y;
        if (isStandingOnWall(px, py)) return false;
    
        let floorCount = 0;
    
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
    
                const x = px + dx;
                const y = py + dy;
    
                // Out-of-bounds protection
                if (x < 0 || x >= 40 || y < 0 || y >= 40) continue;
    
                const tile = ChatRoomMapViewGetTileAtPos(x, y);
                if (tile && tile.Type === "Floor") {
                    floorCount++;
    
                    // Early exit: no need to continue
                    if (floorCount >= 4) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    function canFishHere() {
        const px = Player.Position.X;
        const py = Player.Position.Y;
        if (isStandingOnWall(px, py)) return false;
    
        let waterCount = 0;
    
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
    
                const x = px + dx;
                const y = py + dy;
    
                // Out-of-bounds protection
                if (x < 0 || x >= 40 || y < 0 || y >= 40) continue;
    
                const tile = ChatRoomMapViewGetTileAtPos(x, y);
                if (!tile) continue;
    
                // Must be water
                if (tile.Type !== "Water") continue;
    
                // Excluded pool and lava
                if (tile.ID === 2000 || tile.ID === 2090) continue;
    
                waterCount++;
    
                // Early exit: fishing is available
                if (waterCount >= 2) {
                    return true;
                }
            }
        }
        return false;
    }

    function hasSinkNearby() {
        const px = Player.Position.X;
        const py = Player.Position.Y;
        if (isStandingOnWall(px, py)) return false;
    
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
    
                const x = px + dx;
                const y = py + dy;
    
                // Out-of-bounds protection
                if (x < 0 || x >= 40 || y < 0 || y >= 40) continue;
    
                const obj = ChatRoomMapViewGetObjectAtPos(x, y);
                if (!obj) continue;
    
                // Sink ID
                if (obj.ID === 250) {
                    return true; // Early exit: sink found
                }
            }
        }
    
        return false; // No sink in the 3×3 area
    }

    async function initialize() {
        DebugMsg("Initializing.");

        try {
            modApi = await initializeModApi();

            const gameLoaded = await waitForGame();
            if (!gameLoaded) {
                DebugMsg("waitForGame failed.");
                return;
            }

            if (modApi && typeof modApi.onUnload === 'function') {
                modApi.onUnload(() => {
                    if (socketListener && ServerSocket) {
                        try {
                            ServerSocket.off("ChatRoomMessage", socketListener);
                            DebugMsg("Socket loaded...");
                        } catch (e) {
                            DebugMsg("SocketListener failed.");
                        }
                    }
                });
            }

            DebugMsg("Leona's Map Activities mod successfully loaded. Version: " + MOD_VER);

            if (typeof CurrentScreen !== 'undefined' && CurrentScreen === "ChatRoom") {
                sendLocalMessage("Leona's Map Activities addon loaded！");
            }

        } catch (e) {
            DebugMsg("initialize failed." + e.message);
        }
    }

    initialize();
    loadModules().then(() => {
        mainThread();
});
})();
