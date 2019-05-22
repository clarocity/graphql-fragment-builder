
var crypto = require('crypto');

class Options {
	constructor (base) {
		if (base && base.alias) {
			throw new Error('The "alias" option can only be used for targeted class overrides.');
		}

		if (base && base.name) {
			throw new Error('The "name" option can only be used for targeted class overrides.');
		}

		this.base = base || {};
		this.invocation = {};
		this.tiers = [];
		this.attributes = this.build();
		this.history = {};
	}

	invoked (opts) {
		if (opts && opts.alias) {
			throw new Error('The "alias" option can only be used for targeted class overrides.');
		}

		if (opts && opts.name) {
			throw new Error('The "name" option can only be used for targeted class overrides.');
		}

		this.invocation = opts || {};
		this.tiers = [];
		this.attributes = this.build();
		this.history = {};
		return this;
	}

	descend (tier, cb) {
		this.tiers.push(tier);
		this.attributes = this.build();
		if (typeof cb === 'function') {
			const r = cb(this.attributes);
			this.ascend();
			return r;
		}
		return this;
	}

	ascend () {
		this.tiers.pop();
		this.attributes = this.build();
		return this;
	}

	render (name) {
		if (this.history[name]) return false;
		this.history[name] = true;
		return true;
	}

	build () {

		const blaming = (this.base.debug || this.invocation.debug) && {};
		function blame (ops, name) {
			if (!blaming || !ops) return;
			const keys = Object.keys(ops);
			if (!keys.length) return;
			for (const k of keys) {
				blaming[k] = name;
			}
		}

		const { levels, ...result } = { ...Options.defaults, ...this.base, ...this.invocation };
		blame(Options.defaults, 'default');
		blame(this.base, 'base');
		blame(this.invocation, 'invocation');

		this.tiers.forEach((typeName, i) => {
			const level = levels && levels[i] || {};
			const typeOps = result[typeName] || {};
			blame(level, `Level ${i}`);
			blame(typeOps, typeName);

			Object.assign(result, typeOps, level);
		});

		const validDescendInto = (
			!result.descendInto
			|| result.descendInto === true
			|| Array.isArray(result.descendInto)
		);

		if (!validDescendInto) {
			throw new TypeError('The "descendInto" option must either be falsy, true, or an array.');
		}

		if (result.indentation && typeof result.indentation !== 'string') {
			throw new TypeError('The "indentation" option must be a string');
		} else if (!result.indentation) {
			result.indentation = '';
		}

		this.blame = blaming && Array.from(Object.entries(blaming),
			([ key, source ]) => `${key}: ${source}`
		);

		return result;
	}

	hash () {
		return Options.hash(this.attributes);
	}
}

Options.hash = function (input) {
	if (!input || Object.keys(input).length === 0) return '';
	return crypto.createHash('sha256')
		.update(JSON.stringify(input))
		.digest('hex')
		.substr(0, 6)
		.toUpperCase();
};

Options.defaults = {
	include: null,
	exclude: null,
	includeResolved: true,
	includeUnresolved: false,
	includeNested: true,
	descendResolved: true,
	descendUnresolved: false,
	descendInterfaces: false,
	descendInterfaceTypes: false,
	descendInto: null,
	ignoreUnknownTypes: false,
	indentation: '  ',
	prefix: null,
	suffix: null,
	name: null,
};

module.exports = exports = Options;
