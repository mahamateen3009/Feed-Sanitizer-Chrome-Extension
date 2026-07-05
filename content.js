function scrapeUnifiedData() {
    let items = [];
    const blocks = document.querySelectorAll('div[role="listitem"], .V67aAc, div[data-meta-key]');

    blocks.forEach((block, index) => {
        // Skip hidden/deleted items entirely
        if (block.offsetHeight === 0 || block.offsetWidth === 0) return;

        const parentText = (block.textContent || block.innerText || "").toLowerCase();
        if (parentText.includes("deleting") || parentText.includes("deletion started")) return;

        const link = block.querySelector('a[href*="youtube.com/"]');
        if (!link) return;

        const rawText = link.textContent || link.innerText || "";
        const cleanText = rawText.trim();
        if (!cleanText || cleanText.includes("myactivity.google.com")) return;

        const destinationUrl = link.href || "";

        // Use the actual layout index position as the persistent key
        const secureId = "idx-" + index;
        block.setAttribute('data-ext-id', secureId);

        if (destinationUrl.includes("watch")) {
            const isShort = parentText.includes("shorts") || /\b(0:[0-5][0-9])\b/.test(parentText);
            items.push({ id: secureId, title: cleanText, type: isShort ? 'Short' : 'Video' });
        } else if (destinationUrl.includes("results?search_query=")) {
            let processedSearchText = cleanText;
            if (processedSearchText.startsWith("Search for")) {
                processedSearchText = processedSearchText.replace("Search for", "").trim();
            }
            items.push({ id: secureId, title: processedSearchText, type: 'Search' });
        }
    });

    return items;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getHistory") {
        sendResponse({ data: scrapeUnifiedData() });
        return false;
    }

    if (request.action === "deleteTargetItem") {
        const targetBlock = document.querySelector(`[data-ext-id="${request.targetId}"]`);
        if (targetBlock) {
            const delBtn = targetBlock.querySelector('button[aria-label^="Delete"], button[jsname="V67aAc"], [role="button"]');
            if (delBtn) {
                delBtn.click();
                sendResponse({ status: "success" });
                return false;
            }
        }
        sendResponse({ status: "not_found" });
        return false;
    }

    if (request.action === "triggerPageScroll") {
        window.scrollTo(0, document.body.scrollHeight);
        sendResponse({ status: "scroll_executed" });
        return false;
    }

    return false;
});