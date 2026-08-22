class MiniGameManager {
    constructor() {
        this.gameWrapper = document.createElement("div");
        this.gameWrapper.id = "MiniGameWrapper";

        // Append OUTSIDE BC's UI
        document.body.appendChild(this.gameWrapper);
    }

    getContainer() {
        return this.gameWrapper;
    }
}

window.MiniGameManager = new MiniGameManager();