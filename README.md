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
const builder = require('graphql-fragment-builder');
const schema = require('fs').readFileSync(require.resolve('./schema.graphql'), { encoding: 'utf8' });
const resolvers = require('./resolvers');
const fragments = builder(schema, resolvers).formatAll();

console.log(fragments);
```

### API

**`builder(schema, [resolvers])`**

Parses schema and returns a Formatter instance.

Arguments:

- `schema` (string): GraphQL schema
- `resolvers` (object): Optional, but highly recommended. This is an object hash of all resolver functions for your server. [See ApolloServer docs for more details.](https://www.apollographql.com/docs/tutorial/resolvers). No functions on this tree are invoked, but the tree itself is used to determine what fields are automatically resolved within a Type.

**`const parsedTypeData = builder.parser(schema, [resolvers])`**

Parses schema into the intermediary data structure that is used to format the fragments. Should only be used if you are creating a Formatter directly.

**`const formatter = builder(schema, resolvers, [options])`**   
**`const formatter = new builder.Formatter(parsedTypeData, [options])`**

Formatting class that generates fragments. Options may be passed on the constructor or on the `format` functions.


**`const { schema, requires } = formatter.format(typeName, [options])`**   
**`const { schema, requires } = formatter.formatSingle(typeName, [options])`**

Generates a fragment definition for the requested `typeName`, which matches a Type in your schema. Returns an object consisting of a `schema` property which contains the fragment definition, and a `requires` property which is an object hash of other fragments that are needed to use this fragment.


**`const fragments = formatter.format(Array<typeName>, [options])`**   
**`const fragments = formatter.formatMultiple(Array<typeName>, [options])`**

Generates fragments for the named fragments and returns them as an object hash, along with any extra fragments required by those requested.


**`const fragments = formatter.format([options])`**   
**`const fragments = formatter.formatAll([options])`**

Generates fragments for all types and interfaces defined in the schema and returns them as an object hash, along with any extra fragments generated due to configuration.

**`const importer = builder(schema, resolvers, [options]).importer([options])`**   
**`const importer = builder.importer(formatter)`**

Creates a fragment importer for use in constructing queries. See below.

### Options

- **`include`** (null): An array of field names or types that should always be included on the fragment.
- **`exclude`** (null): An array of field names or types that should always be excluded from the fragment.
- **`includeResolved`** (true): Include fields which are natively part of the Type and are not provided by secondary resolvers. This option is ignored if no resolvers are provided.
- **`includeUnresolved`** (false): Include fields which are provided by secondary resolvers. This option is ignored if no resolvers are provided.
- **`includeNested`** (true): Include fields which lead to other Type objects, but which are filled in by the Type's base resolver.
- **`descendResolved`** (true): Fill in the fields for nested Types that are provided by the parent Type's resolver.
- **`descendUnresolved`** (true): Fill in the fields for nested Types that are not provided by the parent Type's resolver.
- **`descendInterfaces`** (false): Fill in the definition for a nested Interface
- **`descendInterfaceTypes`** (false): Include fields for the types that implement an interface.
- **`descendInto`** (null): An array of Type names or Field names that should always have their fields filled in. This overrides the other `descend*` options.
- **`ignoreUnknownTypes`** (false): If the formatter encounters a Type name that was not in the parsed type data it received, it will throw an error. Set this to true to suppress that error and output the type name anyway. This options is provided to support parsing multiple schema files.
- **`indentation`** (2 spaces): The string to use when indenting within each fragment level.
- **`prefix`** (null): Text to prepend to fragment names.
- **`suffix`** (null): Text to append to fragment names.
- **`name`** (null): Override the name to be used for the fragment. This can only be used for targeted overrides, as it would override all fragment dependencies as well.
- **`levels`** (null): Provide an array of objects containing option overrides for different levels of nesting within the Type structure. See below.

**Targeted Overrides:**

The `levels` options allows you to provide overrides for different depths within type resolution. For example, say you have an Order type which has a field that uses a Customer type.

```graphql
type Order {
  customer Customer
}

type Customer {
  name String
  address Address
}

type Address {
  street
  city
  state
  zip
}
```

The following config will descend into the Customer entry, but disallow the Address.

```js
const options = {
  levels: [
    { descendResolved: true },
    { descendResolved: false },
  ],
};
```

Option overrides may also be provided for Type names by including the Type's name in the options object. This config defines explicitly what fields should be included for each Type.

```js
const options = {
  // disable all automatic inclusions
  includeResolved: false,
  includeUnresolved: false,
  Order: {
    include: [ 'customer' ], // only include the customer field
    Customer: {
      name: 'OrderCustomer', // rename the fragment for this specific Customer use
      include: [ 'name' ], // only include the name field on this fragment
    },
  },
  Customer: {
    includeResolved: true, // include all resolved fields on the Customer type
    descendInto: [ 'Address' ],
  },
};
```

## Fragment Importer

The fragment importer is a tool provided to make constructing queries easier.

```js
const gql = require('graphql-tag');
const importer = builder(schema, resolvers).importer();
const query = gql`
  {
    order (id: 123) {
      ${importer('Order')}
    }
  }

  ${importer.fragments}
`;
```

Calling `importer` generates a fragment for the requested type, along with any dependent fragments, and returns the fragment reference (eg: `... Order`). By default.

You may also provide Formatter options on the `importer` call. By default, this will cause the fragments generated to have their names appended with a hash of the options passed. This is to ensure there are no conflicts with other fragments generated with different options.
