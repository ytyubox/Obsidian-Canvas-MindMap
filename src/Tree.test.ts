import { parseMarkdownToTree } from "./Tree";
import { describe, expect, it } from "@jest/globals";

describe("sum module", () => {
	it("empty tree", () => {
		expect(parseMarkdownToTree("")).toStrictEqual([]);
	});
	it("1 level list to tree", () => {
		expect(parseMarkdownToTree("- abc")).toStrictEqual([
			{ a: "abc", b: [] },
		]);
	});
	it("2 level list to tree", () => {
		expect(
			parseMarkdownToTree(
				`
		- level 1
				- level 3
		`
			)
		).toStrictEqual([
			{
				a: "level 1",
				b: [{ a: "level 3", b: [] }],
			},
		]);
	});
	it("1 quote level to tree", () => {
		expect(parseMarkdownToTree("> level 1.1\n> level 1.2")).toStrictEqual([
			{
				a: `> level 1.1\n> level 1.2`,
				b: [],
			},
		]);
	});
	it("2 quote level to tree", () => {
		expect(parseMarkdownToTree("> level 1.1\n> > level 2.1")).toStrictEqual(
			[
				{
					a: `> level 1.1`,
					b: [{ a: "> > level 2.1", b: [] }],
				},
			]
		);
	});
	it("2 quote to tree", () => {
		expect(
			parseMarkdownToTree(`
> level 1.1
> level 1.2
> > level 2.1
> level 1.3

> level a.1
> level a.2
> > > level c.1
> level a.3
`)
		).toStrictEqual([
			{
				a: `> level 1.1\n> level 1.2`,
				b: [{ a: "> > level 2.1", b: [] }],
			},
			{
				a: `> level 1.3`,
				b: [],
			},
			{
				a: `> level a.1\n> level a.2`,
				b: [{ a: "> > > level c.1", b: [] }],
			},
			{
				a: `> level a.3`,
				b: [],
			},
		]);
	});
	// test("complex  tree", () => {
	// 	expect(
	// 		parseMarkdownToTree(`
	// Direct solution
	// Matrix solution
	// Particular solution + nullspace solution, x = y + z

	// [[Vector]]
	// [[Linear combination]]
	// space
	// [[20241002194408|inner product]]
	// vector Length
	// [[unit vector]]
	// Angle between two Vectors
	// perpendicular
	// Schwarz inequality
	// Triangle inequality
	// Matrices
	// Matrix times vector
	// combination of the columns
	// Multiplication a row at a time
	// Multiplication is also dot product with rows

	// > Old question: Compute the linear combination $x_1u + x_{2}v + x_{3}w$ to find b.
	// > New question: Which combination of $u, v, w$ produces a particular vector b？

	// [[inverse matrix]]
	// integration is the inverse of differentiation.
	// [[202409282040|cyclic]]
	// All [[Linear combination]] of [[202409282040|cyclic]] vector lie on the plane
	// independent columns
	// invertible matrix
	// dependent column
	// singular matrix

	// 			`)
	// 	).toStrictEqual([
	// 		{ a: "Direct solution", b: [] },
	// 		{ a: "Matrix solution", b: [] },
	// 		{
	// 			a: "Particular solution + nullspace solution, x = y + z",
	// 			b: [],
	// 		},
	// 		{ a: "[[Vector]]", b: [] },
	// 		{ a: "[[Linear combination]]", b: [] },
	// 		{ a: "space", b: [] },
	// 		{ a: "[[20241002194408|inner product]]", b: [] },
	// 		{ a: "vector Length", b: [] },
	// 		{ a: "[[unit vector]]", b: [] },
	// 		{ a: "Angle between two Vectors", b: [] },
	// 		{ a: "perpendicular", b: [] },
	// 		{ a: "Schwarz inequality", b: [] },
	// 		{ a: "Triangle inequality", b: [] },
	// 		{ a: "Matrices", b: [] },
	// 		{ a: "Matrix times vector", b: [] },
	// 		{ a: "combination of the columns", b: [] },
	// 		{ a: "Multiplication a row at a time", b: [] },
	// 		{
	// 			a: "Multiplication is also dot product with rows",
	// 			b: [],
	// 		},
	// 		{
	// 			a: `
	// 			> Old question: Compute the linear combination $x_1u + x_{2}v + x_{3}w$ to find b.
	// 			> New question: Which combination of $u, v, w$ produces a particular vector b？
	// 			`,
	// 			b: [],
	// 		},
	// 		{ a: "[[inverse matrix]]", b: [] },
	// 		{
	// 			a: "integration is the inverse of differentiation.",
	// 			b: [],
	// 		},
	// 		{ a: "[[202409282040|cyclic]]", b: [] },
	// 		{
	// 			a: "All [[Linear combination]] of [[202409282040|cyclic]] vector lie on the plane",
	// 			b: [],
	// 		},
	// 		{ a: "independent columns", b: [] },
	// 		{ a: "invertible matrix", b: [] },
	// 		{ a: "dependent column", b: [] },
	// 		{ a: "singular matrix", b: [] },
	// 	]);
	// });
});
