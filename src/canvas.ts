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
	Side,
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
		this.app.workspace.on("file-open", (file: TFile | null) => {
			if (!this.isActive) return;
			console.log("file-open", file?.extension);

			const canvasView = this.app.workspace.getActiveViewOfType(ItemView);
			if (canvasView && canvasView.getViewType() !== "canvas") {
				return;
			}
			const canvas = this.app.workspace.getLeavesOfType("canvas");
			if (canvas.length !== 1) {
				return new Notice("more than 1 canvas view");
			}

			const markdown = this.app.workspace.getLeavesOfType("markdown");
			console.log("markdown", markdown);
			if (markdown.length > 1) {
				return new Notice("more than 1 markdown view");
			}

			if (markdown.length === 0 && file) {
				const leaf = this.app.workspace.splitActiveLeaf("vertical");
				leaf.openFile(file);
			}

			return;

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
