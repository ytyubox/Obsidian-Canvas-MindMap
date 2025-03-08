import {
	Plugin,
	Editor,
	MarkdownView,
	ItemView,
	Notice,
	TFile,
	WorkspaceLeaf,
	WorkspaceWindow,
	TAbstractFile,
	Menu,
	Tasks,
	MarkdownFileInfo,
} from "obsidian";

export default class BetterCanvas extends Plugin {
	isActive: boolean = false;
	async onload() {
		console.log("loaded");
		this.isActive = true;
		this.registerCommands();
	}

	onunload() {
		console.log("BetterCanvas: unloaded");
		this.isActive = false;
		this.app.workspace;
	}

	registerCommands() {
		this.app.workspace.on(
			"active-leaf-change",
			(leaf: WorkspaceLeaf | null) => {
				if (!this.isActive) return;
				console.log("active-leaf-change", leaf);
			}
		);

		this.app.workspace.on("file-open", (file: TFile | null) => {
			if (!this.isActive) return;
			console.log("file-open", file);

			const canvasView = this.app.workspace.getActiveViewOfType(ItemView);
			if (canvasView?.getViewType() !== "canvas") {
				return new Notice("not a canvas view");
			}
			console.log("canvas view", canvasView);
			this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
				console.log("leaf", leaf);
			});

			// if (splitViews.length < 2) {
			// 	return new Notice("less than 2 split views");
			// }
			// console.log("split views", splitViews);
			// const activeFile = this.app.workspace.getActiveFile();
			// if (activeFile === null) {
			// 	return new Notice("no active file");
			// }
			// console.log("active file", activeFile);
		});
	}
}
