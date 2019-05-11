
const fs = require('fs');
const path = require('path');
const { GraphQLScalarType } = require('graphql');
const { GraphQLError } = require('graphql/error');
const { Kind } = require('graphql/language');

const Date = new GraphQLScalarType({
	name: 'Date',
	description: 'Date type',
	parseValue (value) {
		// value comes from the client
		return new Date(value); // sent to resolvers
	},
	serialize (value) {
		// value comes from resolvers
		return value.toISOString(); // sent to the client
	},
	parseLiteral (ast) {
		// ast comes from parsing the query
		// this is where you can validate and transform
		if (ast.kind !== Kind.STRING) {
			throw new GraphQLError(
				`Query error: Can only parse dates strings, got a: ${ast.kind}`,
				[ ast ],
			);
		}
		if (isNaN(Date.parse(ast.value))) {
			throw new GraphQLError('Query error: not a valid date', [ ast ]);
		}
		return new Date(ast.value);
	},
});


exports.typeDefs = fs.readFileSync(
	path.resolve(__dirname, 'schema.graphql'),
	{ encoding: 'utf8' }
);

// None of these resolvers are actually going to be invoked,
// this is just here to match the schema expectations
exports.resolvers = {
	Date,
	Query: {
		Client: () => {},
		User: () => {},
		Order: () => {},
	},
	Mutation: {
		createOrder: () => {},
		changeOrderStatus: () => {},
	},
	UserType: {
		ADMIN: 1,
		CLIENT: 2,
	},
	User: {
		__resolveType: ({ type }) => (
			{
				1: 'AdminUser',
				2: 'ClientUser',
			}[type]
		),
	},
	Order: {
		creator: () => {},
		client: () => {},
	},
	ClientUser: {
		client: () => {},
	},
	Client: {
		users: () => {},
		orders: () => {},
	},
};
