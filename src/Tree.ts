export interface TreeNode {
	a: string;
	b: TreeNode[];
}

function createTreeNode(text: string): TreeNode {
	return { a: text, b: [] };
}

export function parseMarkdownToTree(markdown: string): TreeNode[] {
	if (!markdown.trim()) return []; // Handle the empty string case

	var lines = markdown.split("\n");
	var root: TreeNode[] = [];
	let currentParent: TreeNode | undefined = undefined;
	let stack: { level: number; node: TreeNode }[] = [];

	const isListItem = (line: string): boolean => {
		var line = line.trim();
		return /^\s*([-*+]|\d+\.)\s/.test(line);
	};

	const isQuoteItem = (line: string): boolean => {
		return /^\s*(>+)/.test(line);
	};

	while (lines.length > 0) {
		const line = lines[0];
		if (isQuoteItem(line)) {
			let { forest, rest } = parseQuotesFromStringArray(lines);
			root.push.apply(root, forest);
			lines = rest;
		} else if (isListItem(line)) {
			let { forest, rest } = parseListsFromStringArray(lines);
			root.push.apply(root, forest);
			lines = rest;
		} else if (line.trim().length === 0) {
			lines = lines.slice(1);
		} else {
			let { forest, rest } = parseParagraphsFromStringArray(lines);
			root.push.apply(root, forest);
			lines = rest;
		}
	}
	return root;
}

function parseQuotesFromStringArray(lines: string[]): {
	forest: TreeNode[];
	rest: string[];
} {
	const forest: TreeNode[] = [];
	let stack: { level: number; node: TreeNode }[] = [];
	let i = 0;

	function getQuoteLevel(line: string): number {
		// Match sequences of '>' possibly separated by spaces
		const match = line.match(/^\s*(> ?)+/);
		return match ? (match[0].match(/>/g) || []).length : 0;
	}

	const addBlockToTree = (block: string, level: number) => {
		const newNode = createTreeNode(block);

		if (stack.length === 0 || level > stack[stack.length - 1].level) {
			if (stack.length > 0) {
				stack[stack.length - 1].node.b.push(newNode);
			} else {
				forest.push(newNode);
			}
		} else {
			while (stack.length > 0 && stack[stack.length - 1].level >= level) {
				stack.pop();
			}
			if (stack.length > 0) {
				stack[stack.length - 1].node.b.push(newNode);
			} else {
				forest.push(newNode);
			}
		}

		stack.push({ level, node: newNode });
	};

	let currentQuoteBlock = "";
	let currentQuoteLevel = 0;

	for (; i < lines.length; i++) {
		const line = lines[i].trim();

		if (line.length === 0) {
			if (currentQuoteBlock) {
				addBlockToTree(currentQuoteBlock, currentQuoteLevel);
			}
			currentQuoteBlock = "";
			currentQuoteLevel = 0;
			continue;
		}
		const quoteLevel = getQuoteLevel(line);

		if (quoteLevel === 0) break;

		const text = line.replace(/^\s*(>+)/, "").trim();

		if (quoteLevel === currentQuoteLevel) {
			currentQuoteBlock += `\n> ${text}`;
		} else {
			if (currentQuoteBlock) {
				addBlockToTree(currentQuoteBlock, currentQuoteLevel);
			}
			currentQuoteBlock = `> ${text}`;
			currentQuoteLevel = quoteLevel;
		}
	}

	// Process the last accumulated quote block
	if (currentQuoteBlock) {
		addBlockToTree(currentQuoteBlock, currentQuoteLevel);
	}

	// Return the forest and the remaining lines
	return {
		forest,
		rest: lines.slice(i), // The rest of the lines after the last quote
	};
}

function parseListsFromStringArray(lines: string[]): {
	forest: TreeNode[];
	rest: string[];
} {
	const forest: TreeNode[] = [];
	let currentParent: TreeNode | undefined = undefined;
	let stack: { level: number; node: TreeNode }[] = [];
	let i = 0;

	const getIndentationLevel = (line: string): number => {
		return line.match(/^\s*/)?.[0].length || 0;
	};

	const isListItem = (line: string): boolean => {
		return /^\s*([-*+]|\d+\.)\s/.test(line); // Check for list markers (-, *, +, or numbered)
	};

	const handleListItem = (text: string, level: number): TreeNode => {
		const newNode = createTreeNode(text);

		if (stack.length === 0 || level > stack[stack.length - 1].level) {
			if (currentParent) {
				currentParent.b.push(newNode);
			} else {
				forest.push(newNode);
			}
		} else {
			// Pop the stack until we find the correct parent level
			while (stack.length > 0 && stack[stack.length - 1].level >= level) {
				stack.pop();
			}
			if (stack.length > 0) {
				stack[stack.length - 1].node.b.push(newNode);
			} else {
				forest.push(newNode);
			}
		}

		stack.push({ level, node: newNode });
		currentParent = newNode;
		return newNode;
	};

	for (; i < lines.length; i++) {
		const line = lines[i].trim();
		if (line.length === 0) continue; // Skip empty lines

		const indentationLevel = getIndentationLevel(lines[i]);
		if (!isListItem(line)) {
			// Stop parsing if we reach a non-list item line
			break;
		}

		const text = line.replace(/^[-*+]\s|\d+\.\s/, "").trim();
		handleListItem(text, indentationLevel);
	}

	// Return the forest and the remaining lines
	return {
		forest,
		rest: lines.slice(i),
	};
}

function parseParagraphsFromStringArray(lines: string[]): {
	forest: TreeNode[];
	rest: string[];
} {
	const forest: TreeNode[] = [];
	let currentParent: TreeNode | undefined = undefined;
	let i = 0;

	const getIndentationLevel = (line: string): number => {
		return line.match(/^\s*/)?.[0].length || 0;
	};

	const isMarkdownType = (line: string): boolean => {
		// Detect markdown types like lists (-, *, +, or numbered lists, and blockquotes >)
		return /^\s*([-*+]\s|\d+\.\s|>)/.test(line);
	};

	const handleParagraph = (line: string, level: number) => {
		const newNode = createTreeNode(line.trim());

		if (level === 0) {
			// If not indented, it's a new root paragraph
			forest.push(newNode);
			currentParent = newNode;
		} else if (currentParent) {
			// If indented, it's a child of the last non-indented paragraph
			currentParent.b.push(newNode);
		}
	};

	for (; i < lines.length; i++) {
		const line = lines[i].trim();

		if (line.length === 0) continue; // Skip empty lines

		// Check if this line is another markdown type (list, quote, etc.)
		if (isMarkdownType(line)) {
			break; // Stop parsing when a markdown type is encountered
		}

		const indentationLevel = getIndentationLevel(lines[i]);

		// Handle the line as a paragraph
		handleParagraph(line, indentationLevel);
	}

	// Return the parsed forest and the remaining lines
	return {
		forest,
		rest: lines.slice(i), // Remaining unprocessed lines
	};
}
