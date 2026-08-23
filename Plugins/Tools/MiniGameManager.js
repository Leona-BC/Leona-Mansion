class MiniGameManager {
    constructor() {
        this.gameWrapper = document.createElement("div");
        this.gameWrapper.id = "MiniGameWrapper";

        // Append OUTSIDE BC's UI
        document.body.appendChild(this.gameWrapper);

        // Force wrapper to escape BC's global transform
        this.gameWrapper.style.position = "fixed";
        this.gameWrapper.style.left = "0";
        this.gameWrapper.style.top = "0";
        this.gameWrapper.style.zIndex = "999999";
        this.gameWrapper.style.transform = "none";
        this.gameWrapper.style.pointerEvents = "none"; // optional
    }

    getContainer() {
        return this.gameWrapper;
    }

    setCanvasSettings(canvas) {
        const tempWidth = document.getElementById("MainCanvas").getBoundingClientRect().width;
        canvas.width = tempWidth;
        canvas.height = tempWidth / 2;
        
        // Force correct display size
        canvas.style.width = tempWidth;
        canvas.style.height = tempWidth / 2;
        
        canvas.style.border = "2px solid #333";
        canvas.style.position = "absolute";
        canvas.style.zIndex = "99999";
        return canvas;
    }
}

window.MiniGameManager = new MiniGameManager();
