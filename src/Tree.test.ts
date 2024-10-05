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

test("complex  tree", () => {
	expect(
		parseMarkdownToTree(`
Direct solution
Matrix solution
Particular solution + nullspace solution, x = y + z

[[Vector]]
[[Linear combination]]
space
[[20241002194408|inner product]]
vector Length
[[unit vector]]
Angle between two Vectors
perpendicular
Schwarz inequality
Triangle inequality
Matrices
Matrix times vector
combination of the columns
Multiplication a row at a time
Multiplication is also dot product with rows

> Old question: Compute the linear combination $x_1u + x_{2}v + x_{3}w$ to find b.
> New question: Which combination of $u, v, w$ produces a particular vector b？

[[inverse matrix]]
integration is the inverse of differentiation.
[[202409282040|cyclic]]
All [[Linear combination]] of [[202409282040|cyclic]] vector lie on the plane
independent columns
invertible matrix
dependent column
singular matrix

			`)
	).toStrictEqual([
		{ text: "Direct solution", children: [] },
		{ text: "Matrix solution", children: [] },
		{
			text: "Particular solution + nullspace solution, x = y + z",
			children: [],
		},
		{ text: "[[Vector]]", children: [] },
		{ text: "[[Linear combination]]", children: [] },
		{ text: "space", children: [] },
		{ text: "[[20241002194408|inner product]]", children: [] },
		{ text: "vector Length", children: [] },
		{ text: "[[unit vector]]", children: [] },
		{ text: "Angle between two Vectors", children: [] },
		{ text: "perpendicular", children: [] },
		{ text: "Schwarz inequality", children: [] },
		{ text: "Triangle inequality", children: [] },
		{ text: "Matrices", children: [] },
		{ text: "Matrix times vector", children: [] },
		{ text: "combination of the columns", children: [] },
		{ text: "Multiplication a row at a time", children: [] },
		{
			text: "Multiplication is also dot product with rows",
			children: [],
		},
		{
			text: "> Old question: Compute the linear combination $x_1u + x_{2}v + x_{3}w$ to find b.",
			children: [],
		},
		{
			text: "> New question: Which combination of $u, v, w$ produces a particular vector b？",
			children: [],
		},
		{ text: "[[inverse matrix]]", children: [] },
		{
			text: "integration is the inverse of differentiation.",
			children: [],
		},
		{ text: "[[202409282040|cyclic]]", children: [] },
		{
			text: "All [[Linear combination]] of [[202409282040|cyclic]] vector lie on the plane",
			children: [],
		},
		{ text: "independent columns", children: [] },
		{ text: "invertible matrix", children: [] },
		{ text: "dependent column", children: [] },
		{ text: "singular matrix", children: [] },
	]);
});
