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

    /*window.Liko = window.Liko ?? {};
    if (window.Liko.RM) return;
    window.Liko.RM = MOD_VER;*/

    function DebugMsg(msg) {
        console.error("Leona Mansion Debug: " + msg);
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
            DebugMsg("Load successful.");
            return modApi;
        } catch (e) {
            DebugMsg("Load failed.");
            return null;
        }
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

            setupHooks();

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
            DebugMsg("initialize failed.");
        }
    }

    initialize();
})();