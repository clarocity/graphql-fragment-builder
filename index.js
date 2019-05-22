
const parser = require('./src/parser');
const Formatter = require('./src/formatter');
const importer = require('./src/importer');

module.exports = exports = function (schema, resolvers, options) {
	const parsed = parser(schema, resolvers);
	const formatter = new Formatter(parsed, options);
	formatter.importer = (importerOptions) => importer(formatter, importerOptions);
	return formatter;
};

exports.Formatter = Formatter;
exports.parser = parser;
exports.importer = importer;
