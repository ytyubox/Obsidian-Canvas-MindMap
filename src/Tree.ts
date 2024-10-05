export interface TreeNode {
	text: string;
	children: TreeNode[];
}

function createTreeNode(text: string): TreeNode {
	return { text, children: [] };
}

function splitIntoSentences(text: string): string[] {
	return text
		.split(/(?<=\.)\s*/)
		.map((sentence) => sentence.trim())
		.filter(Boolean);
}

export function parseMarkdownToTree(markdown: string): TreeNode[] {
	const lines = markdown.split("\n");
	const root: TreeNode[] = [];
	let currentParent: TreeNode | undefined = undefined;
	console.log(lines);
	let stack: { level: number; node: TreeNode }[] = [];

	const getIndentationLevel = (line: string): number => {
		return line.match(/^\s*/)?.[0].length || 0;
	};

	const isListItem = (line: string): boolean => {
		return /^\s*([-*+]|\d+\.\s)/.test(line);
	};

	const handleIndentedContent = (line: string, parent: TreeNode) => {
		const sentences = splitIntoSentences(line);
		let currentNode = parent;

		for (const sentence of sentences) {
			const newNode = createTreeNode(sentence);
			currentNode.children.push(newNode);
			currentNode = newNode;
		}
	};

	lines.forEach((line) => {
		const trimmedLine = line.trim();
		const indentationLevel = getIndentationLevel(line);

		if (trimmedLine.length === 0) {
			return; // Skip empty lines
		}

		if (isListItem(trimmedLine)) {
			// Create a new list item node
			const text = trimmedLine.replace(/^[-*+]\s|\d+\.\s/, "").trim();
			const newNode = createTreeNode(text);

			if (
				stack.length === 0 ||
				indentationLevel > stack[stack.length - 1].level
			) {
				// This is a child of the current parent
				if (currentParent) {
					currentParent.children.push(newNode);
				} else {
					root.push(newNode);
				}
			} else {
				// Pop the stack until we find the correct parent level
				while (
					stack.length > 0 &&
					stack[stack.length - 1].level >= indentationLevel
				) {
					stack.pop();
				}
				if (stack.length > 0) {
					stack[stack.length - 1].node.children.push(newNode);
				} else {
					root.push(newNode);
				}
			}

			// Update the current parent and push the new node onto the stack
			currentParent = newNode;
			stack.push({ level: indentationLevel, node: newNode });
		} else {
			// Handle indented content as a child of the last list item
			if (currentParent) {
				handleIndentedContent(trimmedLine, currentParent);
			}
		}
	});

	return root;
}
