
const suite = require('tapsuite');
const { typeDefs, resolvers } = require('./_scaffolding');
const parser = require('../src/parser');
const Formatter = require('../src/formatter');
const importer = require('../src/importer');
const stripIndent = require('common-tags/lib/stripIndent');

suite('formatter', (s) => {
	const parsed = parser(typeDefs, resolvers);
	const formatter = new Formatter(parsed);

	s.test('with defaults', async (t) => {
		const fragmenter = importer(formatter);

		const result = stripIndent`
			{
				order(id: 5) {
					${fragmenter('Order')}
				}
			}
		` + '\n' + fragmenter.fragments;

		const expected = stripIndent`
			{
				order(id: 5) {
					... Order
				}
			}
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

		t.strictEqual(result, expected, 'query had contents');
	});

	s.test('with invocation options', async (t) => {
		const fragmenter = importer(formatter);
		const fragmentRef = fragmenter('Order', { hash: true });
		const fragmentName = fragmentRef.replace('... ', '');
		const fragmentHash = fragmentName.slice(-6);


		const expectedFragment = stripIndent`
			fragment ${fragmentName} on Order {
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

		t.strictEqual(fragmentName.slice(0, -6), 'Order');
		t.strictEqual(fragmentHash, 'A6A72E');
		t.strictEqual(fragmenter.fragments, expectedFragment, 'fragments matched');
	});

	s.test('with no descend', async (t) => {
		const fragmenter = importer(formatter);
		const fragmentRef = fragmenter('Order', { descendResolved: false });

		const fragmentName = fragmentRef.replace('... ', '');
		const fragmentHash = fragmentName.slice(-6);

		const expectedFragment = stripIndent`
			fragment Address${fragmentHash} on Address {
			  address1
			  address2
			  city
			  state
			  zip
			}
			fragment ${fragmentName} on Order {
			  id
			  dateCreated
			  createdby
			  status
			  address { ... Address${fragmentHash} }
			}
		`;

		t.strictEqual(fragmentName, 'Order' + fragmentHash);
		t.strictEqual(fragmenter.fragments, expectedFragment, 'fragments matched');
	});

	s.test('deep fragmenting with renaming', async (t) => {
		const formatter = new Formatter(parsed, { // eslint-disable-line no-shadow
			// disable all automatic inclusions
			includeResolved: false,
			includeUnresolved: false,
			descendResolved: false,

			Order: {
				include: [ 'client', 'address' ],
				foo: 'bar',
				Client: {
					name: 'OrderClient',
					include: [ 'name' ],
				},
			},
			Address: {
				includeResolved: true,
			},
			Client: {
				descendResolved: true,
				include: [ 'name', 'address' ],
			},
		});
		const fragmenter = importer(formatter, { hash: false });
		const fragmentRefs = [ fragmenter('Order'), fragmenter('Client') ];

		const expectedFragments = stripIndent`
			fragment OrderClient on Client {
			  name
			}
			fragment Address on Address {
			  address1
			  address2
			  city
			  state
			  zip
			}
			fragment Order on Order {
			  client { ... OrderClient }
			  address { ... Address }
			}
			fragment Client on Client {
			  name
			  address {
			    address1
			    address2
			    city
			    state
			    zip
			  }
			}

		`;

		t.deepEqual(fragmentRefs, [ '... Order', '... Client' ], 'fragment references');
		t.strictEqual(fragmenter.fragments, expectedFragments, 'fragment schema');
	});
});
