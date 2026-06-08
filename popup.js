let localHistoryData = [];
let currentFilter = "All";

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0] || !tabs[0].url.includes("myactivity.google.com/product/youtube")) {
        const container = document.getElementById("videoList");
        container.innerHTML = "";
        const errPara = document.createElement("p");
        errPara.style.cssText = "color:red; font-size:12px; text-align:center;";
        errPara.textContent = "Error: Open myactivity.google.com/product/youtube first!";
        container.appendChild(errPara);
        return;
    }

    fetchLatestData(tabs[0].id);
});

function fetchLatestData(tabId) {
    chrome.tabs.sendMessage(tabId, { action: "getHistory" }, (response) => {
        if (response && response.data && response.data.length > 0) {
            localHistoryData = response.data;
            applyCurrentFilter();
        } else {
            const container = document.getElementById("videoList");
            container.innerHTML = "";
            const noDataPara = document.createElement("p");
            noDataPara.style.cssText = "font-size:12px; text-align:center; color:#666;";
            noDataPara.textContent = "No items found on screen. Scroll down on the page and reopen extension.";
            container.appendChild(noDataPara);
        }
    });
}

function renderList(items) {
    const container = document.getElementById("videoList");
    container.innerHTML = "";

    if (items.length === 0) {
        const structuralPara = document.createElement("p");
        structuralPara.style.cssText = "font-size:11px; text-align:center; color:#999;";
        structuralPara.textContent = `No items found in ${currentFilter}.`;
        container.appendChild(structuralPara);
        return;
    }

    items.forEach(item => {
        const div = document.createElement("div");
        div.className = "video-item";
        div.setAttribute('title', item.title);

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


document.getElementById("showAll").addEventListener("click", () => { currentFilter = "All"; applyCurrentFilter(); });
document.getElementById("showShorts").addEventListener("click", () => { currentFilter = "Short"; applyCurrentFilter(); });
document.getElementById("showVideos").addEventListener("click", () => { currentFilter = "Video"; applyCurrentFilter(); });
document.getElementById("showSearches").addEventListener("click", () => { currentFilter = "Search"; applyCurrentFilter(); });


document.getElementById("deleteSelected").addEventListener("click", async () => {
    const checkboxes = document.querySelectorAll(".video-chk:checked");
    const logger = document.getElementById("statusLogger");

    if (checkboxes.length === 0) return alert("Please check at least one box!");

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        logger.textContent = `⏳ Sweeping ${checkboxes.length} records...`;

        for (let chk of checkboxes) {
            const targetId = chk.getAttribute("data-id");
            const matchedItem = localHistoryData.find(i => i.id === targetId);
            const printTitle = matchedItem ? matchedItem.title.substring(0, 18) + "..." : "Record";


            logger.textContent = `❌ Clearing: ${printTitle}`;


            chrome.tabs.sendMessage(tabs[0].id, { action: "deleteTargetItem", targetId: targetId });


            localHistoryData = localHistoryData.filter(item => item.id !== targetId);


            chk.parentElement.remove();


            await new Promise(resolve => setTimeout(resolve, 2500));
        }

        logger.textContent = " Synchronization complete.";
        applyCurrentFilter();
    });
});