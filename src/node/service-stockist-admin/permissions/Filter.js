class Filter {

	/**
	 REQ USER { _id: 5f233a6d88025590e9cbe73a,
			  updatedAt: 2021-03-02T22:22:24.129Z,
			  createdAt: 2020-07-30T21:23:58.151Z,
			  password:
			   '$2a$10$d6WDjgfsYZKXP8vA.7rXVe4kXtL4SHGdR0t5zHgLM.0HPkb9m2fwa',
			  email: 'kushal@codalien.com',
			  __v: 0,
			  role: 'Super Stockist',
			  superStockist: 5f6110f5fe0c5b4013e32ff2,
			  updatedBy: 5f233a6d88025590e9cbe73a,
			  isAdmin: true,
			  name: { last: 'Admin', first: 'Super' } }


	 * */
	static listGet(filters, user) {
		// if (user.role === 'Stockist') {
			if (!filters) {
				filters = {};
			}
			filters.stockist = {inverted: false, value: [(user.stockist || user._id).toString()]};
		// }
		console.log(filters);
		return filters;
	}

}

exports = module.exports = Filter;



