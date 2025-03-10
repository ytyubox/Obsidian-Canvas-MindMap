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
	}

	registerCommands() {
		this.editormenu = this.app.workspace.on(
			"editor-menu",
			(menu: Menu, editor: Editor) => {
				if (!this.isActive) return;
				console.log(
					"Selection: ",
					editor.getSelection().length,
					"text"
				);
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
				console.log("canvas", canvas.nodes);
				const fileNode = Array.from(canvas.nodes.values()).map(
					(node) => node.filePath?
				);

				const selection: Set<CanvasNode> = canvas.selection;

				if (selection.size === 0) {
					return;
				}
				// check if the file is the same as the selected file
				const selected = Array.from(selection)[0];
				const file = this.app.workspace.getActiveFile();
				if (!file) return;
				//@ts-ignore
				if (file && selected.file.path !== file.path) {
					console.log("file is not the same as selected file");
					return;
				}
				menu.addItem((item) => {
					item.setIcon("open-in-app");
					item.onClick(() => {
						// create a new markdown file
						console.log("split to", canvas.view.file?.name);
						const currentNode = this.findCurrentNode(
							canvas,
							file.path
						);
					});
				});
			}
		);

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
	findCurrentNode(canvas: Canvas, path: string): CanvasNode | null {
		const nodes = Array.from(canvas.nodes.values());
		//@ts-ignore
		const node = nodes.find((node) => node.file?.path === path);
		if (!node) return null;
		return node;
	}
}
