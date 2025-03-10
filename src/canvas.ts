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
	CanvasFileNode,
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
				const selection = editor.getSelection();

				console.log("Selection: ", selection.length, "text");
				if (selection.length === 0) return new Notice("no selection");

				const canvasLeaves =
					this.app.workspace.getLeavesOfType("canvas");
				if (canvasLeaves.length !== 1) {
					return new Notice("more than 1 canvas view");
				}

				//@ts-ignore
				const canvas: Canvas = canvasLeaves[0].view.canvas;
				if (!canvas) return;

				const file = this.app.workspace.getActiveFile();
				if (!file) return;

				var node: CanvasNode | null = this.getNodeFromFile(
					canvas,
					file
				);

				// check if the file is the same as the selected file

				//@ts-ignore
				if (file && node.file.path !== file.path) {
					console.log("file is not the same as selected file", node);
					return;
				}

				menu.addItem((item) => {
					item.setIcon("open-in-app");
					item.setTitle(
						"Split to " + (canvas.view.file?.path || "canvas")
					);
					item.onClick(() => {
						// create a new markdown file
						console.log("split to", canvas.view.file?.name);
						// this.createMarkdownFile(selection);
						// this.addChildNode(canvas, node);
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
	private fromCanvasToSplitMarkdown(file: TFile | null) {
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
	}

	private getNodeFromFile(canvas: Canvas, file: TFile): CanvasNode | null {
		var node: CanvasNode | null = null;
		for (const i of canvas.nodes.values()) {
			const fnode = i as CanvasFileNode;
			if (fnode.file === file) {
				node = fnode;
				break;
			}
		}

		if (!node) {
			const selection: Set<CanvasNode> = canvas.selection;

			if (selection.size !== 0) {
				// check if the file is the same as the selected file
				node = Array.from(selection)[0];
			} else {
				if (canvas.nodes.size === 0) return null;

				node = canvas.nodes.values().next().value;
			}
		}
		return node;
	}
}
