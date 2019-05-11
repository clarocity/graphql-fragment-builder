
const suite = require('tapsuite');
const { typeDefs, resolvers } = require('./_scaffolding');
const parser = require('../src/parser');
const Formatter = require('../src/formatter');
const stripIndent = require('common-tags/lib/stripIndent');

suite('formatter', (s) => {
	const parsed = parser(typeDefs, resolvers);

	s.test('parses with defaults', async (t) => {
		const formatter = new Formatter(parsed);
		const result = formatter.format('Order');
		const schema = stripIndent`
			fragment Order on Order {
			  id
			  dateCreated
			  createdby
			  status
			}
		`;
		t.equals(result.name, 'Order', 'name matches');
		t.equals(result.schema, schema, 'schema matches');
		t.deepEquals(result.requires, [], 'requirement matches');
	});

});
