
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
			  address {
			    address1
			    address2
			    city
			    state
			    zip
			  }
			}
		`;
		t.equals(result.name, 'Order', 'name matches');
		t.equals(result.schema, schema, 'schema matches');
		t.deepEquals(result.requires, [], 'requirement matches');
	});

	s.test('parses with base options', async (t) => {
		const formatter = new Formatter(parsed, {
			descendResolved: false,
		});
		const result = formatter.format('Order');
		const schema = stripIndent`
			fragment Order on Order {
			  id
			  dateCreated
			  createdby
			  status
			  address { ... Address }
			}
		`;
		t.equals(result.name, 'Order', 'name matches');
		t.equals(result.schema, schema, 'schema matches');
		t.deepEquals(result.requires, [ 'Address' ], 'requirement matches');
	});

	s.test('parses with invocation options', async (t) => {
		const formatter = new Formatter(parsed, {
			descendResolved: false,
		});
		const result = formatter.format('Order', {
			includeNested: false,
		});
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

	s.test('include unresolved, exclude resolved', async (t) => {
		const formatter = new Formatter(parsed, {
			includeUnresolved: true,
			includeResolved: false,
		});
		const result = formatter.format('Order');
		const schema = stripIndent`
			fragment Order on Order {
			  creator { ... User }
			  client { ... Client }
			}
		`;
		t.equals(result.name, 'Order', 'name matches');
		t.equals(result.schema, schema, 'schema matches');
		t.deepEquals(result.requires, [ 'User', 'Client' ], 'requirement matches');
	});

	s.test('include unresolved, descendInto', async (t) => {
		const formatter = new Formatter(parsed, {
			includeUnresolved: true,
			includeResolved: false,
			descendInto: [ 'User' ],
		});
		const result = formatter.format('Order');
		const schema = stripIndent`
			fragment Order on Order {
			  creator {
			    ... on AdminUser { ... AdminUser }
			    ... on ClientUser { ... ClientUser }
			  }
			  client { ... Client }
			}
		`;
		t.equals(result.name, 'Order', 'name matches');
		t.equals(result.schema, schema, 'schema matches');
		t.deepEquals(result.requires, [ 'AdminUser', 'ClientUser', 'Client' ], 'requirement matches');
	});

	s.test('format for an interface', async (t) => {
		const formatter = new Formatter(parsed, {

		});
		const result = formatter.format('User');
		const schema = stripIndent`
			fragment User on User {
			  ... on AdminUser { ... AdminUser }
			  ... on ClientUser { ... ClientUser }
			}
		`;
		t.equals(result.name, 'User', 'name matches');
		t.equals(result.schema, schema, 'schema matches');
		t.deepEquals(result.requires, [ 'AdminUser', 'ClientUser' ], 'requirement matches');
	});

	s.test('format for an interface, descending into types', async (t) => {
		const formatter = new Formatter(parsed, {
			descendInterfaceTypes: true,
		});
		const result = formatter.format('User');
		const schema = stripIndent`
			fragment User on User {
			  ... on AdminUser {
			    id
			    name
			    email
			    type
			    permissions {
			      create
			      cancel
			      approve
			    }
			  }
			  ... on ClientUser {
			    id
			    name
			    email
			    type
			  }
			}
		`;
		t.equals(result.name, 'User', 'name matches');
		t.equals(result.schema, schema, 'schema matches');
		t.deepEquals(result.requires, [ ], 'requirement matches');
	});

	s.test('format for an interface, descending into a single type', async (t) => {
		const formatter = new Formatter(parsed, {
			descendInto: [ 'ClientUser' ],
		});
		const result = formatter.format('User');
		const schema = stripIndent`
			fragment User on User {
			  ... on AdminUser { ... AdminUser }
			  ... on ClientUser {
			    id
			    name
			    email
			    type
			  }
			}
		`;
		t.equals(result.name, 'User', 'name matches');
		t.equals(result.schema, schema, 'schema matches');
		t.deepEquals(result.requires, [ 'AdminUser' ], 'requirement matches');
	});

});

suite('formatter without resolvers', (s) => {
	const parsed = parser(typeDefs);

	s.test('include unresolved, exclude resolved', async (t) => {
		const formatter = new Formatter(parsed, {
			includeUnresolved: true,
			includeResolved: false,
		});
		const result = formatter.format('Order');
		const schema = stripIndent`
			fragment Order on Order {
			  id
			  dateCreated
			  createdby
			  creator { ... User }
			  client { ... Client }
			  status
			  address { ... Address }
			}
		`;
		t.equals(result.name, 'Order', 'name matches');
		t.equals(result.schema, schema, 'schema matches');
		t.deepEquals(result.requires, [ 'User', 'Client', 'Address' ], 'requirement matches');
	});

});
