class Meta {

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
	static async onViewLoad(user, lists, nav, keystone) {
		// if(!user) return;
		// console.log(user);
		// switch(user.role){
		// 	case 'Stockist':
		// 		console.log('Stockist');
		// 		nav.sections = nav.sections.filter(section => section.key === 'Reports');
		// 		nav.sections.forEach(s => s.lists = s.lists.filter(l => l.key === 'RetailerDayWiseReport' || l.key === 'GamePlayWiseReport__disable'));
		// 		Object.keys(lists).forEach(key => {
		// 			if(key === 'CreditLedgerEntry'){
		//				
		// 			} else {
		// 				console.log(key);
		// 				// lists[key].hidden = true;
		// 				lists[key].nocreate = true;
		// 				lists[key].noedit = true;
		// 				lists[key].nodelete = true;
		// 				lists[key].noyo = true;
		// 			}
		// 		});
		// 		break;
		// }
		// require('fs').writeFileSync('./_lists.json', JSON.stringify(lists));
		// require('fs').writeFileSync('./_nav.json', JSON.stringify(nav));
		// if (roleData && (roleData._id.toString() !== req.user.role.toString())) {
		// 	lists['Customer']['nocreate'] = true;
		// 	lists['Customer']['nodelete'] = true;
		// 	lists['Customer']['noedit'] = true;
		// lists["Followup"].nameIsInitial = false;
		// lists["AwbUploadRequest"].nameIsInitial = false;
		// keystone.nav.sections = keystoneNavSections.filter((el) => el.key !== 'Tools');
		// } else {
		//lists["Customer"]["fields"]["verifiedOn"]["noedit"] = false;
		//keystone.nav.sections = keystoneNavSections;
		// }
	}

}

exports = module.exports = Meta;
