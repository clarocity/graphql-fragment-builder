
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

	s.test('with hash', async (t) => {
		const fragmenter = importer(formatter);
		const fragmentRef = fragmenter('Order', { hash: true });

		const fragmentName = fragmentRef.replace('... ', '');
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

		t.strictEqual(fragmentName.slice(0, -4), 'Order');
		t.strictEqual(fragmenter.fragments, expectedFragment, 'fragments matched');
	});

	s.test('with hashAll', async (t) => {
		const fragmenter = importer(formatter);
		const fragmentRef = fragmenter('Order', { hashAll: true, descendResolved: false });

		const fragmentName = fragmentRef.replace('... ', '');
		const hash = fragmentName.slice(-4);

		const expectedFragment = stripIndent`
			fragment ${fragmentName} on Order {
			  id
			  dateCreated
			  createdby
			  status
			  address { ... Address${hash} }
			}
			fragment Address${hash} on Address {
			  address1
			  address2
			  city
			  state
			  zip
			}
		`;

		t.strictEqual(fragmentName, 'Order' + hash);
		t.strictEqual(fragmenter.fragments, expectedFragment, 'fragments matched');
	});
});
