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
	Canvas,
} from "obsidian";

export default class BetterCanvas extends Plugin {
	isActive: boolean = false;
	async onload() {
		this.isActive = true;
		this.registerCommands();
	}

	onunload() {
		this.isActive = false;
		this.app.workspace;
	}

	registerCommands() {
		this.app.workspace.on("editor-menu", (menu: Menu, editor: Editor) => {
			if (!this.isActive) return;
			const canvasLeaf = this.app.workspace.getLeavesOfType("canvas");
			if (canvasLeaf.length !== 1) {
				return new Notice("more than 1 canvas view");
			}

			//@ts-ignore
			const canvas: Canvas = canvasLeaf[0].view.canvas;
			if (!canvas) return;
			const selected: Set<CanvasNode> = canvas.selection;

			// check if the editor file is the same as the selected file
		});

		this.app.workspace.on("file-open", (file: TFile | null) => {
			if (!this.isActive) return;

			const canvasView = this.app.workspace.getActiveViewOfType(ItemView);
			if (canvasView && canvasView.getViewType() !== "canvas") {
				return;
			}
			if (file?.extension !== "md") return;
			const canvas = this.app.workspace.getLeavesOfType("canvas");
			if (canvas.length !== 1) {
				return new Notice("more than 1 canvas view");
			}

			const markdown = this.app.workspace.getLeavesOfType("markdown");

			if (markdown.length > 1) {
				return new Notice("more than 1 markdown view");
			}
			var leaf: WorkspaceLeaf =
				markdown.length === 0 && file
					? this.app.workspace.splitActiveLeaf("vertical")
					: markdown[0];

			leaf.openFile(file);
			this.app.workspace.setActiveLeaf(leaf, { focus: true });
			return;
		});
	}
}
