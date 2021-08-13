/**
 * Item View
 *
 * This is the item view, it is rendered when users visit a page of a specific
 * item. This mainly renders the form to edit the item content in.
 */

import React from 'react';
import moment from 'moment';
import {Center, Container, Spinner} from '../../elemental';
import {connect} from 'react-redux';
import {Link} from 'react-router';

import {listsByKey} from '../../../utils/lists';
import CreateForm from '../../shared/CreateForm';
import Alert from '../../elemental/Alert';
import EditForm from './components/EditForm';
import EditFormHeader from './components/EditFormHeader';
import RelatedItemsList from './components/RelatedItemsList/RelatedItemsList';
// import FlashMessages from '../../shared/FlashMessages';

import {
	selectItem,
	loadItemData,
} from './actions';

import {
	selectList,
} from '../List/actions';

var ItemView = React.createClass({
	displayName: 'ItemView',
	contextTypes: {
		router: React.PropTypes.object.isRequired,
	},
	getInitialState() {
		return {
			createIsOpen: false,
			followupCreateIsOpen: false,
			modeIsReadOnly: false,
			frameId: ~~(Math.random() * 10000000),
			hideRelationships: false,
		};
	},
	componentDidMount() {
		// When we directly navigate to an item without coming from another client
		// side routed page before, we need to select the list before initializing the item
		// We also need to update when the list id has changed

		console.log('Form is not ---', this.props);
		if (!this.props.currentList || this.props.currentList.id !== this.props.params.listId) {
			this.props.dispatch(selectList(this.props.params.listId));
		}
		if (!this.state.followupList) {
			const f_cb = (list) => this.setState({followupList: list});
			this.props.dispatch((dispatch, getState) => {
				f_cb(getState().lists.data['followups']);
			});
		}
		this.initializeItem(this.props.params.itemId);

		// fetch('/admin/api/')
	},
	componentWillReceiveProps(nextProps) {
		// We've opened a new item from the client side routing, so initialize
		// again with the new item id
		if (nextProps.params.itemId !== this.props.params.itemId) {
			this.props.dispatch(selectList(nextProps.params.listId));
			this.initializeItem(nextProps.params.itemId);
		}

		if (nextProps.currentList && nextProps.currentList.id === 'customers') {
			this.setState({modeIsReadOnly: true, hideRelationships: true});
		} else this.setState({modeIsReadOnly: false})
	},
	// Initialize an item
	initializeItem(itemId) {
		this.props.dispatch(selectItem(itemId));
		this.props.dispatch(loadItemData());
	},
	// Called when a new item is created
	onCreate(item) {
		// Hide the create form
		this.toggleCreateModal(false);
		// Redirect to newly created item path
		const list = this.props.currentList;
		this.context.router.push(`${Keystone.adminPath}/${list.path}/${item.id}`);
	},
	onFollowupCreate(item) {
		// Hide the create form
		this.toggleFollowupCreateModal(false);
		// reload iframe
		// jQuery( '#followup_frame' ).attr( 'src', function ( i, val ) { return val; });
		// this.setState({frameId: ~~(Math.random()*10000000)});
		$('iframe').each(function () {
			this.contentWindow.location.reload(true);
		});

	},
	// Open and close the create new item modal
	toggleCreateModal(visible) {
		this.setState({
			createIsOpen: visible,
		});
	},
	toggleFollowupCreateModal(visible) {
		this.setState({
			followupCreateIsOpen: visible,
		});
	},
	// Render this items relationships
	renderRelationships() {
		const {relationships} = this.props.currentList;
		const keys = Object.keys(relationships);
		if (!keys.length) return;
		return (
			<div className="Relationships">
				<Container>
					{this.state.hideRelationships ? '' : <h2>Relationships</h2>}
					{keys.map(key => {
						const relationship = relationships[key];
						const refList = listsByKey[relationship.ref];
						const {currentList, params, relationshipData, drag} = this.props;
						return (
							<RelatedItemsList
								key={relationship.path}
								list={currentList}
								refList={refList}
								relatedItemId={params.itemId}
								relationship={relationship}
								items={relationshipData[relationship.path]}
								dragNewSortOrder={drag.newSortOrder}
								dispatch={this.props.dispatch}
								modeIsReadOnly={this.state.modeIsReadOnly}
							/>
						);
					})}
				</Container>
			</div>
		);
	},
	// Handle errors
	handleError(error) {
		const detail = error.detail;
		if (detail) {
			// Item not found
			if (detail.name === 'CastError'
				&& detail.path === '_id') {
				return (
					<Container>
						<Alert color="danger" style={{marginTop: '2em'}}>
							No item matching id "{this.props.routeParams.itemId}".&nbsp;
							<Link to={`${Keystone.adminPath}/${this.props.routeParams.listId}`}>
								Got back to {this.props.routeParams.listId}?
							</Link>
						</Alert>
					</Container>
				);
			}
		}
		if (error.message) {
			// Server down + possibly other errors
			if (error.message === 'Internal XMLHttpRequest Error') {
				return (
					<Container>
						<Alert color="danger" style={{marginTop: '2em'}}>
							We encountered some network problems, please refresh.
						</Alert>
					</Container>
				);
			}
		}
		return (
			<Container>
				<Alert color="danger" style={{marginTop: '2em'}}>
					An unknown error has ocurred, please refresh.
				</Alert>
			</Container>
		);
	},
	getDrilldownLabel(modelName, id) {
		if (!id) return '';
		if (this.props.data && this.props.data.drilldown && this.props.data.drilldown.items) {
			for (let idx = 0; idx < this.props.data.drilldown.items.length; idx++) {
				let item = this.props.data.drilldown.items[idx];
				if (item && item.list && item.list.key === modelName) {
					if (item && item.items && item.items.length) {
						return (item.items[0].label);
					}
				}
			}
			return 'Deleted(' + id + ')';
		} else {
			return id;
		}
	},
	formatCDate(date) {
		if (!date) return date;
		return moment(date).local().format('DD/MM/YYYY hh:mm A')
	},
	formatDDate(date) {
		if (!date) return date;
		return moment(date).local().format('DD/MM/YYYY')
	},
	daysDifferenceFromNow(date) {
		if (!date) return date;
		return moment(date).fromNow();
	},
	getProfileCompletion: function () {
		const {data: {fields}} = this.props;
		return fields['profileCompletion'];
	},
	render() {
		// If we don't have any data yet, show the loading indicator
		if (!this.props.ready) {
			return (
				<Center height="50vh" data-screen-id="item">
					<Spinner/>
				</Center>
			);
		}

		console.log('--------------------------------------------- <');
		console.log(this.props);
		console.log(this.state);
		console.log('-------------------------------------------- -<');
		//
		// const availedOffers = ((this.props.relationshipData && this.props.relationshipData.followups && this.props.relationshipData.followups.results) || []).filter((followup) => {
		// 	return followup.fields.offerAvailed === 'Yes';
		// }).map((followup) => {
		// 	return followup.fields;
		// });
		const {offersAvailed, aliases} = this.state;

		// When we have the data, render the item view with it
		return (
			<div data-screen-id="item">
				{(this.props.error) ? this.handleError(this.props.error) : (
					<div>
						<Container>
							<EditFormHeader
								list={this.props.currentList}
								data={this.props.data}
								toggleCreate={this.toggleCreateModal}
							/>
							<CreateForm
								list={this.props.currentList}
								isOpen={this.state.createIsOpen}
								onCancel={() => this.toggleCreateModal(false)}
								onCreate={(item) => this.onCreate(item)}
							/>
							{this.state.followupList ? <CreateForm
								isOpen={this.state.followupCreateIsOpen}
								list={this.state.followupList}
								onCancel={() => this.toggleFollowupCreateModal(false)}
								onCreate={(item) => this.onFollowupCreate(item)}
								def={{customer: this.props.data.id}}
							/> : ''}


									<EditForm
										list={this.props.currentList}
										data={this.props.data}
										dispatch={this.props.dispatch}
										router={this.context.router}
									/>

						</Container>
						{this.renderRelationships()}
					</div>
				)}
			</div>
		);
	},
});

module.exports = connect((state) => ({
	data: state.item.data,
	loading: state.item.loading,
	ready: state.item.ready,
	error: state.item.error,
	currentList: state.lists.currentList,
	relationshipData: state.item.relationshipData,
	drag: state.item.drag,
}))(ItemView);
