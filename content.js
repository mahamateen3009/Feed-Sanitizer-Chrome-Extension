function scrapeUnifiedData() {
    let items = [];
    let counter = 0;


    const blocks = document.querySelectorAll('div[role="listitem"], .V67aAc, div[data-meta-key]');

    blocks.forEach((block) => {

        const link = block.querySelector('a[href*="youtube.com/"]');
        if (!link) return;

        const rawText = link.textContent || link.innerText || "";
        const cleanText = rawText.trim();


        if (!cleanText || cleanText.includes("myactivity.google.com")) return;


        const uniqueId = 'yt-unified-id-' + counter;
        counter++;


        block.setAttribute('data-ext-id', uniqueId);

        const destinationUrl = link.href || "";

        if (destinationUrl.includes("watch")) {

            const parentText = (block.textContent || block.innerText || "").toLowerCase();
            const isShort = parentText.includes("shorts") || /\b(0:[0-5][0-9])\b/.test(parentText);

            if (!items.some(i => i.title === cleanText)) {
                items.push({ id: uniqueId, title: cleanText, type: isShort ? 'Short' : 'Video' });
            }
        } else if (destinationUrl.includes("results?search_query=")) {

            let processedSearchText = cleanText;
            if (processedSearchText.startsWith("Search for")) {
                processedSearchText = processedSearchText.replace("Search for", "").trim();
            }

            if (!items.some(i => i.title === processedSearchText)) {
                items.push({ id: uniqueId, title: processedSearchText, type: 'Search' });
            }
        }
    });

    return items;
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getHistory") {
        sendResponse({ data: scrapeUnifiedData() });
        return false; // Sync handling complete, close channel
    }

    if (request.action === "deleteTargetItem") {
        const targetBlock = document.querySelector(`[data-ext-id="${request.targetId}"]`);
        if (targetBlock) {

            const delBtn = targetBlock.querySelector('button[aria-label^="Delete"], button[jsname="V67aAc"], [role="button"]');
            if (delBtn) {
                delBtn.click();
                sendResponse({ status: "success" });
                return false; // Action handled cleanly
            }
        }
        sendResponse({ status: "not_found" });
        return false;
    }

    return false;
});