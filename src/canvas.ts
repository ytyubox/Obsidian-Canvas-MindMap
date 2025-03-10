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
	CanvasNode,
	EventRef,
} from "obsidian";

export default class BetterCanvas extends Plugin {
	isActive: boolean = false;
	editormenu: EventRef;
	async onload() {
		this.isActive = true;
		this.registerCommands();
	}

	onunload() {
		this.isActive = false;
		this.app.workspace;
	}

	registerCommands() {
		this.registerAllEvents();
		editormenu = this.app.workspace.on("editor-menu", (menu: Menu, editor: Editor) => {
			if (!this.isActive) return;
			console.log("Selection", editor.getSelection());
			if (editor.getSelection().length === 0) {
				return new Notice("no selection");
			}
			const canvasLeaf = this.app.workspace.getLeavesOfType("canvas");
			if (canvasLeaf.length !== 1) {
				return new Notice("more than 1 canvas view");
			}

			//@ts-ignore
			const canvas: Canvas = canvasLeaf[0].view.canvas;
			if (!canvas) return;
			const selection: Set<CanvasNode> = canvas.selection;

			if (selection.size === 0) {
				return;
			}
			// check if the file is the same as the selected file
			const selected = Array.from(selection)[0];
			const file = this.app.workspace.getActiveFile();
			//@ts-ignore
			if (file && selected.file.path !== file.path) {
				console.log("file is not the same as selected file");
				return;
			}
			menu.addItem((item) => {
				item.setTitle("Open in markdown");
				item.setIcon("open-in-app");
				item.onClick(() => {
					// create a new markdown file
					// copy the
				});
			});
		});

		this.app.workspace.on("file-open", (file: TFile | null) => {
			if (!this.isActive) return;
			console.log("file-open", file);

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
	registerAllEvents() {
		this.app.workspace.on("layout-ready", () => {
	}
}
var _file: TFile | null = null;
