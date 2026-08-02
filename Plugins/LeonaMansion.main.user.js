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

    function createFishingPopup() {

        // --- Create <style> dynamically ---
        const style = document.createElement("style");
        style.textContent = `
            dialog { width: 400px; height: 300px; padding: 0; border: none; border-radius: 10px; position: relative; overflow: hidden; font-family: Arial, sans-serif; }
            .ring { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 12px; height: 12px; border: 10px solid blue; border-radius: 50%; background: transparent; animation: growCircle 2s linear infinite; opacity: 0.4;pointer-events: none; }
            @keyframes growCircle { from { width: 12px; height: 12px; opacity: 0.8; } to   { width: 1000px; height: 1000px; opacity: 0.2; } }
            #hook { position: absolute; top: 50%; left: 50%; width: 40px; height: 40px; transform: translate(-50%, -50%); animation: hookBobble 2s ease-in-out infinite; z-index: 10; cursor: pointer; }
            @keyframes hookBobble { 0%   { transform: translate(-50%, -50%) translateY(0); } 12%  { transform: translate(-50%, -50%) translateY(10px); } 25%  { transform: translate(-50%, -50%) translateY(0); } 100% { transform: translate(-50%, -50%) translateY(0); } }
            @keyframes hookStruggle { 0%   { transform: translate(-50%, -50%) translateY(0); } 25%  { transform: translate(-50%, -50%) translateY(20px); } 50%  { transform: translate(-50%, -50%) translateY(-10px); } 75%  { transform: translate(-50%, -50%) translateY(15px); } 100% { transform: translate(-50%, -50%) translateY(0); } }
            #message { position: absolute; bottom: 20px; width: 100%; text-align: center; font-size: 20px; z-index: 20; }
            #closeBtn {  position: absolute; top: 10px; right: 10px; z-index: 20; }`;
        document.head.appendChild(style);
        // --- Create dialog ---
        const dlg = document.createElement("dialog");
        dlg.id = "fishingPopup";

        // --- Close button ---
        const closeBtn = document.createElement("button");
        closeBtn.id = "closeBtn";
        closeBtn.textContent = "Close";
        closeBtn.onclick = () => dlg.close();
        dlg.appendChild(closeBtn);

        // --- Base ring ---
        const baseRing = document.createElement("div");
        baseRing.className = "ring";
        baseRing.id = "baseRing";
        dlg.appendChild(baseRing);

        // --- Hook SVG ---
        const hook = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        hook.setAttribute("id", "hook");
        hook.setAttribute("viewBox", "0 0 64 64");

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", "M32 4v28a10 10 0 1 0 10 10");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "#0033cc");
        path.setAttribute("stroke-width", "6");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke-linejoin", "round");

        hook.appendChild(path);
        dlg.appendChild(hook);

        // --- Message area ---
        const msg = document.createElement("div");
        msg.id = "message";
        dlg.appendChild(msg);

        // Add dialog to page
        document.body.appendChild(dlg);
        dlg.showModal();

        // --- Fishing logic ---
        let fishTimeout;
        let reactionTimeout;
        let fishActive = false;
        
        startFishing();

        function startFishing() {
            msg.textContent = "";
            hook.style.animation = "hookBobble 2s ease-in-out infinite";
            baseRing.style.animation = "growCircle 2s linear infinite";
            fishActive = false;

            const waitTime = Math.random() * 10000 + 10000; // 10–20 seconds
            fishTimeout = setTimeout(() => fishBites(), waitTime);
          }

          function fishBites() {
            fishActive = true;

            // Stop calm ring
            baseRing.style.animation = "none";

            // Hook struggles
            hook.style.animation = "hookStruggle 0.3s linear infinite";

            // Extra rings
            addExtraRings();

            // Reaction window
            reactionTimeout = setTimeout(() => {
              if (fishActive) endFishing(false);
            }, 3000);
          }

          function addExtraRings() {
            for (let i = 0; i < 3; i++) {
              const ring = document.createElement("div");
              ring.className = "ring";
              ring.style.animationDuration = (0.8 + Math.random() * 0.4) + "s";
              dlg.appendChild(ring);

              setTimeout(() => ring.remove(), 1500);
            }
          }

          hook.onclick = () => {
            if (fishActive) endFishing(true);
          };

          function endFishing(success) {
            fishActive = false;
            clearTimeout(fishTimeout);
            clearTimeout(reactionTimeout);

            hook.style.animation = "none";
            baseRing.style.animation = "none";

            msg.textContent = success ? "You got a fish!" : "The fish got away...";
          }
    }


    function createButton() {
        const menuButton = document.createElement("button");
        menuButton.classList.add("StartFishing");
        menuButton.innerText = 'Start Fishing';
        document.getElementById("StartFishing").onclick = () => createFishingPopup();
        document.body.append(menuButton);
    }

    function removeButton() {
        document.querySelector(".CleanDishes")?.remove();
    }

    async function mainThread() {
        while(true) {
            if (  ChatRoomData.MapData.Type == "Always" && 
                 (ChatRoomData.Name == "Leona's Mansion" || ChatRoomData.Name == "Leona's  Mansion") ) {
                if ( (Player.Position.X == 30 || Player.Position.X == 31) &&
                     (Player.Position.Y == 30 || Player.Position.Y == 31) ) {
                    if( document.querySelector(".CleanDishes") == null) {
                        createButton();
                    }
                }
                else
                {
                    removeButton();
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
            const baseUrl = 'https://leona-bc.github.io/Leona-Mansion/Plugins/';

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
