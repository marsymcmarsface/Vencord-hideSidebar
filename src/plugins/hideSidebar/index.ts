/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

// NOTE: Replace this selector with the actual container of the channel list.
const CHANNEL_LIST_SELECTOR = "[class*='sidebarList']";

let toggleButton: HTMLElement | null = null;
let hidden = false;
let headerObserver: MutationObserver | null = null;

function addToggleButton() {
    const channelHeader = document.querySelector('[aria-label="Channel header"]') as HTMLElement;
    if (!channelHeader) {
        console.warn("addToggleButton: Channel header not found");
        return;
    }
    // If the button is already attached, exit.
    if (toggleButton && channelHeader.contains(toggleButton)) return;

    if (!toggleButton) {
        toggleButton = document.createElement("div");

        // Find the target icon wrapper to derive class names.
        const targetIconWrapper = channelHeader.querySelector(
            "section div[class*='upperContainer'] div[class*='children'] [class*='iconWrapper']"
        ) as HTMLElement;
        let derivedIconClass = "";
        if (targetIconWrapper) {
            // Copy its class without explicitly writing any suffix.
            toggleButton.className = targetIconWrapper.className;
            const existingIcon = targetIconWrapper.querySelector("svg");
            if (existingIcon) {
                derivedIconClass = existingIcon.className;
            }
        }

        // DON'T TOUCH THE STUFF I ADDED TO THE SVG.
        toggleButton.innerHTML = `
<svg class="${derivedIconClass}" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" height="20" width="20" fill="none" viewBox="0 0 512 512">
  <path fill="currentColor" d="M 448 64 Q 462 64 471 73 L 471 73 L 471 73 Q 480 82 480 96 L 480 416 L 480 416 Q 480 430 471 439 Q 462 448 448 448 L 224 448 L 224 448 L 224 64 L 224 64 L 448 64 L 448 64 Z M 64 64 L 192 64 L 64 64 L 192 64 L 192 448 L 192 448 L 64 448 L 64 448 Q 50 448 41 439 Q 32 430 32 416 L 32 96 L 32 96 Q 32 82 41 73 Q 50 64 64 64 L 64 64 Z M 64 32 Q 37 33 19 51 L 19 51 L 19 51 Q 1 69 0 96 L 0 416 L 0 416 Q 1 443 19 461 Q 37 479 64 480 L 448 480 L 448 480 Q 475 479 493 461 Q 511 443 512 416 L 512 96 L 512 96 Q 511 69 493 51 Q 475 33 448 32 L 64 32 L 64 32 Z M 80 96 Q 65 97 64 112 Q 65 127 80 128 L 144 128 L 144 128 Q 159 127 160 112 Q 159 97 144 96 L 80 96 L 80 96 Z M 64 176 Q 65 191 80 192 L 144 192 L 144 192 Q 159 191 160 176 Q 159 161 144 160 L 80 160 L 80 160 Q 65 161 64 176 L 64 176 Z M 80 224 Q 65 225 64 240 Q 65 255 80 256 L 144 256 L 144 256 Q 159 255 160 240 Q 159 225 144 224 L 80 224 L 80 224 Z" />
</svg>
        `;

        Object.assign(toggleButton.style, {
            cursor: "pointer",
            userSelect: "none"
        });

        toggleButton.addEventListener("click", toggleChannelList);
    }

    // Use a selector that targets the toolbar.
    const toolbarTarget = document.querySelector(
        "#app-mount > " +
        "div[class^='appAsidePanelWrapper'] > " +
        "div[class^='notAppAsidePanel'] > " +
        "div[class^='app'] > div > " +
        "div[class^='layers'] > div > div > div > " +
        "div[class^='content'] > " +
        "div[class^='page'] > div > div > " +
        "div[class^='subtitleContainer'] > section > " +
        "div > div[class*='toolbar'] > div:nth-child(1)"
    ) as HTMLElement;

    if (toolbarTarget && toolbarTarget.parentElement) {
        toolbarTarget.parentElement.insertBefore(toggleButton, toolbarTarget);
    } else {
        channelHeader.prepend(toggleButton);
    }
    console.log("Toggle button added to toolbar area");

}

function removeToggleButton() {
    if (toggleButton) {
        toggleButton.removeEventListener("click", toggleChannelList);
        toggleButton.parentElement?.removeChild(toggleButton);
        toggleButton = null;
        console.log("Toggle button removed");
    }
}

function toggleChannelList() {
    const container = document.querySelector(CHANNEL_LIST_SELECTOR) as HTMLElement;
    const userArea = document.querySelector('[aria-label="User area"]') as HTMLElement;
    if (!container) {
        console.warn("toggleChannelList: channel list container not found");
        return;
    }
    hidden = !hidden;
    container.style.display = hidden ? "none" : "";
    if (userArea) {
        userArea.style.display = hidden ? "none" : "";
    }
    console.log("Channel list and user area display set to", container.style.display);
}

function observeChannelHeader() {
    headerObserver = new MutationObserver(() => {
        const channelHeader = document.querySelector('[aria-label="Channel header"]');
        if (channelHeader) {
            // If header exists and the button isn’t attached, add it.
            if (!toggleButton || !channelHeader.contains(toggleButton)) {
                console.log("New channel header detected; attaching toggle button");
                addToggleButton();
            }
        } else {
            // If no channel header is present, ensure the channel list and user area are visible.
            console.log("No channel header; ensuring channel list and user area are visible");
            const container = document.querySelector(CHANNEL_LIST_SELECTOR) as HTMLElement;
            const userArea = document.querySelector('[aria-label="User area"]') as HTMLElement;
            if (container) {
                container.style.display = "";
            }
            if (userArea) {
                userArea.style.display = "";
            }
            // Optionally, remove the toggle button if it exists.
            removeToggleButton();
        }
    });
    headerObserver.observe(document.body, { childList: true, subtree: true });
}

export default definePlugin({
    name: "hideSidebar",
    description: "Adds a button to the toolbar that lets you hide or show the sidebar.",
    authors: [Devs.Marsy],
    start() {
        console.log("hideChannelList plugin started");
        addToggleButton();
        observeChannelHeader();
    },
    stop() {
        if (headerObserver) {
            headerObserver.disconnect();
            headerObserver = null;
        }
        removeToggleButton();
        const container = document.querySelector(CHANNEL_LIST_SELECTOR) as HTMLElement;
        if (container) {
            container.style.display = "";
        }
        console.log("hideChannelList plugin stopped");
    }
});
