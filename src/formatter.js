
const objectReduce = require('./reduce');

class Formatter {
	constructor (typeData, options) {
		this.options = {
			includeResolved: true,
			includeUnresolved: false,
			includeNested: true,
			descendResolved: true,
			descendInterfaces: false,
			descendInterfaceTypes: false,
			descendInto: null,
			ignoreUnknownTypes: false,
			indentation: '  ',

			...options,
		};

		if (options && options.descendInto && !Array.isArray(options.descendInto)) {
			throw new TypeError('The descendInto option must either be falsy or an array.');
		}

		if (options && options.indentation && typeof options.indentation !== 'string') {
			throw new TypeError('The indentation option must be a string');
		}

		this.typeData = typeData;
	}

	_indent (input, indentation) {
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

	_formatFields (typeName, fields, options) {
		const {
			includeResolved,
			includeUnresolved,
			includeNested,
			ignoreUnknownTypes,
			indentation,
			descendResolved,
			descendInterfaces,
			descendInto,
		} = options;

		const requires = [];
		const formatted = Object.keys(fields).map((name) => {
			const { type, resolved, nested } = fields[name];
			if (resolved && !includeResolved) return null;
			if (!resolved && !includeUnresolved) return null;

			if (!nested) {
				return name;
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
					throw new Error(`Could not find type "${type}" for ${typeName}.${name}`);
				}

				descend = false;
			}

			// if the type is an interface, and descendInterfaces isn't enabled,
			// do not descend.
			if (descend && typeDec.implementors && !descendInterfaces) {
				descend = (descendInto && descendInto.includes(type));
			}

			if (descend) {
				let list, needs;
				if (typeDec.implementors) {
					[ list, needs ] = this._formatInterface(typeName, typeDec.implementors, options);
				} else {
					[ list, needs ] = this._formatFields(typeName, typeDec.fields, options);
				}
				requires.push(...needs);
				return `${name} {\n${this._indent(list, indentation)}\n}`;
			}

			requires.push(type);
			return `${name} { ... ${type} }`;

		}).filter(Boolean).join('\n');

		return [ formatted, requires ];
	}

	_formatInterface (interfaceName, implementorNames, options) {
		const {
			descendInterfaceTypes,
			descendInto,
			ignoreUnknownTypes,
			indentation,
		} = options;

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
				const [ list, needs ] = this._formatFields(typeName, typeDec.fields, options);
				requires.push(...needs);
				return `... on ${typeName} {\n${this._indent(list, indentation)}\n}`;
			}

			requires.push(typeName);
			return `... on ${typeName} { ... ${typeName} }`;
		}).filter(Boolean).join('\n');

		return [ formatted, requires ];
	}

	_formatType (typeName, typeDec, options) {
		var list, requires;
		if (typeDec.implementors) {
			[ list, requires ] = this._formatInterface(typeName, typeDec.implementors, options);
		} else {
			[ list, requires ] = this._formatFields(typeName, typeDec.fields, options);
		}
		list = this._indent(list, options.indentation);
		// console.log(list);
		const schema = `fragment ${typeName} on ${typeName} {\n${list}\n}`;
		return {
			name: typeName,
			schema,
			requires,
		};
	}

	formatAll (options) {
		options = { ...this.options, ...options };
		return objectReduce(this.typeData, (typeFields, typeName) => [
			typeName,
			this._formatType(typeName, typeFields, options),
		]);
	}

	format (typeName, options) {
		options = { ...this.options, ...options };
		return this._formatType(typeName, this.typeData[typeName], options);
	}
}

module.exports = exports = Formatter;
