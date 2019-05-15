
const objectReduce = require('./reduce');

class Options {
	constructor (base) {
		this.base = { ...Options.defaults, ...base };
		this.invocation = null;
		this.tiers = [];
		this.attributes = this.build();
	}

	invoked (opts) {
		this.invocation = opts;
		this.tiers = [];
		this.attributes = this.build();
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

	build () {
		const result = { ...this.base, ...this.invocation };

		this.tiers.forEach((typeName) => {
			if (result[typeName]) Object.assign(result, result[typeName]);
		});

		if (result.descendInto && !Array.isArray(result.descendInto)) {
			throw new TypeError('The descendInto option must either be falsy or an array.');
		}

		if (result.indentation && typeof result.indentation !== 'string') {
			throw new TypeError('The indentation option must be a string');
		}

		return result;
	}
}

Options.defaults = {
	includeResolved: true,
	includeUnresolved: false,
	includeNested: true,
	descendResolved: true,
	descendInterfaces: false,
	descendInterfaceTypes: false,
	descendInto: null,
	ignoreUnknownTypes: false,
	indentation: '  ',
	prefix: '',
	suffix: '',
	name: null,
};

class Formatter {

	constructor (typeData, options) {
		this.options = new Options(options);
		this.typeData = typeData;
	}

	_indent (input) {
		const { indentation } = this.options.attributes;
		if (!indentation) return input;

		const isString = (typeof input === 'string');
		if (isString) input = input.split('\n');

		if (!Array.isArray(input)) {
			throw new TypeError('Received not indentable input');
		}

		const output = input.map((line) => indentation + line);

		if (isString) return output.join('\n');
		return output;
	}

	_formatFields (typeName, fields) {
		const {
			includeResolved,
			includeUnresolved,
			includeNested,
			ignoreUnknownTypes,
			descendResolved,
			descendInterfaces,
			descendInto,
		} = this.options.attributes;

		const requires = [];
		const formatted = Object.keys(fields).map((fieldName) => {
			const { type, resolved, nested } = fields[fieldName];
			if (resolved !== undefined) {
				if (resolved && !includeResolved) return null;
				if (!resolved && !includeUnresolved) return null;
			}

			if (!nested) {
				return fieldName;
			}

			if (!includeNested) return null;

			// at this point we're only continuing if the field to include is an object

			const typeDec = this.typeData[type];

			let descend = (
				(resolved && descendResolved)
				|| (descendInto && descendInto.includes(type))
			);

			if (descend && !typeDec) {
				if (!ignoreUnknownTypes) {
					throw new Error(`Could not find type "${type}" for ${typeName}.${fieldName}`);
				}

				descend = false;
			}

			// if the type is an interface, and descendInterfaces isn't enabled,
			// do not descend.
			if (descend && typeDec.implementors && !descendInterfaces) {
				descend = (descendInto && descendInto.includes(type));
			}

			if (descend) {
				const [ list, needs ] = this.options.descend(type, () => {
					if (typeDec.implementors) {
						return this._formatInterface(type, typeDec.implementors);
					}

					return this._formatFields(type, typeDec.fields);
				});

				requires.push(...needs);
				return `${fieldName} {\n${this._indent(list)}\n}`;
			}

			return this.options.descend(type, ({ prefix, name, suffix }) => {
				const fragmentName = `${prefix || ''}${name || type}${suffix || ''}`;
				requires.push(fragmentName === type ? type : `${type}=${fragmentName}`);
				return `${fieldName} { ... ${fragmentName} }`;
			});

		}).filter(Boolean).join('\n');

		return [ formatted, requires ];
	}

	_formatInterface (interfaceName, implementorNames) {
		const {
			descendInterfaceTypes,
			descendInto,
			ignoreUnknownTypes,
		} = this.options.attributes;

		const requires = [];
		const formatted = implementorNames.map((typeName) => {
			const typeDec = this.typeData[typeName];

			let descend = (
				(descendInterfaceTypes)
				|| (descendInto && descendInto.includes(typeName))
			);

			if (descend && !typeDec) {
				if (!ignoreUnknownTypes) {
					throw new Error(`Could not find type "${typeName}" for ${interfaceName}`);
				}

				descend = false;
			}

			if (descend) {
				const [ list, needs ] = this.options.descend(typeName, () =>
					this._formatFields(typeName, typeDec.fields)
				);

				requires.push(...needs);
				return `... on ${typeName} {\n${this._indent(list)}\n}`;
			}

			requires.push(typeName);
			const fragmentName = this.options.descend(typeName, ({ prefix, name, suffix }) =>
				`${prefix || ''}${name || typeName}${suffix || ''}`
			);

			return `... on ${typeName} { ... ${fragmentName} }`;
		}).filter(Boolean).join('\n');

		return [ formatted, requires ];
	}

	_formatType (typeName, typeDec) {
		var [ list, requires ] = (() => {
			if (typeDec.implementors) {
				return this._formatInterface(typeName, typeDec.implementors);
			}

			return this._formatFields(typeName, typeDec.fields);
		})();

		list = this._indent(list);

		const { prefix, name, suffix } = this.options.attributes;
		const fragmentName = `${prefix || ''}${name || typeName}${suffix || ''}`;

		const schema = `fragment ${fragmentName} on ${typeName} {\n${list}\n}`;
		return {
			name: fragmentName,
			schema,
			requires,
		};
	}

	formatAll (options) {
		this.options.invoked(options);
		return objectReduce(this.typeData, (typeFields, typeName) =>
			this.options.descend(typeName, () =>
				[
					typeName,
					this._formatType(typeName, typeFields),
				]
			)
		);
	}

	format (typeName, options) {
		this.options.invoked(options);
		return this.options.descend(typeName, () =>
			this._formatType(typeName, this.typeData[typeName])
		);
	}
}

Formatter.defaultOptions = Options.defaults;

module.exports = exports = Formatter;
