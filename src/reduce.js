
/**
 * Iterates over a collection and generates an object based on tuple returned from the iteratee.
 * @param  {Object|Array|Map|Set} collection
 * @param  {Function} iteratee Callback invoked for each item, receives `value, key, index`, returns `[key, value]`;
 * @return {Object}
 */
module.exports = exports = function objectReduce (collection, cb) {
	if (!collection) return {};
	const isArray = Array.isArray(collection);

	const result = {};
	function iterate (v, k, i) {
		// return true to continue looping
		const res = cb(v, k, i) || [];
		if (res === false) return false;
		if (!res) return true;
		const [ key, value ] = res;
		if (key === undefined || key === null || value === undefined) return true;
		result[key] = value;
		return true;
	}

	if (isArray) {
		for (let i = 0; i < collection.length; i++) {
			if (!iterate(collection[i], i, i)) break;
		}
		return result;
	}

	if (collection instanceof Set) {
		let i = 0;
		for (let item of collection) {
			if (!iterate(item, i, i)) break;
		}
		return result;
	}

	// received a Map
	if (collection instanceof Map) {
		const keys = Array.from(collection.keys());
		for (let i = 0; i < keys.length; i++) {
			if (!iterate(collection.get(keys[i]), keys[i], i)) break;
		}
		return result;
	}

	// received an object hash
	if (collection && typeof collection === 'object') {
		// iterating object
		const keys = Object.keys(collection);
		for (let i = 0; i < keys.length; i++) {
			if (!iterate(collection[keys[i]], keys[i], i)) break;
		}
		return result;
	}

	return result;
};
