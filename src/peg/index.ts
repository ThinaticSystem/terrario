import * as P from '../index';

const _ = P.regexp(/[ \t]/);

const lang = P.createLanguage({
	rules: r => {
		// const separator = P.alt([
		// 	P.seq([
		// 		P.alt([_, P.newline]).many(0),
		// 		P.str(';'),
		// 		P.alt([_, P.newline]).many(0),
		// 	]),
		// 	P.seq([
		// 		_.many(0),
		// 		P.newline,
		// 		P.alt([_, P.newline]).many(0),
		// 	]),
		// ]);
		const separator = P.seq([
			_.many(0),
			P.newline,
			P.alt([_, P.newline]).many(0),
		]);
		return P.seq([
			r.rule.sep(separator, 1),
			separator.option(),
		], 0);
	},

	rule: r => {
		return P.seq([
			P.regexp(/[a-z0-9]+/i),
			P.alt([_, P.newline]).many(0),
			P.str('='),
			P.alt([_, P.newline]).many(0),
			r.exprLayer1,
		]).map(values => {
			return { type: 'rule', name: values[0], expr: values[4] };
		});
	},

	// choice
	exprLayer1: r => {
		const choiceSep = P.seq([
			P.alt([_, P.newline]).many(1),
			P.str('/'),
			P.alt([_, P.newline]).many(1),
		]);
		const choice = r.exprLayer2.sep(choiceSep, 2).map(values => {
			return { type: 'choice', exprs: values };
		});
		return P.alt([
			choice,
			r.exprLayer2,
		]);
	},

	// sequence
	exprLayer2: r => {
		const sequence = r.exprLayer3.sep(_.many(1), 2).map(values => {
			return { type: 'sequence', exprs: values };
		});
		return P.alt([
			sequence,
			r.exprLayer3,
		]);
	},

	// ? + *
	exprLayer3: r => {
		const exprOp = P.seq([
			r.exprLayer4,
			P.alt([_, P.newline]).many(0),
			P.alt([
				P.str('?').map(v => { return { type: 'option' }; }),
				P.str('+').map(v => { return { type: 'many', min: 1 }; }),
				P.str('*').map(v => { return { type: 'many', min: 0 }; }),
			]),
			P.alt([_, P.newline]).many(0),
		]).map(values => {
			return { ...values[0], op: values[2] };
		});
		return P.alt([
			exprOp,
			r.exprLayer4,
		]);
	},

	exprLayer4: r => P.alt([
		r.stringLiteral,
	]),

	stringLiteral: r => P.seq([
		P.str('"'),
		P.seq([
			P.notMatch(P.alt([P.str('"'), P.cr, P.lf])),
			P.char,
		]).many(0).text(),
		P.str('"'),
	], 1).map(value => {
		return { type: 'string', value: value };
	}),
});

export function parse(input: string) {
	return lang.rules.handler(input, 0, {});
}