graphql-fragment-builder
===

This is a library for parsing your graphql schema and resolver tree (as passed to ApolloServer) and generates fragments for use in graphql queries.

### Example

```graphql
type Order {
    id: ID!
    creator: User # resolved separately
    address: Address
}

type Address {
    address1: String
    address2: String
    city: String
    state: String
    zip: String
}

interface User {
    id: ID!
    name: String
    email: String!
}

type AdminUser implements User {
    id: ID!
    name: String
    email: String!
}

type ClientUser implements User {
    id: ID!
    name: String
    email: String!
    companyName: String
}
```

Produces:

```graphql
fragment Order on Order {
	id
	address {
		address1
		address2
		city
		state
		zip
	}
}

fragment Address on Address {
	address1
	address2
	city
	state
	zip
}

fragment User on User {
	... on AdminUser { ... AdminUser }
	... on ClientUser { ... ClientUser }
}

fragment AdminUser on AdminUser {
	id
	name
	email
}

fragment ClientUser on ClientUser {
	id
	name
	email
	companyName
}
```

### Usage

```js
const fragmentBuilder = require('graphql-fragment-builder');
const schema = require('fs').readFileSync(require.resolve('./schema.graphql'), { encoding: 'utf8' });
const resolvers = require('./resolvers');
const fragments = fragmentBuilder(schema, resolvers).formatAll();

console.log(fragments);
```

### API

**`GFB(schema, [resolvers])`**

Parses schema and returns a Formatter instance.

Arguments:

- `schema` (string): GraphQL schema
- `resolvers` (object): Optional, but highly recommended. This is an object hash of all resolver functions for your server. [See ApolloServer docs for more details.](https://www.apollographql.com/docs/tutorial/resolvers). No functions on this tree are invoked, but the tree itself is used to determine what fields are automatically resolved within a Type.

**`const parsedTypeData = GFB.parser(schema, [resolvers])`**

Parses schema into the intermediary data structure that is used to format the fragments. Should only be used if you are creating a Formatter directly.


**`const formatter = new GFB.Formatter(parsedTypeData, [options])`**

Formatting class that generates fragments. Options may be passed on the constructor or on the `format` functions.

**`const { schema, requires } = formatter.format(typeName, [options])`**

Generates a fragment definition for the requested `typeName`, which matches a Type in your schema. Returns an object consisting of a `schema` property which contains the fragment definition, and a `requires` property which is an array of other fragments that are needed to use this fragment.

**`const fragments = formatter.formatAll([options])`**

Generates fragments for all types and interfaces defined in the schema and returns them as an object hash.

### Options

- **`includeResolved`** (true): Include fields which are natively part of the Type and are not provided by secondary resolvers. This option is ignored if no resolvers are provided.
- **`includeUnresolved`** (false): Include fields which are provided by secondary resolvers. This option is ignored if no resolvers are provided.
- **`includeNested`** (true): Include fields which lead to other Type objects, but which are filled in by the Type's base resolver.
- **`descendResolved`** (true): Fill in the fields for nested Types that are provided by the base resolver.
- **`descendInterfaces`** (false): Fill in the definition for a nested Interface
- **`descendInterfaceTypes`** (false): Include fields for the types that implement an interface.
- **`descendInto`** (null): An array of Type names that should always have their fields filled in. This overrides the other `descend*` options.
- **`ignoreUnknownTypes`** (false): If the formatter encounters a Type name that was not in the parsed type data it received, it will throw an error. Set this to true to suppress that error and output the type name anyway. This options is provided to support parsing multiple schema files.
- **`indentation`** (2 spaces): The string to use when indenting within each fragment level.