import { Canvas, CanvasEdge, CanvasNode, requireApiVersion, TFile } from "obsidian";
import { CanvasData, CanvasEdgeData, CanvasFileData, CanvasNodeData, CanvasTextData } from "obsidian/canvas";

interface edgeT {
	fromOrTo: string;
	side: string,
	node: CanvasNode | CanvasNodeData,
}

interface TreeNode {
	id: string;
	children: TreeNode[];
}

export const random = (e: number) => {
	let t = [];
	for (let n = 0; n < e; n++) {
		t.push((16 * Math.random() | 0).toString(16));
	}
	return t.join("");
};

export const createChildFileNode = (canvas: any, parentNode: any, file: TFile, path: string, y: number) => {
	const node = addNode(
		canvas, random(16),
		{
			x: parentNode.x + parentNode.width + 200,
			y: y,
			width: parentNode.width,
			height: parentNode.height * 0.6,

			type: 'file',
			content: file.path,
			subpath: path,
		}
	);

	addEdge(canvas, random(16), {
		fromOrTo: "from",
		side: "right",
		node: parentNode
	}, {
		fromOrTo: "to",
		side: "left",
		node: <CanvasNodeData>node
	});

	canvas.requestSave();

	return node;
};
function isWikiLink(input: string): boolean {
	// Regex to match a wikilink format: [[content]]
	const wikiLinkRegex = /^\[\[.*?\]\]$/;

	// Test if the input matches the wikilink pattern
	return wikiLinkRegex.test(input);
}
function extractWikiLinkContent(input: string): string | null {
	// Regex to match and capture the content inside [[content]]
	const wikiLinkRegex = /^\[\[(.*?)\]\]$/;

	// Use regex to extract the content inside the brackets
	const match = input.match(wikiLinkRegex);

	// Return the captured content or null if no match
	return match ? match[1] + '.md' : null;
}
export const createChildCardNode = (canvas: any, parentNode: any, content: string, path: string, y: number) => {
	const node = addNode(
		canvas, random(16),
		{
			x: parentNode.x + parentNode.width + 200,
			y: y,
			width: parentNode.width,
			height: parentNode.height * 0.6,
			type: isWikiLink(content) ? 'file' : 'text',
			content: extractWikiLinkContent(content) ?? content,
			subpath: undefined,
		}
	);

	addEdge(canvas, random(16), {
		fromOrTo: "from",
		side: "right",
		node: parentNode
	}, {
		fromOrTo: "to",
		side: "left",
		node: <CanvasNodeData>node
	});

	canvas.requestSave();

	return node;
};


export const addNode = (canvas: Canvas, id: string, {
	x,
	y,
	width,
	height,
	type,
	content,
	subpath,
}: {
	x: number,
	y: number,
	width: number,
	height: number,
	type: 'text' | 'file',
	content: string,
	subpath?: string,
}) => {
	if (!canvas) return;

	const data = canvas.getData();
	if (!data) return;

	const node: Partial<CanvasTextData | CanvasFileData> = {
		"id": id,
		"x": x,
		"y": y,
		"width": width,
		"height": height,
		"type": type,
	};

	switch (type) {
		case 'text':
			node.text = content;
			break;
		case 'file':
			console.log(node)
			node.file = content;
			if (subpath) node.subpath = subpath;
			break;
	}

	canvas.importData(<CanvasData>{
		"nodes": [
			...data.nodes,
			node],
		"edges": data.edges,
	});

	canvas.requestFrame();

	return node;
};

export const addEdge = (canvas: any, edgeID: string, fromEdge: edgeT, toEdge: edgeT) => {
	if (!canvas) return;

	const data = canvas.getData();
	if (!data) return;

	canvas.importData({
		"edges": [
			...data.edges,
			{
				"id": edgeID,
				"fromNode": fromEdge.node.id,
				"fromSide": fromEdge.side,
				"toNode": toEdge.node.id,
				"toSide": toEdge.side
			}
		],
		"nodes": data.nodes,
	});

	canvas.requestFrame();
};

export function buildTrees(canvasData: CanvasData, direction: 'LR' | 'RL' | 'TB' | 'BT'): TreeNode[] {
	const trees: TreeNode[] = [];
	const nodeMap: Map<string, TreeNode> = new Map();
	const edgeMap: Map<string, string[]> = new Map();

	canvasData.nodes.forEach(node => {
		nodeMap.set(node.id, {
			...node,
			children: []
		});
	});

	canvasData.edges.forEach(edge => {
		if (!edgeMap.has(edge.fromNode)) {
			edgeMap.set(edge.fromNode, []);
		}
		edgeMap.get(edge.fromNode)?.push(edge.toNode);
	});

	const rootNodes = canvasData.nodes.filter(node =>
		!canvasData.edges.some(edge => edge.toNode === node.id)
	);

	rootNodes.forEach(rootNode => {
		const tree = buildTree(rootNode.id, edgeMap, nodeMap, direction);
		trees.push(tree);
	});

	return trees;
}

function buildTree(nodeId: string, edgeMap: Map<string, string[]>, nodeMap: Map<string, TreeNode>, direction: 'LR' | 'RL' | 'TB' | 'BT'): TreeNode {
	const node = nodeMap.get(nodeId) as TreeNode;

	edgeMap.get(nodeId)?.forEach(childId => {
		if (shouldAddChild(nodeId, childId, direction, nodeMap)) {
			node.children.push(buildTree(childId, edgeMap, nodeMap, direction));
		}
	});
	return node;
}

function shouldAddChild(parentId: string, childId: string, direction: 'LR' | 'RL' | 'TB' | 'BT', nodeMap: Map<string, TreeNode>): boolean {
	const parent = nodeMap.get(parentId) as unknown as CanvasNodeData;
	const child = nodeMap.get(childId) as unknown as CanvasNodeData;

	switch (direction) {
		case 'LR':
			return parent.x < child.x;
		case 'RL':
			return parent.x > child.x;
		case 'TB':
			return parent.y < child.y;
		case 'BT':
			return parent.y > child.y;
		default:
			return true;
	}
}

