class MiniGameManager {
    constructor() {
        this.window = null;
    }

    openWindow(width, height) {
        // Remove previous window
        if (this.window) this.window.remove();

        // Create popup
        const win = document.createElement("div");
        win.id = "MiniGameWindow";

        // Style it like a real popup
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

        // Add to page
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
