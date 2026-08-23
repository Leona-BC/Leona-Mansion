openWindow(width, height) {
    if (this.window) this.window.remove();

    const win = document.createElement("div");
    win.id = "MiniGameWindow";

    Object.assign(win.style, {
        position: "fixed",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: width + "px",
        height: height + "px",
        background: "#222",
        border: "2px solid #555",
        borderRadius: "8px",
        zIndex: "999999",
        display: "flex",
        flexDirection: "column",
        pointerEvents: "auto"
    });

    // ⭐ Create draggable header bar
    const header = document.createElement("div");
    Object.assign(header.style, {
        height: "32px",
        background: "#444",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 10px",
        cursor: "move",
        userSelect: "none"
    });

    header.textContent = "Mini-Game";

    // ⭐ Close button
    const closeBtn = document.createElement("div");
    closeBtn.textContent = "✕";
    Object.assign(closeBtn.style, {
        cursor: "pointer",
        padding: "0 6px"
    });

    closeBtn.onclick = () => this.closeWindow();

    header.appendChild(closeBtn);
    win.appendChild(header);

    // ⭐ Dragging logic
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener("mousedown", (e) => {
        isDragging = true;
        offsetX = e.clientX - win.getBoundingClientRect().left;
        offsetY = e.clientY - win.getBoundingClientRect().top;
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        win.style.left = `${e.clientX - offsetX}px`;
        win.style.top = `${e.clientY - offsetY}px`;
        win.style.transform = ""; // remove centering transform once moved
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
    });

    document.body.appendChild(win);
    this.window = win;

    return win;
}
