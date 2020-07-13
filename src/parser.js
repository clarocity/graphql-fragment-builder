const { parse } = require('graphql');
const { buildASTSchema } = require('graphql/utilities');

const objectReduce = require('./reduce');

/**
 * Parses schema into format readily digestible for the formatter object.
 * @param  {string} typeDefs GraphQL Schema
 * @param  {object} [resolvers] Resolver tree, as per ApolloServer
 * @return {object}           [description]
 */
module.exports = exports =  function generateFragmentData (typeDefs, resolvers) {
	const document = parse(typeDefs, { noLocation: true });
	const ast = buildASTSchema(document);

	const typeNames = Object.keys(ast.getTypeMap()).filter((typeName) => {
		if (ast.getType(typeName) === undefined) return false;
		if (![ 'GraphQLObjectType', 'GraphQLInputObjectType', 'GraphQLInterfaceType', 'GraphQLUnionType' ].includes((ast.getType(typeName)).constructor.name)) return false;
		if (typeName.startsWith('__')) return false;
		if (typeName === (ast.getQueryType()).name) return false;

		const mut = ast.getMutationType();
		if (mut && mut.name === typeName) return false;

		const sub = ast.getSubscriptionType();
		if (sub && sub.name === typeName) return false;

		return true;
	});

	const typeFamilyMap = [];

	const fragments = objectReduce(typeNames, (typeName) => {
		const type = ast.getType(typeName);

		if (type.constructor.name === 'GraphQLUnionType') {
			return [ typeName, {
				fields: {},
				children: type.getTypes().map((t) => t.name),
			} ];
		}

		const typeFields = type.getFields();
		const fields = objectReduce(typeFields, (field, fieldName) => {
			let constructorName = field.type.constructor.name;
			if (constructorName === 'Object') {
				constructorName = (
					field.type.name
					&& (ast.getType(field.type.name.value)).constructor.name
				) || null;
			}

			if (constructorName === 'GraphQLList') {
				field = (field.astNode.type.type.type && field.astNode.type.type.type)
				|| ((field.astNode.type.type && field.astNode.type.type) || null);

				if (field === null) {
					throw new Error('Schema malformed - list');
				}
				constructorName = (ast.getType(field.name.value)).constructor.name;
			}

			if (constructorName === 'GraphQLNonNull' || field.kind === 'NonNullType') {
				field = (field.astNode.type && field.astNode.type) || field.type;
				constructorName = (
					field.type.name
					&& (ast.getType(field.type.name.value)).constructor.name
				) || null;

				if (constructorName === null) {
					field = (field.type && field.type) || null;
					constructorName = (
						field.type.name
						&& (ast.getType(field.type.name.value)).constructor.name
					) || null;
				}
			}

			const fieldType = (
				(field.name && field.name.value)
				|| (field.type.name.value && field.type.name.value)
				|| field.type.name
			);

			const details = {
				type: fieldType,
				primitive: (constructorName === 'GraphQLScalarType' || constructorName === 'GraphQLEnumType'),
				nested: ([ 'GraphQLObjectType', 'GraphQLInputObjectType', 'GraphQLInterfaceType', 'GraphQLUnionType' ].includes(constructorName) ),
				// constructorName,
			};

			if (resolvers) {
				details.resolved = !(resolvers[typeName] && typeof resolvers[typeName][fieldName] === 'function');
			}

			return [ fieldName, details ];
		});

		const typeDec = {
			fields,
		};

		if (type.constructor.name === 'GraphQLObjectType') {
			const interfaces = type.getInterfaces();
			if (interfaces && interfaces.length) {
				typeDec.parents = interfaces.map(({ name }) => name);
				interfaces.forEach(({ name }) => {
					typeFamilyMap.push([ name, typeName ]);
				});
			}

		}

		return [ typeName, typeDec ];
	});

	typeFamilyMap.forEach(([ parentName, childName ]) => {
		var parent = fragments[parentName];
		if (!parent) return;

		if (parent.children) {
			parent.children.push(childName);
			parent.children.sort();
		} else {
			parent.children = [ childName ];
		}
	});

	return fragments;
};
