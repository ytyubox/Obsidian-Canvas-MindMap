import {
	Canvas,
	CanvasEdge,
	CanvasNode,
	ItemView,
	Notice,
	Plugin,
	requireApiVersion,
	SettingTab,
	TFile,
} from "obsidian";
import { around } from "monkey-around";
import {
	addEdge,
	addNode,
	buildTrees,
	createChildFileNode,
	isWikiLink,
	extractWikiLinkContent,
	random,
	createChildCardNode,
} from "./utils";
import {
	DEFAULT_SETTINGS,
	MindMapSettings,
	MindMapSettingTab,
} from "./mindMapSettings";
import { CanvasEdgeData } from "obsidian/canvas";
import { parseMarkdownToTree, TreeNode } from "./Tree";

const createEdge = async (node1: any, node2: any, canvas: any) => {
	addEdge(
		canvas,
		random(16),
		{
			fromOrTo: "from",
			side: "right",
			node: node1,
		},
		{
			fromOrTo: "to",
			side: "left",
			node: node2,
		}
	);
};

const navigate = (canvas: Canvas, direction: string) => {
	const currentSelection = canvas.selection;
	if (currentSelection.size !== 1) return;

	// Check if the selected node is editing
	if (currentSelection.values().next().value.isEditing) return;

	const selectedItem = currentSelection.values().next().value as CanvasNode;
	const viewportNodes = canvas.getViewportNodes();
	const { x, y, width, height } = selectedItem;

	canvas.deselectAll();

	const isVertical = direction === "top" || direction === "bottom";
	const comparePrimary = isVertical
		? (a: CanvasNode, b: CanvasNode) => a.y - b.y
		: (a: CanvasNode, b: CanvasNode) => a.x - b.x;
	const compareSecondary = isVertical
		? (a: CanvasNode, b: CanvasNode) => a.x - b.x
		: (a: CanvasNode, b: CanvasNode) => a.y - b.y;
	const filterCondition = (node: CanvasNode) => {
		const inRange = isVertical
			? node.x < x + width / 2 && node.x + node.width > x + width / 2
			: node.y < y + height / 2 && node.y + node.height > y + height / 2;
		const directionCondition =
			direction === "top"
				? node.y < y
				: direction === "bottom"
				? node.y > y
				: direction === "left"
				? node.x < x
				: node.x > x;
		return inRange && directionCondition;
	};

	const filteredNodes = viewportNodes.filter(filterCondition);
	const sortedNodes =
		filteredNodes.length > 0
			? filteredNodes.sort(comparePrimary)
			: viewportNodes
					.filter((node: CanvasNode) =>
						direction === "top"
							? node.y < y
							: direction === "bottom"
							? node.y > y
							: direction === "left"
							? node.x < x
							: node.x > x
					)
					.sort(compareSecondary);
	const nextNode = sortedNodes[0];

	if (nextNode) {
		canvas.selectOnly(nextNode);
		canvas.zoomToSelection();
	}

	return nextNode;
};

const createFloatingNode = (canvas: any, direction: string) => {
	let selection = canvas.selection;

	if (selection.size !== 1) return;
	// Check if the selected node is editing
	if (selection.values().next().value.isEditing) return;

	let node = selection.values().next().value;
	let x =
		direction === "left"
			? node.x - node.width - 50
			: direction === "right"
			? node.x + node.width + 50
			: node.x;
	let y =
		direction === "top"
			? node.y - node.height - 100
			: direction === "bottom"
			? node.y + node.height + 100
			: node.y;

	const tempChildNode = addNode(canvas, random(16), {
		x: x,
		y: y,
		width: node.width,
		height: node.height,
		type: "text",
		content: "",
	});

	canvas?.requestSave();

	const currentNode = canvas.nodes?.get(tempChildNode?.id!);
	if (!currentNode) return;

	canvas.selectOnly(currentNode);
	canvas.zoomToSelection();

	setTimeout(() => {
		currentNode.startEditing();
	}, 100);

	return tempChildNode;
};

const childNode = async (canvas: Canvas, parentNode: CanvasNode, y: number) => {
	let tempChildNode = addNode(canvas, random(16), {
		x: parentNode.x + parentNode.width + 200,
		y: y,
		width: parentNode.width,
		height: parentNode.height,
		type: "text",
		content: "",
	});
	await createEdge(parentNode, tempChildNode, canvas);

	canvas.deselectAll();
	const node = canvas.nodes?.get(tempChildNode?.id!);
	if (!node) return;
	canvas.selectOnly(node);

	canvas.requestSave();

	return tempChildNode;
};

const createChildNode = async (canvas: Canvas, ignored: boolean) => {
	if (canvas.selection.size !== 1) return;
	const parentNode = canvas.selection.entries().next().value[1];

	if (parentNode.isEditing && !ignored) return;

	// Calculate the height of all the children nodes
	let wholeHeight = 0;
	let tempChildNode;
	const canvasData = canvas.getData();

	const prevParentEdges = canvasData.edges.filter((item: CanvasEdgeData) => {
		return item.fromNode === parentNode.id && item.toSide === "left";
	});

	if (prevParentEdges.length === 0) {
		tempChildNode = await childNode(canvas, parentNode, parentNode.y);
	} else {
		tempChildNode = await siblingNode(canvas, parentNode, prevParentEdges);
	}

	return tempChildNode;
};

const siblingNode = async (
	canvas: Canvas,
	parentNode: CanvasNode,
	prevParentEdges: CanvasEdgeData[]
) => {
	const allEdges = canvas
		.getEdgesForNode(parentNode)
		.filter((item: CanvasEdge) => {
			return prevParentEdges.some((edge: CanvasEdgeData) => {
				return item.to.node.id === edge.toNode;
			});
		});

	const allNodes = allEdges.map((edge: CanvasEdge) => edge.to.node);
	allNodes.sort((a, b) => a.y - b.y);
	const lastNode = allNodes[allNodes.length - 1];
	canvas.selectOnly(lastNode);
	return await createSiblingNode(canvas, false);
};

const createSiblingNode = async (canvas: Canvas, ignored: boolean) => {
	if (canvas.selection.size !== 1) return;
	const selectedNode = canvas.selection.entries().next().value[1];

	if (selectedNode.isEditing && !ignored) return;

	const incomingEdges = canvas
		.getEdgesForNode(selectedNode)
		.filter((edge: CanvasEdge) => edge.to.node.id === selectedNode.id);
	if (incomingEdges.length === 0) return;
	const parentNode = incomingEdges[0].from.node;

	const newYPosition = selectedNode.y + selectedNode.height / 2 + 110;
	const newChildNode = await childNode(canvas, parentNode, newYPosition);

	const leftSideEdges = canvas
		.getEdgesForNode(parentNode)
		.filter(
			(edge: CanvasEdge) =>
				edge.from.node.id === parentNode.id && edge.to.side === "left"
		);

	let nodes = leftSideEdges.map((edge: CanvasEdge) => edge.to.node);
	let totalHeight = nodes.reduce(
		(acc: number, node: CanvasNode) => acc + node.height + 20,
		0
	);

	nodes.sort((a, b) => a.y - b.y);

	if (nodes.length <= 1) return;
	if (nodes.length > 1 && nodes[0].x === nodes[1]?.x) {
		nodes.forEach((node: CanvasNode, index: number) => {
			const yPos =
				index === 0
					? parentNode.y + parentNode.height / 2 - totalHeight / 2
					: nodes[index - 1].y + nodes[index - 1].height + 20;
			node.moveTo({ x: selectedNode.x, y: yPos });
		});
	}

	canvas.requestSave();
	return newChildNode;
};

export default class CanvasMindMap extends Plugin {
	settings: MindMapSettings;
	settingTab: MindMapSettingTab;

	async onload() {
		await this.registerSettings();
		this.registerCommands();
	}

	onunload() {}

	async registerSettings() {
		this.settingTab = new MindMapSettingTab(this.app, this);
		this.addSettingTab(this.settingTab);
		await this.loadSettings();
	}

	registerCommands() {
		this.addCommand({
			id: "split-card-into-mindmap",
			name: "Split card into mindmap",
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const canvasView =
					this.app.workspace.getActiveViewOfType(ItemView);
				if (canvasView?.getViewType() !== "canvas") {
					return false;
				}
				// If checking is true, we're simply "checking" if the command can be run.
				// If checking is false, then we want to actually perform the operation.
				if (checking) return true;

				// @ts-ignore
				const canvas = canvasView?.canvas;
				const currentSelection = canvas?.selection;

				const currentSelectionItem = currentSelection
					.values()
					.next().value;
				if (currentSelection == undefined)
					return new Notice("no selected card") && false;
				const forest = parseMarkdownToTree(currentSelectionItem.text);
				if (forest.length === 0)
					return new Notice("selected is not a list") && false;

				const nodeGroupHeight =
					(currentSelectionItem.height * 0.6 + 20) * forest.length;
				let direction = -1;
				const nodeGroupY =
					currentSelectionItem.y +
					currentSelectionItem.height / 2 +
					(nodeGroupHeight / 2) * direction;
				let lastYMax = currentSelectionItem.y;
				const addCard = (parentNode: any, node: TreeNode) => {
					node.b.forEach((child, index) => {
						var content = child.a;
						const newNode = createChildCardNode(
							canvas,
							parentNode,
							content,
							"#" + child,
							lastYMax + 20
						);
						if (newNode) {
							let y = newNode.y ?? 0;
							let height = newNode.height ?? 0;
							lastYMax = y + height;
						}

						addCard(newNode, child);
					});
				};

				forest.forEach((item, index) => {
					var content = item.a;
					const newCard = createChildCardNode(
						canvas,
						currentSelectionItem,
						content,
						"#" + item,
						lastYMax + 20
					);
					if (newCard) {
						let y = newCard.y ?? 0;
						let height = newCard.height ?? 0;
						lastYMax = y + height;
					}
					addCard(newCard, item);
				});

				return true;
			},
		});
		this.addCommand({
			id: "split-card-into-grid",
			name: "Split card into grid",
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const canvasView =
					this.app.workspace.getActiveViewOfType(ItemView);
				if (canvasView?.getViewType() !== "canvas") {
					return false;
				}
				// If checking is true, we're simply "checking" if the command can be run.
				// If checking is false, then we want to actually perform the operation.
				if (checking) return true;

				// @ts-ignore
				const canvas = canvasView?.canvas;
				const currentSelection = canvas?.selection;

				const currentSelectionItem = currentSelection
					.values()
					.next().value;
				if (currentSelection == undefined)
					return new Notice("no selected card") && false;
				const forest = parseMarkdownToTree(currentSelectionItem.text);
				if (forest.length === 0)
					return new Notice("selected is not a list") && false;

				const spacing = 10;
				const itemWidth = 200;
				const itemHeight = 100;
				let lastYMax = currentSelectionItem.y;
				let lastxMax =
					currentSelectionItem.x +
					currentSelectionItem.width +
					spacing;
				const flattenCard = forest.flatMap((item) => {
					return [item].concat(item.b);
				});
				const cols = findBestGrid(flattenCard.length);
				console.log(lastxMax, lastYMax);
				flattenCard.forEach((item, index) => {
					// Determine the row and column in the grid for this item
					const col = index % cols;
					const row = Math.floor(index / cols);

					// Calculate the x and y positions based on the column and row, with spacing
					const x = lastxMax + col * (itemWidth + spacing);
					const y = lastYMax + row * (itemHeight + spacing);
					console.log(y);
					// Add the item to the canvas with addNode
					const node = addNode(canvas, random(16), {
						x,
						y,
						width: itemWidth,
						height: itemHeight,
						type: isWikiLink(item.a) ? "file" : "text",
						content: extractWikiLinkContent(item.a) ?? item.a,
						subpath: undefined,
					});

					canvas.requestSave();
				});
				return true;
			},
		});
	}

	public async loadSettings(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
function findBestGrid(numItems: number): number {
	let rows = Math.floor(Math.sqrt(numItems));
	let cols = Math.ceil(numItems / rows);

	// Adjust to find a more balanced grid if necessary
	while (rows * cols < numItems) {
		if (rows <= cols) {
			rows++;
		} else {
			cols++;
		}
	}

	return cols;
}
