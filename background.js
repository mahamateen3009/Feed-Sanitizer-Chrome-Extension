let isDeleting = false;
let queue = [];
let activeTabId = null;


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "startBackgroundNuke") {
        queue = message.itemsToNuke;
        activeTabId = message.tabId;

        if (!isDeleting) {
            isDeleting = true;
            processQueue();
        }
        sendResponse({ status: "Engine executing loop in background" });
    }
});

async function processQueue() {
    while (queue.length > 0) {
        const targetId = queue.shift();


        try {
            await chrome.tabs.sendMessage(activeTabId, { action: "deleteTargetItem", targetId: targetId });
        } catch (err) {
            console.log("Tab inactive or closed, pausing execution:", err);
            isDeleting = false;
            return;
        }


        const result = await chrome.storage.local.get(["currentHistory"]);
        if (result.currentHistory) {
            let updatedHistory = result.currentHistory.filter(item => item.id !== targetId);
            await chrome.storage.local.set({ currentHistory: updatedHistory });
        }

       
        await new Promise(resolve => setTimeout(resolve, 2500));
    }

    isDeleting = false;
}
