// --- Dynamic Two-Phase Menu System (single JS file) ---

// Create wrapper
const menuWrapper = document.createElement("div");
menuWrapper.id = "menuWrapper";
document.body.appendChild(menuWrapper);

// Toggle button
const toggle = document.createElement("button");
toggle.id = "menuToggle";
toggle.textContent = "▼";
menuWrapper.appendChild(toggle);

// Panel
const panel = document.createElement("div");
panel.id = "menuPanel";
menuWrapper.appendChild(panel);

// "No actions" message
const emptyMessage = document.createElement("div");
emptyMessage.id = "emptyMessage";
emptyMessage.textContent = "No possible actions";
panel.appendChild(emptyMessage);

// Inject CSS
const style = document.createElement("style");
style.textContent = `
  :root {
    color-scheme: light dark;
  }

  #menuWrapper {
    position: absolute;
    top: 0px;
    left: 0px;
    font-family: sans-serif;
  }

  #menuToggle {
    width: 30px;
    height: 30px;
    font-size: 20px;
    cursor: pointer;

    background: ButtonFace;
    color: ButtonText;
    border: 1px solid ButtonBorder;
    border-radius: 4px;
  }

  #menuPanel {
    overflow: hidden;
    background: Canvas;
    color: CanvasText;
    padding: 5px;
    border-radius: 6px;
    border: 1px solid ButtonBorder;

    width: 0;
    height: 0;

    transition:
      width 0.5s ease,
      height 0.5s ease;

    white-space: nowrap;
    opacity: 0;
  }

  #emptyMessage {
    padding: 6px 10px;
    font-style: italic;
    opacity: 0.7;
  }

  .menuButton {
    display: inline-block;
    margin: 5px;
    padding: 6px 14px;
    cursor: pointer;

    background: ButtonFace;
    color: ButtonText;
    border: 1px solid ButtonBorder;
    border-radius: 4px;

    transition: background 0.2s ease;
  }

  .menuButton:hover {
    background: Highlight;
    color: HighlightText;
  }
`;
document.head.appendChild(style);

// Registry
const buttonRegistry = {};

// Track whether the panel is visually open
let panelVisible = false;

// Show/hide empty message
function updateEmptyMessage() {
  const hasButtons = Object.keys(buttonRegistry).length > 0;
  emptyMessage.style.display = hasButtons ? "none" : "block";
}

// Compute natural size WITHOUT animating
function computeNaturalSize() {
  const prevWidth = panel.style.width;
  const prevHeight = panel.style.height;
  const prevTransition = panel.style.transition;

  panel.style.transition = "none";
  panel.style.width = "auto";
  panel.style.height = "auto";

  const rect = panel.getBoundingClientRect();
  const natural = { width: rect.width, height: rect.height };

  panel.style.width = prevWidth;
  panel.style.height = prevHeight;
  panel.style.transition = prevTransition;

  return natural;
}

// Animate open
function animateOpen() {
  const natural = computeNaturalSize();

  if (natural.width === 0 || natural.height === 0) {
    panel.style.width = "0";
    panel.style.height = "0";
    panel.style.opacity = "0";
    return;
  }

  panel.style.opacity = "1";

  // If panel was CLOSED → animate from 0
  if (!panelVisible) {
    panel.style.transition = "none";
    panel.style.width = "0";
    panel.style.height = "0";
    panel.offsetWidth; // force reflow
    panel.style.transition = "width 0.5s ease, height 0.5s ease";
  }

  // If panel was OPEN → animate from current size
  else {
    panel.style.transition = "width 0.5s ease, height 0.5s ease";
  }

  // Animate width
  panel.style.width = natural.width + "px";

  // Animate height
  setTimeout(() => {
    panel.style.height = natural.height + "px";
    panelVisible = true; // mark as open
  }, 500);
}

// Animate close
function animateClose() {
  panel.style.height = "0";

  setTimeout(() => {
    panel.style.width = "0";
  }, 500);

  setTimeout(() => {
    panel.style.opacity = "0";
    panelVisible = false; // mark as closed
  }, 1000);
}

// Toggle logic
let isOpen = false;

toggle.onclick = () => {
  isOpen = !isOpen;
  toggle.textContent = isOpen ? "▲" : "▼";

  if (isOpen) animateOpen();
  else animateClose();
};

// Add or replace button
function AddButton(name, callback) {
  if (buttonRegistry[name]) {
    buttonRegistry[name].remove();
    delete buttonRegistry[name];
  }

  const btn = document.createElement("button");
  btn.className = "menuButton";
  btn.textContent = name;
  btn.onclick = callback;

  panel.appendChild(btn);
  buttonRegistry[name] = btn;

  updateEmptyMessage();

  if (isOpen) animateOpen();
}

// Remove button
function RemoveButton(name) {
  if (!buttonRegistry[name]) return;

  buttonRegistry[name].remove();
  delete buttonRegistry[name];

  updateEmptyMessage();

  if (isOpen) animateOpen();
}
