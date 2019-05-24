
const objectReduce = require('./reduce');
const Options = require('./options');

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
			debug,
			include,
			exclude,
			includeResolved,
			includeUnresolved,
			includeNested,
			ignoreUnknownTypes,
			descendResolved,
			descendUnresolved,
			descendInterfaces,
			descendInto,
		} = this.options.attributes;
		const requires = {};

		let formatted = Object.keys(fields).map((fieldName) => {
			const { type, resolved, nested } = fields[fieldName];

			if (!include || !include.includes(fieldName) || !include.includes(fieldName) ) {
				if (resolved !== undefined) {
					if (resolved && !includeResolved) return null;
					if (!resolved && !includeUnresolved) return null;
				}

				if (nested && !includeNested) return null;
			}

			if (exclude && (exclude.includes(fieldName) || exclude.includes(type))) {
				return null;
			}

			if (!nested) {
				return fieldName;
			}

			// at this point we're only continuing if the field to include is an object

			const typeDec = this.typeData[type];

			let descend = (descendInto === true) || (
				(resolved && descendResolved)
				|| (!resolved && descendUnresolved)
				|| (descendInto && (
					descendInto.includes(type) || descendInto.includes(fieldName)
				))
			) && descendInto !== false;

			if (descend && !typeDec) {
				if (!ignoreUnknownTypes) {
					throw new Error(`Could not find type "${type}" for ${typeName}.${fieldName}`);
				}

				descend = false;
			}

			// if the type is an interface, and descendInterfaces isn't enabled,
			// do not descend.
			if (descend && typeDec.children && !descendInterfaces) {
				descend = (
					(descendInto === true)
					|| (descendInto && descendInto.includes(type))
				) && descendInto !== false;
			}

			if (descend) {
				const [ list, needs ] = this.options.descend(type, () => {
					if (typeDec.children) {
						return this._formatInterfaceOrUnion(type, typeDec.children);
					}

					return this._formatFields(type, typeDec.fields);
				});

				Object.assign(requires, needs);
				return `${fieldName} {\n${this._indent(list)}\n}`;
			}

			return this.options.descend(type, () => {
				const dependency = this._formatType(type);
				// if (typeName === 'Order' && type === 'Address') console.log(dependency, this.options.tiers);

				if (dependency.schema) {
					Object.assign(requires, dependency.requires);
					requires[dependency.name] = dependency.schema;
				}

				return `${fieldName} { ... ${dependency.name} }`;
			});

		}).filter(Boolean).join('\n');

		if (debug) {
			formatted = [
				(debug === true || debug.origin) &&
					`# Origin: ${this.options.tiers.join('->')}`,
				(debug === true || debug.blame) &&
					`# Blame: ${this.options.blame.join(', ')}`,
				formatted,
			].filter(Boolean).join('\n');
		}

		return [ formatted, requires ];
	}

	_formatInterfaceOrUnion (interfaceName, implementorNames) {
		const {
			debug,
			descendInterfaceTypes,
			descendInto,
			ignoreUnknownTypes,
		} = this.options.attributes;

		const requires = {};
		let formatted = implementorNames.map((typeName) => {
			const typeDec = this.typeData[typeName];

			let descend = descendInto === true || (
				(descendInterfaceTypes)
				|| (descendInto && descendInto.includes(typeName))
			) && descendInto !== false;

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

				Object.assign(requires, needs);
				return `... on ${typeName} {\n${this._indent(list)}\n}`;
			}

			return this.options.descend(typeName, () => {
				const dependency = this._formatType(typeName);

				if (dependency.schema) {
					Object.assign(requires, dependency.requires);
					requires[dependency.name] = dependency.schema;
				}

				return `... on ${typeName} { ... ${dependency.name} }`;
			});

		}).filter(Boolean).join('\n');

		if (debug) {
			formatted = [
				`# Origin: ${this.options.tiers.join('->')}`,
				formatted,
			].join('\n');
		}

		return [ formatted, requires ];
	}

	_formatType (typeName, force = false) {
		const typeDec = this.typeData[typeName];
		if (!typeDec) throw new Error(`Unknown type "${typeName}"`);

		const { alias, prefix, name, suffix } = this.options.attributes;
		const fragmentName = alias || `${prefix || ''}${name || typeName}${suffix || ''}`;

		if (!force && !this.options.render(fragmentName)) {
			return {
				name: fragmentName,
				schema: false,
			};
		}

		var [ list, requires ] = (() => {
			if (typeDec.children) {
				return this._formatInterfaceOrUnion(typeName, typeDec.children);
			}

			return this._formatFields(typeName, typeDec.fields);
		})();

		list = this._indent(list);

		const schema = `fragment ${fragmentName} on ${typeName} {\n${list}\n}`;
		return {
			name: fragmentName,
			schema,
			requires,
		};
	}

	formatAll (options) {
		return this.formatMultiple(Object.keys(this.typeData), options);
	}

	format (typeName, options) {
		if (Array.isArray(typeName)) {
			// invoked as .format([name, name2], options)
			return this.formatMultiple(typeName, options);
		}

		if (typeof typeName === 'object' && !options) {
			// invoked as .format(options)
			return this.formatAll(typeName);
		}

		if (!typeName) {
			// invoked as .format()
			return this.formatAll(options);
		}

		// invoked as .format(name)
		return this.formatSingle(typeName, options);
	}

	formatSingle (typeName, options) {
		if (typeof typeName !== 'string') {
			throw new TypeError('typeName must be a string');
		}

		this.options.invoked(options);
		return this.options.descend(typeName, () =>
			this._formatType(typeName)
		);
	}

	formatMultiple (typeNames, { combined, ...options } = {}) {
		this.options.invoked(options);
		const results = {};
		const dependencies = {};
		typeNames.forEach((typeName) =>
			this.options.descend(typeName, () => {
				const fragment = this._formatType(typeName, true);

				if (fragment.schema) {
					Object.assign(dependencies, fragment.requires);
					results[fragment.name] = fragment.schema;
				}
			})
		);

		if (combined !== false) return { ...dependencies, ...results };
		return { fragments: results, dependencies };
	}
}

module.exports = exports = Formatter;
