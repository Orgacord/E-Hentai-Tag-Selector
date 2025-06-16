// ==UserScript==
// @name         E-Hentai Tag Selector
// @namespace    http://tampermonkey.net/
// @version      4.0.5
// @description  a floating tag selection panel for e-hentai.org search
// @author       Orgacord
// @match        https://e-hentai.org/*
// @match        https://exhentai.org/*
// @grant        none
// ==/UserScript==
 
(function() {
    'use strict';

    window.addEventListener('load', function() {
        let searchInput = document.getElementById("f_search");
        if (!searchInput) return;

        // shit work (maybe there is a better way but fuck it)
        const tags = {
            "male": ["muscular"]
        };
        const checkboxes = {};
        let selectedTagsContainer;
        function syncFromSearchInput() {
            let currentQuery = (searchInput.value || "").trim();
            let savedTags = JSON.parse(localStorage.getItem("selectedTags")) || [];
            let savedQuery = savedTags.join(" ").trim();

            // Check if we are on a tag page (e.g. /tag/female:anal)
            if (currentQuery === "" && window.location.pathname.startsWith("/tag/")) {
                let pathParts = window.location.pathname.split('/tag/')[1].split(':');
                if (pathParts.length === 2) {
                    let category = pathParts[0];
                    let tag = pathParts[1];
                    currentQuery = `${category}:${tag}`;
                }
            }

            if (currentQuery !== savedQuery) {
                Object.keys(checkboxes).forEach(key => {
                    let checkbox = checkboxes[key];
                    let negativeCheckbox = checkbox.nextSibling;
                    checkbox.checked = false;
                    negativeCheckbox.checked = false;

                    localStorage.removeItem(checkbox.dataset.category + ":" + checkbox.value);
                    localStorage.removeItem("negative:" + checkbox.dataset.category + ":" + checkbox.value);
                });

                if (currentQuery !== "") {
                    let tagStrings = currentQuery.split(/\s+/); // Split by spaces to get tags
                    tagStrings.forEach(tagStr => {
                        let isNegative = tagStr.startsWith("-");
                        let cleaned = tagStr.replace("-", "");
                        let [category, ...tagParts] = cleaned.split(":");
                        let tags = tagParts.join(":").split(","); // handle multiple tags in a category

                        tags.forEach(tag => {
                            let key = `${category}:${tag}`;
                            if (checkboxes[key]) {
                                if (isNegative) {
                                    checkboxes[key].nextSibling.checked = true;
                                    localStorage.setItem("negative:" + category + ":" + tag, "true");
                                } else {
                                    checkboxes[key].checked = true;
                                    localStorage.setItem(category + ":" + tag, "true");
                                }
                            }
                        });
                    });

                    localStorage.setItem("selectedTags", JSON.stringify(tagStrings));
                } else {
                    localStorage.removeItem("selectedTags");
                }

                updateSearchInput();
            }
        }

        // UI panel
        const panel = document.createElement("div");
        panel.style.position = "fixed";
        panel.style.top = "50px";
        panel.style.right = "10px";
        panel.style.width = "300px";
        panel.style.background = "#282c34";
        panel.style.color = "white";
        panel.style.padding = "12px";
        panel.style.borderRadius = "12px";
        panel.style.boxShadow = "0px 5px 15px rgba(0, 0, 0, 0.6)";
        panel.style.zIndex = "9999";
        panel.style.fontSize = "12px";
        panel.style.display = "flex";
        panel.style.flexDirection = "column";
        panel.style.height = "900px";

        const searchBox = document.createElement("input");
        searchBox.type = "text";
        searchBox.placeholder = "Search tags...";
        searchBox.style.marginBottom = "12px";
        searchBox.style.padding = "10px";
        searchBox.style.fontSize = "12px";
        searchBox.style.border = "none";
        searchBox.style.borderRadius = "8px";
        searchBox.style.background = "#444";
        searchBox.style.color = "white";
        panel.appendChild(searchBox);

        const scrollContainer = document.createElement("div");
        scrollContainer.style.maxHeight = "460px";
        scrollContainer.style.overflowY = "auto";
        scrollContainer.style.padding = "5px";
        scrollContainer.style.borderRadius = "8px";
        scrollContainer.style.background = "#333";
        scrollContainer.style.marginBottom = "12px";

Object.keys(tags).forEach(category => {
    const catTitle = document.createElement("div");
    catTitle.innerText = category.toUpperCase();
    catTitle.style.fontWeight = "bold";
    catTitle.style.marginTop = "12px";
    catTitle.style.marginBottom = "5px";
    catTitle.style.padding = "6px";
    catTitle.style.background = "#444";
    catTitle.style.borderRadius = "6px";
    catTitle.style.textAlign = "center";
    catTitle.style.fontSize = "13px";
    catTitle.style.cursor = "pointer";
    catTitle.style.userSelect = "none";

    let isVisible = true;
    catTitle.addEventListener("click", function () {
        isVisible = !isVisible;
        localStorage.setItem(`${category}-collapsed`, isVisible ? "false" : "true");
        tagContainer.style.display = isVisible ? "grid" : "none";
    });
    scrollContainer.appendChild(catTitle);

    const tagContainer = document.createElement("div");
    tagContainer.style.display = "grid";
    tagContainer.style.gap = "6px";

    tags[category].sort().forEach(tag => {
        const label = document.createElement("label");
        label.style.display = "flex";
        label.style.alignItems = "center";
        label.style.padding = "8px";
        label.style.borderRadius = "6px";
        label.style.cursor = "pointer";
        label.style.transition = "background 0.2s ease-in-out";
        label.style.background = "#222234";

        label.onmouseover = () => (label.style.background = "#44446b");
        label.onmouseout = () => (label.style.background = "#222234");

        // Create the pin button
        const pinBtn = document.createElement("button");
        pinBtn.classList.add("pin-btn");
        pinBtn.innerText = "☆";
        pinBtn.style.fontSize = "10px";
        pinBtn.style.padding = "4px 8px";
        pinBtn.style.border = "none";
        pinBtn.style.borderRadius = "8px";
        pinBtn.style.backgroundColor = "#716c63";
        pinBtn.style.color = "white";
        pinBtn.style.cursor = "pointer";
        pinBtn.style.marginLeft = "8px";

        // Check if this tag is pinned and update the button's style accordingly
        if (localStorage.getItem(`pinned:${category}:${tag}`)) {
            pinBtn.style.backgroundColor = "#2ecc71";
            pinBtn.innerText = "⭐";
        }

        pinBtn.addEventListener("click", () => {
            const pinKey = `pinned:${category}:${tag}`;
            const isPinned = localStorage.getItem(pinKey);

            if (isPinned) {
                localStorage.removeItem(pinKey);
                pinBtn.style.backgroundColor = "#716c63";
                pinBtn.innerText = "☆";
            } else {
                localStorage.setItem(pinKey, "true");
                pinBtn.style.backgroundColor = "#2ecc71";
                pinBtn.innerText = "⭐";
            }

            updatePinnedTags();
        });

        label.appendChild(pinBtn);

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = tag;
        checkbox.dataset.category = category;
        checkboxes[category + ":" + tag] = checkbox;

        const negativeCheckbox = document.createElement("input");
        negativeCheckbox.type = "checkbox";
        negativeCheckbox.style.marginLeft = "10px";

        if (localStorage.getItem(category + ":" + tag) === "true") {
            checkbox.checked = true;
        }
        if (localStorage.getItem("negative:" + category + ":" + tag) === "true") {
            negativeCheckbox.checked = true;
        }

        label.appendChild(checkbox);
        label.appendChild(negativeCheckbox);

        const text = document.createElement("span");
        text.innerText = " " + tag;
        text.style.marginLeft = "8px";
        text.style.fontSize = "13px";
        label.appendChild(text);

        tagContainer.appendChild(label);

        checkbox.addEventListener("change", () => {
            localStorage.setItem(category + ":" + tag, checkbox.checked);
            updateSearchInput();
        });

        negativeCheckbox.addEventListener("change", () => {
            localStorage.setItem("negative:" + category + ":" + tag, negativeCheckbox.checked);
            updateSearchInput();
        });
    });

    scrollContainer.appendChild(tagContainer);
});


        panel.appendChild(scrollContainer);

        selectedTagsContainer = document.createElement("div");
        selectedTagsContainer.style.maxHeight = "80px";
        selectedTagsContainer.style.overflowY = "auto";
        selectedTagsContainer.style.padding = "8px";
        selectedTagsContainer.style.background = "#2b2b3a";
        selectedTagsContainer.style.borderRadius = "8px";
        selectedTagsContainer.style.marginBottom = "10px";
        panel.appendChild(selectedTagsContainer);

        const buttonsContainer = document.createElement("div");
        buttonsContainer.style.display = "flex";
        buttonsContainer.style.justifyContent = "space-between";
        buttonsContainer.style.marginTop = "10px";
        buttonsContainer.style.width = "100%";
        const clearBtn = document.createElement("button");
        clearBtn.innerText = "Clear All";
        clearBtn.style.marginTop = "10px";
        clearBtn.style.width = "100%";
        clearBtn.style.background = "#d9534f";
        clearBtn.style.padding = "10px";
        clearBtn.style.cursor = "pointer";
        clearBtn.style.fontWeight = "bold";

        clearBtn.onmouseover = () => (clearBtn.style.background = "#c9302c");
        clearBtn.onmouseout = () => (clearBtn.style.background = "#d9534f");

        clearBtn.addEventListener("click", () => {
            Object.keys(checkboxes).forEach(key => {
                let checkbox = checkboxes[key];
                let negativeCheckbox = checkbox.nextSibling;
                checkbox.checked = false;
                negativeCheckbox.checked = false;
                localStorage.removeItem(checkbox.dataset.category + ":" + checkbox.value);
                localStorage.removeItem("negative:" + checkbox.dataset.category + ":" + checkbox.value);
            });
            localStorage.removeItem("selectedTags");
            updateSearchInput();
        });

        const applyBtn = document.createElement("button");
        applyBtn.innerText = "Apply Search";
        applyBtn.style.marginTop = "10px";
        applyBtn.style.width = "100%";
        applyBtn.style.background = "#5cb85c";
        applyBtn.style.padding = "10px";
        applyBtn.style.cursor = "pointer";
        applyBtn.style.fontWeight = "bold";

        applyBtn.onmouseover = () => (applyBtn.style.background = "#4cae4c");
        applyBtn.onmouseout = () => (applyBtn.style.background = "#5cb85c");

        applyBtn.addEventListener("click", () => {
            updateSearchInput();
            const form = searchInput.closest("form");
            if (form) form.submit();
        });

        buttonsContainer.appendChild(clearBtn);
        buttonsContainer.appendChild(applyBtn);
        panel.appendChild(buttonsContainer);

        document.body.appendChild(panel);

        function updateSearchInput() {
            let selectedTags = {};
            let negativeTags = {};
            let selectedTagsText = [];


            Object.keys(checkboxes).forEach(key => {
                let checkbox = checkboxes[key];
                let category = checkbox.dataset.category;
                let tag = checkbox.value;
                let negativeCheckbox = checkbox.nextSibling;

                if (!selectedTags[category]) selectedTags[category] = [];
                if (!negativeTags[category]) negativeTags[category] = [];

                if (checkbox.checked) {
                    selectedTags[category].push(tag);
                    selectedTagsText.push(`${category}:${tag}`);
                }
                if (negativeCheckbox && negativeCheckbox.checked) {
                    negativeTags[category].push(tag);
                    selectedTagsText.push(`-${category}:${tag}`);
                }
            });

            localStorage.setItem("selectedTags", JSON.stringify(selectedTagsText));

            let queryParts = [];
            Object.keys(selectedTags).forEach(category => {
                if (selectedTags[category].length > 0) {
                    queryParts.push(`${category}:${selectedTags[category].join(",")}`);
                }
            });
            Object.keys(negativeTags).forEach(category => {
                if (negativeTags[category].length > 0) {
                    queryParts.push(`-${category}:${negativeTags[category].join(",")}`);
                }
            });

            selectedTagsContainer.innerHTML = selectedTagsText.length > 0 ? selectedTagsText.join(", ") : "No tags selected";
            searchInput.value = queryParts.join(" ");
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Filter tags by search
        searchBox.addEventListener("input", () => {
            let filterText = searchBox.value.toLowerCase();
            Object.values(checkboxes).forEach(checkbox => {
                let label = checkbox.parentNode;
                let tagText = label.textContent.toLowerCase();
                label.style.display = tagText.includes(filterText) ? "flex" : "none";
            });
        });
        const bookmarkLabel = document.createElement("label");
        bookmarkLabel.innerText = "Bookmarks:";
        bookmarkLabel.style.marginTop = "10px";
        bookmarkLabel.style.marginBottom = "5px";
        panel.appendChild(bookmarkLabel);

        const bookmarkSelect = document.createElement("select");
        bookmarkSelect.style.width = "100%";
        bookmarkSelect.style.marginBottom = "8px";
        bookmarkSelect.style.padding = "8px";
        bookmarkSelect.style.borderRadius = "6px";
        bookmarkSelect.style.border = "none";
        bookmarkSelect.style.background = "#444";
        bookmarkSelect.style.color = "white";

        panel.appendChild(bookmarkSelect);

        const bookmarkSaveBtn = document.createElement("button");
        bookmarkSaveBtn.innerText = "Save Bookmark";
        bookmarkSaveBtn.style.marginBottom = "6px";
        bookmarkSaveBtn.style.width = "100%";
        bookmarkSaveBtn.style.background = "#337ab7";
        bookmarkSaveBtn.style.color = "white";
        bookmarkSaveBtn.style.border = "none";
        bookmarkSaveBtn.style.padding = "8px";
        bookmarkSaveBtn.style.borderRadius = "6px";
        bookmarkSaveBtn.style.cursor = "pointer";

        bookmarkSaveBtn.addEventListener("click", () => {
            const name = prompt("Enter a name for this bookmark:");
            if (!name) return;
            let bookmarks = {};
            try {
                bookmarks = JSON.parse(localStorage.getItem("bookmarks")) || {};
            } catch (e) {
                bookmarks = {};
            }
            bookmarks[name] = searchInput.value.trim();
            localStorage.setItem("bookmarks", JSON.stringify(bookmarks));

        });

        panel.appendChild(bookmarkSaveBtn);

        const bookmarkLoadBtn = document.createElement("button");
        bookmarkLoadBtn.innerText = "Load Bookmark";
        bookmarkLoadBtn.style.marginBottom = "6px";
        bookmarkLoadBtn.style.width = "100%";
        bookmarkLoadBtn.style.background = "#5bc0de";
        bookmarkLoadBtn.style.color = "white";
        bookmarkLoadBtn.style.border = "none";
        bookmarkLoadBtn.style.padding = "8px";
        bookmarkLoadBtn.style.borderRadius = "6px";
        bookmarkLoadBtn.style.cursor = "pointer";

        bookmarkLoadBtn.addEventListener("click", () => {
            const value = bookmarkSelect.value;
            if (!value) return;
            searchInput.value = value;
            syncFromSearchInput();
          loadBookmarks();
        });

        panel.appendChild(bookmarkLoadBtn);

        const bookmarkDeleteBtn = document.createElement("button");
        bookmarkDeleteBtn.innerText = "Delete Bookmark";
        bookmarkDeleteBtn.style.marginBottom = "10px";
        bookmarkDeleteBtn.style.width = "100%";
        bookmarkDeleteBtn.style.background = "#d9534f";
        bookmarkDeleteBtn.style.color = "white";
        bookmarkDeleteBtn.style.border = "none";
        bookmarkDeleteBtn.style.padding = "8px";
        bookmarkDeleteBtn.style.borderRadius = "6px";
        bookmarkDeleteBtn.style.cursor = "pointer";

        bookmarkDeleteBtn.addEventListener("click", () => {
        const selectedOption = bookmarkSelect.options[bookmarkSelect.selectedIndex];
        if (!selectedOption) {
            alert("No bookmark selected to delete.");
            return;
        }

        const name = selectedOption.text;

        let bookmarks = {};
        try {
            bookmarks = JSON.parse(localStorage.getItem("bookmarks")) || {};
        } catch (e) {
            bookmarks = {};
        }

        delete bookmarks[name];
        localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
        loadBookmarks();
        bookmarkSelect.selectedIndex = -1;
    });


      panel.appendChild(bookmarkDeleteBtn);
      function loadBookmarks() {
        bookmarkSelect.innerHTML = "";
        const saved = JSON.parse(localStorage.getItem("bookmarks") || "{}");
        Object.entries(saved).forEach(([name, value]) => {
            const opt = document.createElement("option");
            opt.value = value;
            opt.text = name;
            bookmarkSelect.appendChild(opt);
        });
        }
        const importBtn = document.createElement("button");
        importBtn.innerText = "Import Config";
        importBtn.style.marginTop = "6px";
        importBtn.style.width = "100%";
        importBtn.style.background = "#5bc0de";
        importBtn.style.padding = "10px";
        importBtn.style.cursor = "pointer";
        importBtn.style.fontWeight = "bold";

        const exportBtn = document.createElement("button");
        exportBtn.innerText = "Export Config";
        exportBtn.style.marginTop = "6px";
        exportBtn.style.width = "100%";
        exportBtn.style.background = "#337ab7";
        exportBtn.style.padding = "10px";
        exportBtn.style.cursor = "pointer";
        exportBtn.style.fontWeight = "bold";

        const configBtnWrapper = document.createElement("div");
        configBtnWrapper.style.display = "flex";
        configBtnWrapper.style.justifyContent = "space-between";
        configBtnWrapper.style.gap = "8px";
        configBtnWrapper.style.marginTop = "6px";

        importBtn.style.flex = "1";
        exportBtn.style.flex = "1";
        importBtn.style.marginTop = "0";
        exportBtn.style.marginTop = "0";

        configBtnWrapper.appendChild(importBtn);
        configBtnWrapper.appendChild(exportBtn);
        panel.appendChild(configBtnWrapper);
        exportBtn.addEventListener("click", () => {
            const config = {
                selectedTags: JSON.parse(localStorage.getItem("selectedTags")) || [],
                pinnedTags: JSON.parse(localStorage.getItem("pinnedTags")) || [],
                bookmarks: JSON.parse(localStorage.getItem("bookmarks")) || [],
            };

            const configJSON = JSON.stringify(config);
            const blob = new Blob([configJSON], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "config.json";
            link.click();
        });

        importBtn.addEventListener("click", () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.click();

        input.addEventListener("change", function () {
            const file = input.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    try {
                        const config = JSON.parse(event.target.result);

                        // Restore selected tags
                        localStorage.setItem("selectedTags", JSON.stringify(config.selectedTags));
                        config.selectedTags.forEach(tag => {
    					const isNegative = tag.startsWith("-");
    					const cleanedTag = isNegative ? tag.slice(1) : tag;
    					const [category, ...tagParts] = cleanedTag.split(":");
    					const tagName = tagParts.join(":");
    					const checkbox = checkboxes[category + ":" + tagName];
    					if (checkbox) {
        					if (isNegative) {
            					checkbox.nextSibling.checked = true;
            					localStorage.setItem("negative:" + category + ":" + tagName, "true");
        					} else {
            					checkbox.checked = true;
            					localStorage.setItem(category + ":" + tagName, "true");
        					}
    					}
					});
					

                        // Restore pinned tags
                        config.pinnedTags.forEach(tag => {
                        const [category, ...tagParts] = tag.split(":");
                        const tagName = tagParts.join(":");
                        const pinKey = `pinned:${category}:${tagName}`;
                        localStorage.setItem(pinKey, "true");
                        const checkbox = checkboxes[category + ":" + tagName];
                        if (checkbox) {
                            const pinBtn = checkbox.parentNode.querySelector(".pin-btn");
                            if (pinBtn) {
                                pinBtn.style.backgroundColor = "#2ecc71";
                                pinBtn.innerText = "⭐";
                            }
                        }
                    });

                        // Restore bookmarks
                        localStorage.setItem("bookmarks", JSON.stringify(config.bookmarks));

                        alert("Configuration imported successfully!");
                    } catch (error) {
                        alert("Failed to import configuration. Please ensure the file is valid.");
                    }
                };
                reader.readAsText(file);
            }
        });
    });

        syncFromSearchInput();
        window.addEventListener("popstate", syncFromSearchInput);
        loadBookmarks();
    });
})();




