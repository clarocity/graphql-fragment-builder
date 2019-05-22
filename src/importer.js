
var Options = require('./options.js');

module.exports = exports = function (formatter, { hash } = {}) {

	const results = {};
	const dependencies = {};

	function inline (typeName, options = {}) {
		const opshash = Options.hash(options);
		if (!options.suffix && hash !== false) {
			options.suffix = opshash;
		}

		formatter.options.invoked(options);
		const name = formatter.options.descend(typeName, () => {
			const fragment = formatter._formatType(typeName, true);

			if (fragment.schema) {
				Object.assign(dependencies, fragment.requires);
				results[fragment.name] = fragment.schema;
			}

			return fragment.name;
		});

		return `... ${name}`;
	}

	Object.defineProperty(inline, 'fragments', {
		get: () => Object.values({ ...dependencies, ...results }).join('\n'),
	});

	return inline;
};
