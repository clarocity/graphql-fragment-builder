
const parser = require('./src/parser');
const Formatter = require('./src/formatter');

module.exports = exports = function (schema, resolvers) {
	const parsed = parser(schema, resolvers);
	const formatter = new Formatter(parsed);
	return formatter;
};

exports.Formatter = Formatter;
exports.parser = parser;
