
const suite = require('tapsuite');
const { typeDefs, resolvers } = require('./_scaffolding');
const parser = require('../src/parser');

suite('parser', (s) => {

	s.test('parses schema & resolvers', async (t) => {
		t.plan(1);
		const result = parser(typeDefs, resolvers);

		t.deepEqual(result, {
			'Client': {
				fields: {
					'id': {
						'type': 'ID',
						'resolved': true,
						'primitive': true,
						'nested': false,
					},
					'name': {
						'type': 'String',
						'resolved': true,
						'primitive': true,
						'nested': false,
					},
					'address': {
						'type': 'Address',
						'resolved': true,
						'primitive': false,
						'nested': true,
					},
					'users': {
						'type': 'ClientUser',
						'resolved': false,
						'primitive': false,
						'nested': true,
					},
					'orders': {
						'type': 'Order',
						'resolved': false,
						'primitive': false,
						'nested': true,
					},
				},
			},
			'Address': {
				fields: {
					'address1': {
						'type': 'String',
						'resolved': true,
						'primitive': true,
						'nested': false,
					},
					'address2': {
						'type': 'String',
						'resolved': true,
						'primitive': true,
						'nested': false,
					},
					'city': {
						'type': 'String',
						'resolved': true,
						'primitive': true,
						'nested': false,
					},
					'state': {
						'type': 'String',
						'resolved': true,
						'primitive': true,
						'nested': false,
					},
					'zip': {
						'type': 'String',
						'resolved': true,
						'primitive': true,
						'nested': false,
					},
				},
			},
			'ClientUser': {
				fields: {
					'id': {
						'type': 'ID',
						'resolved': true,
						'primitive': true,
						'nested': false,
					},
					'name': {
						'type': 'String',
						'resolved': true,
						'primitive': true,
						'nested': false,
					},
					'email': {
						'type': 'String',
						'resolved': true,
						'primitive': true,
						'nested': false,
					},
					'type': {
						'type': 'UserType',
						'resolved': true,
						'primitive': true,
						'nested': false,
					},
					'client': {
						'type': 'Client',
						'resolved': false,
						'primitive': false,
						'nested': true,
					},
				},
				parents: [ 'User' ],
			},
			'User': {
				'fields': {
					'id': {
						'type': 'ID',
						'resolved': true,
						'primitive': true,
						'nested': false,
					},
					'name': {
						'type': 'String',
						'resolved': true,
						'primitive': true,
						'nested': false,
					},
					'email': {
						'type': 'String',
						'resolved': true,
						'primitive': true,
						'nested': false,
					},
					'type': {
						'type': 'UserType',
						'resolved': true,
						'primitive': true,
						'nested': false,
					},
				},
				'children': [
					'AdminUser',
					'ClientUser',
				],
			},
			'Order': {
				fields: {
					'id': {
						'type': 'ID',
						'resolved': true,
						'primitive': true,
						'nested': false,
					},
					'dateCreated': {
						'type': 'Date',
						'resolved': true,
						'primitive': true,
						'nested': false,
					},
					'createdby': {
						'type': 'ID',
						'resolved': true,
						'primitive': true,
						'nested': false,
					},
					'creator': {
						'type': 'User',
						'resolved': false,
						'primitive': false,
						'nested': true,
					},
					'client': {
						'type': 'Client',
						'resolved': false,
						'primitive': false,
						'nested': true,
					},
					'status': {
						'type': 'OrderStatus',
						'resolved': true,
						'primitive': true,
						'nested': false,
					},
					'address': {
						'type': 'Address',
						'resolved': true,
						'primitive': false,
						'nested': true,
					},
				},
			},
			'AdminUser': {
				fields: {
					'id': {
						'type': 'ID',
						'resolved': true,
						'primitive': true,
						'nested': false,
					},
					'name': {
						'type': 'String',
						'resolved': true,
						'primitive': true,
						'nested': false,
					},
					'email': {
						'type': 'String',
						'resolved': true,
						'primitive': true,
						'nested': false,
					},
					'type': {
						'type': 'UserType',
						'resolved': true,
						'primitive': true,
						'nested': false,
					},
					'permissions': {
						'type': 'AdminPermissions',
						'resolved': true,
						'primitive': false,
						'nested': true,
					},
				},
				parents: [ 'User' ],
			},
			'AdminPermissions': {
				fields: {
					'create': {
						'type': 'Boolean',
						'resolved': true,
						'primitive': true,
						'nested': false,
					},
					'cancel': {
						'type': 'Boolean',
						'resolved': true,
						'primitive': true,
						'nested': false,
					},
					'approve': {
						'type': 'Boolean',
						'resolved': true,
						'primitive': true,
						'nested': false,
					},
				},
			},
			'Agent': {
				fields: {
					'id': {
						'type': 'ID',
						'resolved': true,
						'primitive': true,
						'nested': false,
					},
					'name': {
						'type': 'String',
						'resolved': true,
						'primitive': true,
						'nested': false,
					},
					'address': {
						'type': 'Address',
						'resolved': true,
						'primitive': false,
						'nested': true,
					},
				},
			},
			'ThirdParty': {
				'fields': {},
				'children': [
					'Client',
					'Agent',
				],
			},
			'Unused': {
				'fields': {
					'nothing': {
						'type': 'Int',
						'primitive': true,
						'nested': false,
						resolved: true,
					},
				},
			},
		});
	});

	s.test('parses schema without resolvers', async (t) => {
		t.plan(1);
		const result = parser(typeDefs);

		t.deepEqual(result, {
			'Client': {
				fields: {
					'id': {
						'type': 'ID',
						'primitive': true,
						'nested': false,
					},
					'name': {
						'type': 'String',
						'primitive': true,
						'nested': false,
					},
					'address': {
						'type': 'Address',
						'primitive': false,
						'nested': true,
					},
					'users': {
						'type': 'ClientUser',
						'primitive': false,
						'nested': true,
					},
					'orders': {
						'type': 'Order',
						'primitive': false,
						'nested': true,
					},
				},
			},
			'Address': {
				fields: {
					'address1': {
						'type': 'String',
						'primitive': true,
						'nested': false,
					},
					'address2': {
						'type': 'String',
						'primitive': true,
						'nested': false,
					},
					'city': {
						'type': 'String',
						'primitive': true,
						'nested': false,
					},
					'state': {
						'type': 'String',
						'primitive': true,
						'nested': false,
					},
					'zip': {
						'type': 'String',
						'primitive': true,
						'nested': false,
					},
				},
			},
			'ClientUser': {
				fields: {
					'id': {
						'type': 'ID',
						'primitive': true,
						'nested': false,
					},
					'name': {
						'type': 'String',
						'primitive': true,
						'nested': false,
					},
					'email': {
						'type': 'String',
						'primitive': true,
						'nested': false,
					},
					'type': {
						'type': 'UserType',
						'primitive': true,
						'nested': false,
					},
					'client': {
						'type': 'Client',
						'primitive': false,
						'nested': true,
					},
				},
				parents: [ 'User' ],
			},
			'User': {
				'fields': {
					'id': {
						'type': 'ID',
						'primitive': true,
						'nested': false,
					},
					'name': {
						'type': 'String',
						'primitive': true,
						'nested': false,
					},
					'email': {
						'type': 'String',
						'primitive': true,
						'nested': false,
					},
					'type': {
						'type': 'UserType',
						'primitive': true,
						'nested': false,
					},
				},
				'children': [
					'AdminUser',
					'ClientUser',
				],
			},
			'Order': {
				fields: {
					'id': {
						'type': 'ID',
						'primitive': true,
						'nested': false,
					},
					'dateCreated': {
						'type': 'Date',
						'primitive': true,
						'nested': false,
					},
					'createdby': {
						'type': 'ID',
						'primitive': true,
						'nested': false,
					},
					'creator': {
						'type': 'User',
						'primitive': false,
						'nested': true,
					},
					'client': {
						'type': 'Client',
						'primitive': false,
						'nested': true,
					},
					'status': {
						'type': 'OrderStatus',
						'primitive': true,
						'nested': false,
					},
					'address': {
						'type': 'Address',
						'primitive': false,
						'nested': true,
					},
				},
			},
			'AdminUser': {
				fields: {
					'id': {
						'type': 'ID',
						'primitive': true,
						'nested': false,
					},
					'name': {
						'type': 'String',
						'primitive': true,
						'nested': false,
					},
					'email': {
						'type': 'String',
						'primitive': true,
						'nested': false,
					},
					'type': {
						'type': 'UserType',
						'primitive': true,
						'nested': false,
					},
					'permissions': {
						'type': 'AdminPermissions',
						'primitive': false,
						'nested': true,
					},
				},
				parents: [ 'User' ],
			},
			'Agent': {
				fields: {
					'id': {
						'type': 'ID',
						'primitive': true,
						'nested': false,
					},
					'name': {
						'type': 'String',
						'primitive': true,
						'nested': false,
					},
					'address': {
						'type': 'Address',
						'primitive': false,
						'nested': true,
					},
				},
			},
			'ThirdParty': {
				'fields': {},
				'children': [
					'Client',
					'Agent',
				],
			},
			'AdminPermissions': {
				fields: {
					'create': {
						'type': 'Boolean',
						'primitive': true,
						'nested': false,
					},
					'cancel': {
						'type': 'Boolean',
						'primitive': true,
						'nested': false,
					},
					'approve': {
						'type': 'Boolean',
						'primitive': true,
						'nested': false,
					},
				},
			},
			'Unused': {
				'fields': {
					'nothing': {
						'type': 'Int',
						'primitive': true,
						'nested': false,
					},
				},
			},
		});
	});
});
