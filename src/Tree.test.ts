import { text } from "stream/consumers";

// example.test.ts
export interface TreeNode {
	text: string;
	content: string | null; // Content associated with the list item
	children: TreeNode[];
}

function isListMarker(line: string): boolean {
	// Regex to match list markers: -, *, +, or numbers followed by a period
	return /^\s*([-*+]|\d+\.)\s+/.test(line);
}
function parseMarkdownListToTree(markdown: string): TreeNode[] {
	const lines = markdown.split("\n");
	const root: TreeNode[] = [];
	const stack: { level: number; nodes: TreeNode[] }[] = [
		{ level: -1, nodes: root },
	];
	let currentNode: TreeNode | null = null;

	lines.forEach((line) => {
		// Ignore empty lines
		if (line.trim().length === 0) return;

		if (isListMarker(line)) {
			// This line is a list item
			const trimmedLine = line.trim();
			const indentationLevel = line.length - trimmedLine.length;

			// Create a new list item node
			const newNode: TreeNode = {
				text: trimmedLine.replace(/^[-*+]|\d+\.\s*/, "").trim(),
				content: null, // No content initially
				children: [],
			};

			// Adjust the stack to the current level
			while (
				stack.length > 0 &&
				stack[stack.length - 1].level >= indentationLevel
			) {
				stack.pop();
			}

			// Add the new node as a child of the current level's parent node
			const parentNode = stack[stack.length - 1].nodes;
			parentNode.push(newNode);

			// Set this node as the current node and push it onto the stack
			currentNode = newNode;
			stack.push({ level: indentationLevel, nodes: newNode.children });
		} else if (currentNode) {
			// This line is content for the last list item
			currentNode.content =
				(currentNode.content ? currentNode.content + "\n" : "") +
				line.trim();
		}
	});

	return root;
}

test("Generate tree", () => {
	expect(parseMarkdownListToTree("")).toStrictEqual([]);
	expect(parseMarkdownListToTree("- abc")).toStrictEqual([
		{ text: "abc", content: null, children: [] },
	]);
	expect(
		parseMarkdownListToTree(
			`
		- level 1
			- level 2
		`
		)
	).toStrictEqual([
		{
			text: "level 1",
			content: null,
			children: [{ text: "level 2", content: null, children: [] }],
		},
	]);
});
