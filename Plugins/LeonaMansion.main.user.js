// ==UserScript==
// @name         Leona's Mansion
// @namespace    https://gitgud.io/LeonaBC/leonamansion
// @supportURL   https://gitgud.io/LeonaBC/leonamansion
// @version      0.1
// @description  Some fun activities for Leona's Mansion
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
                Content: `<font color="#00FF00">[Leona's Mansion] ${message}</font>`,
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
            if (ChatRoomData != null &&
                ChatRoomData.MapData.Type == "Always" && 
                (ChatRoomData.Name == "Leona's Mansion" || ChatRoomData.Name == "Leona's  Mansion")) {
    
                if ((Player.Position.X >= 30 && Player.Position.X <= 36) &&
                    (Player.Position.Y >= 30 && Player.Position.Y <= 34)) {
    
                    if (document.querySelector(".StartFishing") == null) {
                        AddButton("Start Fishing", () => startFishingGame());
                    }
    
                } else {
                    if (document.querySelector(".StartFishing") != null) {
                        RemoveButton("Start Fishing");
                    }
                }

                if ((Player.Position.X >= 23 && Player.Position.X <= 29) &&
                    (Player.Position.Y >= 24 && Player.Position.Y <= 29)) {
    
                    if (document.querySelector(".StartCleanUp") == null) {
                        AddButton("Start Cleaning", () => startMaidCleanUpGame("https://leona-bc.github.io/Leona-Mansion/Assets/Mansion-BG.png", Math.ceil(CharacterGetClumsiness(Player)), 100));
                    }
    
                } else {
                    if (document.querySelector(".StartCleanUp") != null) {
                        removeMaidCleanButton("Start Cleaning");
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
            const btnContainerScript = document.createElement("script");
            btnContainerScript.src = "https://leona-bc.github.io/Leona-Mansion/Plugins/Tools/ButtonsContainer.js";
            document.head.appendChild(btnContainerScript);

            const fishingMiniGamescript = document.createElement("script");
            fishingMiniGamescript.src = "https://leona-bc.github.io/Leona-Mansion/Plugins/MiniGames/Fishing.js";
            document.head.appendChild(fishingMiniGamescript);

            const maidMiniGamescript = document.createElement("script");
            maidMiniGamescript.src = "https://leona-bc.github.io/Leona-Mansion/Plugins/MiniGames/MaidCleanUp.js";
            document.head.appendChild(maidMiniGamescript);
            
            //await loadScript(baseUrl + 'modules/modInitializer.js');

            DebugMsg("loadModules Load successful.");
        } catch (error) {
            DebugMsg("loadModules Load failed.");
        }
    }

    /*function setupHooks() {
        safeHookFunction("ChatRoomLoad", 0, (args, next) => {
            const result = next(args);
            if (!hookBound) {
                hookBound = true;

                try {
                    if (ServerSocket && typeof ServerSocket.on === 'function') {
                        if (socketListener) {
                            ServerSocket.off("ChatRoomMessage", socketListener);
                        }

                        socketListener = handleMessage;
                        ServerSocket.on("ChatRoomMessage", socketListener);
                        DebugMsg("setupHooks ServerSocket hook successful.");
                    } else {
                        DebugMsg("setupHooks ServerSocket hook unavailable.");
                    }
                } catch (e) {
                        DebugMsg("setupHooks ServerSocket failed.");
                }
            }
            return result;
        });
        safeHookFunction("DrawProcess", 4, (args, next) => {
            const result = next(args);
            try {
               if (typeof CurrentScreen !== 'undefined' && CurrentScreen === 'ChatRoom' && (typeof CurrentCharacter === 'undefined' || CurrentCharacter === null)) {
                    DrawButton(
                        btnX, btnY, size, size,
                        autoEnabled ? "🧹" : "⚙️",
                        autoEnabled ? "Orange" : "Gray", "", "Something, something"
                    );
                }
            } catch (e) {
                DebugMsg("setupHooks DrawProcess failed.");
            }
            return result;
        });
    }*/

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

    async function initialize() {
        DebugMsg("Initializing.");

        try {
            modApi = await initializeModApi();

            const gameLoaded = await waitForGame();
            if (!gameLoaded) {
                DebugMsg("waitForGame failed.");
                return;
            }

            //setupHooks();

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

            DebugMsg("Leona Mansion mod successfully loaded. Version: " + MOD_VER);

            if (typeof CurrentScreen !== 'undefined' && CurrentScreen === "ChatRoom") {
                sendLocalMessage("Leona Mansion addon loaded！");
            }

        } catch (e) {
            DebugMsg("initialize failed." + e.message);
        }
    }

    initialize();
    loadModules();
    mainThread();
})();
