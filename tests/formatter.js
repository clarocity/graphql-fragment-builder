
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
		t.deepEquals(result.requires, {}, 'requirement matches');
	});

	s.test('parses with type overrides', async (t) => {
		const formatter = new Formatter(parsed, {
			descendResolved: false,
			Order: {
				prefix: 'OP_',
				suffix: '_OS',
			},
			Address: {
				prefix: 'AP_',
				suffix: '_AS',
			},
		});
		const result = formatter.format('Order');
		const schema = stripIndent`
			fragment OP_Order_OS on Order {
			  id
			  dateCreated
			  createdby
			  status
			  address { ... AP_Address_AS }
			}
		`;
		t.equals(result.name, 'OP_Order_OS', 'name matches');
		t.equals(result.schema, schema, 'schema matches');
		t.deepEquals(result.requires, {
			'AP_Address_AS': 'fragment AP_Address_AS on Address {\n  address1\n  address2\n  city\n  state\n  zip\n}',
		}, 'requirement matches');
	});

	s.test('parses with deep type overrides', async (t) => {
		const formatter = new Formatter(parsed, {
			descendResolved: false,
			Order: {
				prefix: 'OP_',
				suffix: '_OS',
				Address: {
					prefix: null,
					suffix: null,
					name: 'ADDRESS',
				},
			},
			Address: {
				prefix: 'AP_',
				suffix: '_AS',
			},
		});
		const result = formatter.format('Order');
		const schema = stripIndent`
			fragment OP_Order_OS on Order {
			  id
			  dateCreated
			  createdby
			  status
			  address { ... ADDRESS }
			}
		`;
		t.equals(result.name, 'OP_Order_OS', 'name matches');
		t.equals(result.schema, schema, 'schema matches');
		t.deepEquals(result.requires, {
			'ADDRESS': 'fragment ADDRESS on Address {\n  address1\n  address2\n  city\n  state\n  zip\n}',
		}, 'requirement matches');
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
		t.deepEquals(result.requires, {}, 'requirement matches');
	});

	s.test('parses with deep options', async (t) => {
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
		t.deepEquals(result.requires, {
			'Address': 'fragment Address on Address {\n  address1\n  address2\n  city\n  state\n  zip\n}',
		}, 'requirement matches');
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
		t.deepEquals(result.requires, {
			AdminUser: 'fragment AdminUser on AdminUser {\n  \n}',
			Client: 'fragment Client on Client {\n  users { ... ClientUser }\n  orders { ... Order }\n}',
			ClientUser: 'fragment ClientUser on ClientUser {\n  client { ... Client }\n}',
			User: 'fragment User on User {\n  ... on AdminUser { ... AdminUser }\n  ... on ClientUser { ... ClientUser }\n}',
		}, 'requirement matches');
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
		t.deepEquals(result.requires, {
			AdminUser: 'fragment AdminUser on AdminUser {\n  \n}',
			Client: 'fragment Client on Client {\n  users { ... ClientUser }\n  orders { ... Order }\n}',
			ClientUser: 'fragment ClientUser on ClientUser {\n  client { ... Client }\n}',
		}, 'requirement matches');
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
		t.deepEquals(result.requires, {
			AdminUser: 'fragment AdminUser on AdminUser {\n  id\n  name\n  email\n  type\n  permissions {\n    create\n    cancel\n    approve\n  }\n}',
			ClientUser: 'fragment ClientUser on ClientUser {\n  id\n  name\n  email\n  type\n}',
		}, 'requirement matches');
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
		t.deepEquals(result.requires, {}, 'requirement matches');
	});

	s.test('format for an interface, descending into types based on suboption', async (t) => {
		const formatter = new Formatter(parsed, {
			User: {
				descendInterfaceTypes: true,
			},
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
		t.deepEquals(result.requires, {}, 'requirement matches');
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
		t.deepEquals(result.requires, {
			AdminUser: 'fragment AdminUser on AdminUser {\n  id\n  name\n  email\n  type\n  permissions {\n    create\n    cancel\n    approve\n  }\n}',
		}, 'requirement matches');
	});

});

suite('formatter without resolvers', (s) => {
	const parsed = parser(typeDefs);

	s.test('include unresolved, exclude resolved', async (t) => {
		const formatter = new Formatter(parsed, {
			includeUnresolved: true,
			includeResolved: true,
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
		t.deepEquals(result.requires, {
			AdminPermissions: 'fragment AdminPermissions on AdminPermissions {\n  create\n  cancel\n  approve\n}',
			AdminUser: 'fragment AdminUser on AdminUser {\n  id\n  name\n  email\n  type\n  permissions { ... AdminPermissions }\n}',
			Address: 'fragment Address on Address {\n  address1\n  address2\n  city\n  state\n  zip\n}',
			Client: 'fragment Client on Client {\n  id\n  name\n  address { ... Address }\n  users { ... ClientUser }\n  orders { ... Order }\n}',
			ClientUser: 'fragment ClientUser on ClientUser {\n  id\n  name\n  email\n  type\n  client { ... Client }\n}',
			User: 'fragment User on User {\n  ... on AdminUser { ... AdminUser }\n  ... on ClientUser { ... ClientUser }\n}',
		}, 'requirement matches');
	});

});

suite('format multiple', (s) => {
	const parsed = parser(typeDefs);

	s.test('include unresolved, exclude resolved', async (t) => {
		const formatter = new Formatter(parsed, {

		});
		const result = formatter.formatAll();
		t.deepEquals(result, {
			AdminPermissions: 'fragment AdminPermissions on AdminPermissions {\n  create\n  cancel\n  approve\n}',
			AdminUser: 'fragment AdminUser on AdminUser {\n  id\n  name\n  email\n  type\n  permissions { ... AdminPermissions }\n}',
			Address: 'fragment Address on Address {\n  address1\n  address2\n  city\n  state\n  zip\n}',
			Client: 'fragment Client on Client {\n  id\n  name\n  address { ... Address }\n  users { ... ClientUser }\n  orders { ... Order }\n}',
			ClientUser: 'fragment ClientUser on ClientUser {\n  id\n  name\n  email\n  type\n  client { ... Client }\n}',
			User: 'fragment User on User {\n  ... on AdminUser { ... AdminUser }\n  ... on ClientUser { ... ClientUser }\n}',
			Order: 'fragment Order on Order {\n  id\n  dateCreated\n  createdby\n  creator { ... User }\n  client { ... Client }\n  status\n  address { ... Address }\n}',
			Agent: 'fragment Agent on Agent {\n  id\n  name\n  address { ... Address }\n}',
			ThirdParty: 'fragment ThirdParty on ThirdParty {\n  ... on Client { ... Client }\n  ... on Agent { ... Agent }\n}',
			Unused: 'fragment Unused on Unused {\n  nothing\n}',
		}, 'requirement matches');
	});

	s.test('nested type options', async (t) => {
		const formatter = new Formatter(parsed, {
			Client: {
				Address: {
					name: 'ClientAddress',
					exclude: [ 'address1', 'address2' ],
				},
			},
		});
		const result = formatter.format({ debug: { origin: true } });
		t.deepEquals(result, {
			AdminPermissions: 'fragment AdminPermissions on AdminPermissions {\n  # Origin: AdminPermissions\n  create\n  cancel\n  approve\n}',
			AdminUser: 'fragment AdminUser on AdminUser {\n  # Origin: AdminUser\n  id\n  name\n  email\n  type\n  permissions { ... AdminPermissions }\n}',
			Address: 'fragment Address on Address {\n  # Origin: Address\n  address1\n  address2\n  city\n  state\n  zip\n}',
			ClientAddress: 'fragment ClientAddress on Address {\n  # Origin: Client->Address\n  city\n  state\n  zip\n}',
			Client: 'fragment Client on Client {\n  # Origin: Client\n  id\n  name\n  address { ... ClientAddress }\n  users { ... ClientUser }\n  orders { ... Order }\n}',
			ClientUser: 'fragment ClientUser on ClientUser {\n  # Origin: ClientUser\n  id\n  name\n  email\n  type\n  client { ... Client }\n}',
			User: 'fragment User on User {\n  # Origin: User\n  ... on AdminUser { ... AdminUser }\n  ... on ClientUser { ... ClientUser }\n}',
			Order: 'fragment Order on Order {\n  # Origin: Order\n  id\n  dateCreated\n  createdby\n  creator { ... User }\n  client { ... Client }\n  status\n  address { ... Address }\n}',
			Agent: 'fragment Agent on Agent {\n  # Origin: Agent\n  id\n  name\n  address { ... Address }\n}',
			ThirdParty: 'fragment ThirdParty on ThirdParty {\n  # Origin: ThirdParty\n  ... on Client { ... Client }\n  ... on Agent { ... Agent }\n}',
			Unused: 'fragment Unused on Unused {\n  # Origin: Unused\n  nothing\n}',
		}, 'requirement matches');
	});

	s.test('tiered type options', async (t) => {
		const formatter = new Formatter(parsed, {
			debug: { origin: true },
			levels: [
				{ descendInto: true },
				{ descendInto: false },
				{ includeNested: false },
			],
		});
		const result = formatter.format([ 'User', 'Client' ]);

		t.deepEquals(result, {
			User: 'fragment User on User {\n  # Origin: User\n  ... on AdminUser {\n    # Origin: User->AdminUser\n    id\n    name\n    email\n    type\n    permissions { ... AdminPermissions }\n  }\n  ... on ClientUser {\n    # Origin: User->ClientUser\n    id\n    name\n    email\n    type\n    client { ... Client }\n  }\n}',
			Client: 'fragment Client on Client {\n  # Origin: Client\n  id\n  name\n  address {\n    # Origin: Client->Address\n    address1\n    address2\n    city\n    state\n    zip\n  }\n  users {\n    # Origin: Client->ClientUser\n    id\n    name\n    email\n    type\n    client { ... Client }\n  }\n  orders {\n    # Origin: Client->Order\n    id\n    dateCreated\n    createdby\n    creator { ... User }\n    client { ... Client }\n    status\n    address { ... Address }\n  }\n}',

			Address: 'fragment Address on Address {\n  # Origin: Client->Order->Address\n  address1\n  address2\n  city\n  state\n  zip\n}',
			AdminPermissions: 'fragment AdminPermissions on AdminPermissions {\n  # Origin: User->AdminUser->AdminPermissions\n  create\n  cancel\n  approve\n}',
			AdminUser: 'fragment AdminUser on AdminUser {\n  # Origin: Client->Order->User->AdminUser\n  id\n  name\n  email\n  type\n}',
			ClientUser: 'fragment ClientUser on ClientUser {\n  # Origin: Client->Order->User->ClientUser\n  id\n  name\n  email\n  type\n}',
		}, 'requirement matches');
	});

});
