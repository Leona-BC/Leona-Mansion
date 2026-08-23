class MiniGameManager {
    constructor() {
        this.window = null;
    }

    openWindow(width, height, title) {
        if (this.window) this.window.remove();
    
        const win = document.createElement("div");
        win.id = "MiniGameWindow";
    
        Object.assign(win.style, {
            position: "fixed",
            left: "40px",
            top: "40px",
            transform: "none",
            width: width + "px",
            height: height + "px",
            background: "#222",
            border: "2px solid #555",
            borderRadius: "8px",
            zIndex: "999999",
            display: "flex",
            flexDirection: "column",
            pointerEvents: "auto",
            overflow: "hidden"
        });
    
        // ⭐ HEADER BAR
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
            userSelect: "none",
            flexShrink: "0" // ⭐ prevents collapsing
        });
    
        header.textContent = title;
    
        const closeBtn = document.createElement("div");
        closeBtn.textContent = "✕";
        Object.assign(closeBtn.style, {
            cursor: "pointer",
            padding: "0 6px"
        });
    
        closeBtn.onclick = () => this.closeWindow();
    
        header.appendChild(closeBtn);
        win.appendChild(header);
    
        // ⭐ DRAGGING LOGIC
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;
    
        header.addEventListener("mousedown", (e) => {
            isDragging = true;
            const rect = win.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
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



    closeWindow() {
        if (this.window) {
            this.window.remove();
            this.window = null;
        }
    }
}

window.MiniGameManager = new MiniGameManager();
