// ==UserScript==
// @name         Leona's Mansion
// @namespace    https://gitgud.io/LeonaBC/leonamansion/
// @supportURL   https://gitgud.io/LeonaBC/leonamansion/
// @version      1.0
// @description  Some fun activities for Leona's Mansion
// @author       Leona
// @include      /^https:\/\/(www\.)?bondage(projects\.elementfx|-(europe|asia))\.com\/.*/
// @icon         none
// @grant        none
// @require      https://gitgud.io/LeonaBC/leonamansion@main/Plugins/expand/bcmodsdk.js
// @run-at       document-end
// @downloadURL  https://gitgud.io/LeonaBC/leonamansion/Plugins/LeonaMansion.user.js
// @updateURL    https://gitgud.io/LeonaBC/leonamansion/Plugins/LeonaMansion.user.js
// ==/UserScript==

(function() {
  const n = document.createElement('script');
  n.setAttribute('type', 'text/javascript');
  n.setAttribute('src', 'https://gitgud.io/LeonaBC/leonamansion/-/raw/master/Plugins/LeonaMansion.main.user.js?t=' + Date.now());
  n.onload = function() { n.remove(); };
  document.head.appendChild(n);
})();
