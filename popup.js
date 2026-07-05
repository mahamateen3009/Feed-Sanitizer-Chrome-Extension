let localHistoryData = [];
let currentFilter = "All";

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0] || !tabs[0].url.includes("myactivity.google.com/product/youtube")) {
        const container = document.getElementById("videoList");
        if (container) {
            container.innerHTML = "<p style='color:red; text-align:center;'>Error: Open YouTube History page first!</p>";
        }
        return;
    }
    fetchLatestData(tabs[0].id);
});

function fetchLatestData(tabId) {
    chrome.tabs.sendMessage(tabId, { action: "getHistory" }, (response) => {
        if (response && response.data) {
            localHistoryData = response.data;
            chrome.storage.local.set({ currentHistory: localHistoryData });
            applyCurrentFilter();
        }
    });
}

function renderList(items) {
    const container = document.getElementById("videoList");
    if (!container) return;
    container.innerHTML = "";

    if (items.length === 0) {
        container.innerHTML = `<p style='text-align:center; color:#999; font-size:11px;'>No items found in ${currentFilter}.</p>`;
        return;
    }

    items.forEach(item => {
        const div = document.createElement("div");
        div.className = "video-item";

        let tagClass = 'tag-video';
        if (item.type === 'Short') tagClass = 'tag-short';
        if (item.type === 'Search') tagClass = 'tag-search';

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "video-chk";
        checkbox.setAttribute("data-id", item.id);

        const textWrapper = document.createElement("div");
        textWrapper.className = "video-text";

        const tagSpan = document.createElement("span");
        tagSpan.className = `tag ${tagClass}`;
        tagSpan.textContent = item.type.toUpperCase();

        const cleanTitleText = item.title.substring(0, 36) + (item.title.length > 36 ? '...' : '');

        textWrapper.appendChild(tagSpan);
        textWrapper.appendChild(document.createTextNode(` ${cleanTitleText}`));

        div.appendChild(checkbox);
        div.appendChild(textWrapper);
        container.appendChild(div);
    });
}

function applyCurrentFilter() {
    if (currentFilter === "All") renderList(localHistoryData);
    else renderList(localHistoryData.filter(i => i.type === currentFilter));
}


document.getElementById("showAll")?.addEventListener("click", () => { currentFilter = "All"; applyCurrentFilter(); });
document.getElementById("showShorts")?.addEventListener("click", () => { currentFilter = "Short"; applyCurrentFilter(); });
document.getElementById("showVideos")?.addEventListener("click", () => { currentFilter = "Video"; applyCurrentFilter(); });
document.getElementById("showSearches")?.addEventListener("click", () => { currentFilter = "Search"; applyCurrentFilter(); });


document.getElementById("selectAll")?.addEventListener("click", () => {
    document.querySelectorAll(".video-chk").forEach(chk => chk.checked = true);
});
document.getElementById("clearAll")?.addEventListener("click", () => {
    document.querySelectorAll(".video-chk").forEach(chk => chk.checked = false);
});


document.getElementById("loadMoreBtn")?.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const logger = document.getElementById("statusLogger");
        if (logger) logger.textContent = "⏳ Scrolling page downwards...";

        
        chrome.tabs.sendMessage(tabs[0].id, { action: "triggerPageScroll" });

       
        localHistoryData = [];
        chrome.storage.local.set({ currentHistory: [] });

       
        setTimeout(() => {
            fetchLatestData(tabs[0].id);
            if (logger) logger.textContent = "✅ Fresh screen indices mapped!";
        }, 1200);
    });
});


document.getElementById("deleteSelected")?.addEventListener("click", () => {
    const checkboxes = document.querySelectorAll(".video-chk:checked");
    const logger = document.getElementById("statusLogger");

    if (checkboxes.length === 0) return alert("Please check at least one box!");

    const idsToNuke = Array.from(checkboxes).map(chk => chk.getAttribute("data-id"));

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (logger) logger.textContent = `🚀 Deleting ${idsToNuke.length} items sequentially...`;

        chrome.runtime.sendMessage({
            action: "startBackgroundNuke",
            itemsToNuke: idsToNuke,
            tabId: tabs[0].id
        });

        // Instantly wipe them from the panel UI
        localHistoryData = localHistoryData.filter(item => !idsToNuke.includes(item.id));
        chrome.storage.local.set({ currentHistory: localHistoryData });
        applyCurrentFilter();
    });
});
