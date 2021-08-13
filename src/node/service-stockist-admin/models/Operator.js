const keystone = require('../ks');
const Types = keystone.Field.Types;

/**
 * Operator Model
 * ==========
 */
const Operator = new keystone.List('Operator', {track: true});

Operator.add({
	name: {type: Types.Text, required: true, index: true},
	username: {type: Types.Text, initial: true, required: true},
	password: {type: Types.Password, initial: true, required: true},
	initialCredits: {type: Types.Number, initial: true, noedit: true},
	isActive: {type: Types.Boolean, initial: true, default: true, index: true}
}, 'Summary', {
	credits: {type: Types.Number, noedit: true, default: 0}
});

/**
 * Registration
 */
Operator.defaultColumns = 'name, username, isActive, credits, updatedAt, updatedBy, createdAt, createdBy';
Operator.register();

const ThisModel = Operator;
ThisModel.model.schema.pre('save', async function (next) {
	try {
		////////////////// SYNC TO ADMIN USER /////////////////////////////////////
		const AdminUser = keystone.list('AdminUser').model;
		const CreditLedgerEntry = keystone.list('CreditLedgerEntry').model;

		if (this.isNew) {
			let checkAdminUserDuplicate = await AdminUser.findOne({email: this.username});
			if (checkAdminUserDuplicate) throw new Error('Duplicate username. Please select an unique username.');
			console.log('Creating Operator', this);
			const login = new AdminUser({
				name: (() => {
					let tokens = this.name.split(' ');
					let fn = tokens.shift();
					let ln = tokens.join(' ');
					return {first: fn.trim(), last: ln.trim()}
				})(),
				email: this.username,
				password: this.password,
				role: 'Operator',
				operator: this._id,
				superStockist: undefined,
				stockist: undefined,
				retailer: undefined,
				isAdmin: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				updatedBy: this.updatedBy,
				createdBy: this.createdBy,
			});
			await login.save();
			await AdminUser.update({email: this.username}, {$set: {password: this.password}});
		} else {
			if (this.isModified('password')) {
				console.log('Updating pass', {email: this.username}, {$set: {password: this.password}});
				await AdminUser.update({email: this.username}, {$set: {password: this.password}});
			}
			if (this.isModified('name')) {
				await AdminUser.update({email: this.username}, {
					$set: {
						name: (() => {
							let tokens = this.name.split(' ');
							let fn = tokens.shift();
							let ln = tokens.join(' ');
							return {first: fn.trim(), last: ln.trim()}
						})()
					}
				});
			}
			if (this.isModified('username')) {
				const old = await ThisModel.model.findOne({_id: this._id});
				await AdminUser.update({email: old.username}, {$set: {email: this.username}});
			}
		}
		////////////////// END -- SYNC TO ADMIN USER /////////////////////////////////////
		///////////// CREDITS HANDLING ///////////////////////////
		if (this.isNew) {
			let myAdmin = await AdminUser.findOne({email: this.username});
			const entry = new CreditLedgerEntry({
				description: "Initial Credit Applied.",
				mode: 'CREDIT',
				operator: myAdmin.operator,
				superStockist: myAdmin.superStockist,
				stockist: myAdmin.stockist,
				retailer: myAdmin.retailer,
				amount: this.initialCredits,
				balance: undefined,
				createdAt: new Date(),
				updatedAt: new Date(),
				createdBy: this.createdBy,
				updatedBy: this.updatedBy
			});
			await entry.save();
		}
		///////////// END CREDITS HANDLING ///////////////////////////
		next();
	} catch (c) {
		next(c)
	}
});

ThisModel.model.schema.post('save', async function () {

});
