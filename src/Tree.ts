export interface TreeNode {
	a: string;
	b: TreeNode[];
}

function createTreeNode(text: string): TreeNode {
	return { a: text, b: [] };
}

function splitIntoSentences(text: string): string[] {
	return text
		.split(/(?<=\.)\s*/)
		.map((sentence) => sentence.trim())
		.filter(Boolean);
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
			root.concat(forest);
			lines = rest;
		} else if (isListItem(line)) {
			let { forest, rest } = parseListsFromStringArray(lines);
			root.push.apply(root, forest);
			console.log(root);
			lines = rest;
		} else if (line.length === 0) {
			lines = lines.slice(1);
		}
	}
	return root;
}

function parseQuotesFromStringArray(lines: string[]): {
	forest: TreeNode[];
	rest: string[];
} {
	const forest: TreeNode[] = [];
	let currentParent: TreeNode | undefined = undefined;
	let stack: { level: number; node: TreeNode }[] = [];
	let i = 0;

	const getQuoteLevel = (line: string): number => {
		const match = line.match(/^\s*(>+)/);
		return match ? match[1].length : 0;
	};

	const handleQuoteBlock = (text: string, level: number): TreeNode => {
		const newNode = createTreeNode(text);

		if (stack.length === 0 || level > stack[stack.length - 1].level) {
			if (currentParent) {
				currentParent.b.push(newNode);
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
		currentParent = newNode;
		return newNode;
	};

	for (; i < lines.length; i++) {
		const line = lines[i].trim();
		if (line.length === 0) continue; // Skip empty lines

		const quoteLevel = getQuoteLevel(line);
		if (quoteLevel === 0) {
			// Stop parsing if we reach a non-quote line
			break;
		}

		const text = line.replace(/^\s*(>+)/, "").trim();
		handleQuoteBlock(`> ${text}`, quoteLevel);
	}

	// Return the forest and the remaining lines
	return {
		forest,
		rest: lines.slice(i),
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
