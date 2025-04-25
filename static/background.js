// Set up the side panel on extension installation
chrome.runtime.onInstalled.addListener(() => {
	// Set the panel behavior to open on action click
	chrome.sidePanel.setPanelBehavior({
		openPanelOnActionClick: true
	});
});

// Open the side panel when the user clicks on the extension icon
chrome.action.onClicked.addListener((tab) => {
	chrome.sidePanel.open({ windowId: tab.windowId });
});
