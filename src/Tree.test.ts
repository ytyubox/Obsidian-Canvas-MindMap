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
	).toStrictEqual([]);
});
