
var crypto = require('crypto');
var Formatter = require('./formatter.js');

function hashops (input) {
	return crypto.createHash('sha256')
		.update(JSON.stringify(input))
		.digest('hex')
		.substr(0, 4)
		.toUpperCase();
}


module.exports = exports = function (formatter, topOptions) {
	topOptions = { ...Formatter.defaultOptions, ...topOptions };

	const included = {};
	function inline (typeName, { hash, hashAll, ...options } = {}) {
		options = { ...topOptions, ...options };

		if (hashAll) {
			options.suffix = hashops(options);
		} else if (hash) {
			typeName += '=' + typeName + hashops(options);
		}

		function renderDependency (depName) {
			const [ type, alias ] = depName.split('=');
			const ops = { ...options, [type]: { alias } };
			const { name, schema, requires } = formatter.format(type, ops);
			included[name] = schema;
			requires.forEach(renderDependency);
			return name;
		}

		return '... ' + renderDependency(typeName);
	}

	Object.defineProperty(inline, 'fragments', {
		get: () => Object.values(included).join('\n'),
	});

	return inline;
};

exports.hashops = hashops;
