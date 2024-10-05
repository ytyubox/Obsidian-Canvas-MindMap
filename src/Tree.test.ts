import "jest";
import { parseMarkdownToTree } from "./Tree";

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
