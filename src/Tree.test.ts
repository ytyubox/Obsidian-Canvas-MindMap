import { text } from "stream/consumers";

interface TreeNode {
	text: string;
	children: TreeNode[];
}

function parseMarkdownToTree(markdown: string): TreeNode[] {
	const lines = markdown.split("\n");
	const root: TreeNode[] = [];
	const stack: { level: number; nodes: TreeNode[] }[] = [
		{ level: -1, nodes: root },
	];

	const isListMark = (line: string): boolean =>
		/^\s*([-*+]|\d+\.)\s+/.test(line);
	const getIndentationLevel = (line: string): number =>
		line.match(/^\s*/)?.[0].length || 0;

	const splitLongSentence = (text: string): string[] => {
		const sentences = text
			.split(".")
			.map((sentence) => sentence.trim())
			.filter(Boolean);
		return sentences;
	};

	lines.forEach((line, index) => {
		if (line.trim().length === 0) return; // Skip empty lines

		const trimmedLine = line.trim();

		const indentationLevel = getIndentationLevel(line);
		const isListItem = isListMark(line);

		let text = trimmedLine.replace(/^([-*+]|\d+\.)\s*/, ""); // Remove list marker if present
		console.log("$" + text);
		// If line exceeds 100 words, split it into sentences
		const words = text.split(/\s+/);
		if (words.length > 100) {
			const sentences = splitLongSentence(text);
			text = sentences.shift()!;
			sentences.forEach((sentence) => {
				const sentenceNode: TreeNode = { text: sentence, children: [] };
				stack[stack.length - 1].nodes.push(sentenceNode);
				stack.push({
					level: indentationLevel + 1,
					nodes: sentenceNode.children,
				});
			});
		}

		const newNode: TreeNode = { text, children: [] };

		// Check for indented line without a list marker (rule 2 and 4)
		const previousLine = lines[index - 1];
		const prevIndentationLevel = previousLine
			? getIndentationLevel(previousLine)
			: 0;
		if (
			!isListItem &&
			indentationLevel > prevIndentationLevel &&
			previousLine &&
			!isListMark(previousLine)
		) {
			const parentNode =
				stack[stack.length - 1].nodes[
					stack[stack.length - 1].nodes.length - 1
				];
			parentNode.text += `\n${text}`;
			return;
		}

		// Adjust the stack for new indentation level
		while (
			stack.length > 0 &&
			stack[stack.length - 1].level >= indentationLevel
		) {
			stack.pop();
		}

		// Add the new node to the current parent node
		stack[stack.length - 1].nodes.push(newNode);

		// Push new node into the stack
		stack.push({ level: indentationLevel, nodes: newNode.children });
	});

	return root;
}

// test("Generate tree  from markdown", () => {
// 	expect(
// 		parseMarkdownToTree(`
// - Item 1
//   Some additional text for item 1 which is indented but not a new list item.
//     Sub item with long text that exceeds the 100-word limit. This sentence goes on to describe more details. Another sentence follows with some extra details. This is a sample text that exceeds the hundred-word mark to showcase how splitting works.
// - Item 2
//   - Sub item 1
//     Sub item description continues here without a list marker.
// `)
// 	).toStrictEqual([]);
// });

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
			- level 1
		`
		)
	).toStrictEqual([
		{
			text: "level 1",
			content: null,
			children: [{ text: "level 1", content: null, children: [] }],
		},
	]);
});
