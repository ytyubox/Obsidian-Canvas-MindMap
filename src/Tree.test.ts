export {};
import "jest";
interface TreeNode {
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

function parseMarkdownToTree(markdown: string): TreeNode[] {
	const lines = markdown.split("\n");
	const root: TreeNode[] = [];
	let currentParent: TreeNode | undefined = undefined;
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

test("Generate tree  from markdown", () => {
	expect(
		parseMarkdownToTree(`
- Item 1
  Some additional text for item 1 which is indented but not a new list item.
    Sub item with long text that exceeds the 100-word limit. This sentence goes on to describe more details. Another sentence follows with some extra details. This is a sample text that exceeds the hundred-word mark to showcase how splitting works.
- Item 2
  - Sub item 1
    Sub item description continues here without a list marker.
`)
	).toStrictEqual([
		{
			text: "Item 1",
			children: [
				{
					text: "Some additional text for item 1 which is indented but not a new list item.",
					children: [
						{
							text: "Sub item with long text that exceeds the 100-word limit.",
							children: [
								{
									text: "This sentence goes on to describe more details.",
									children: [
										{
											text: "Another sentence follows with some extra details.",
											children: [
												{
													text: "This is a sample text that exceeds the hundred-word mark to showcase how splitting works.",
													children: [],
												},
											],
										},
									],
								},
								,
							],
						},
					],
				},
			],
		},
		{
			text: "Item 2",
			children: [
				{
					text: "Sub item 1",
					children: [
						{
							text: "Sub item description continues here without a list marker.",
							children: [],
						},
					],
				},
			],
		},
	]);
});

test("empty tree", () => {
	expect(parseMarkdownToTree("")).toStrictEqual([]);
});
test("1 level list from tree", () => {
	expect(parseMarkdownToTree("- abc")).toStrictEqual([
		{ text: "abc", children: [] },
	]);
});
test("2 level list from tree", () => {
	expect(
		parseMarkdownToTree(
			`
		- level 1
			- level 2
		`
		)
	).toStrictEqual([
		{
			text: "level 1",
			children: [{ text: "level 2", children: [] }],
		},
	]);
});
