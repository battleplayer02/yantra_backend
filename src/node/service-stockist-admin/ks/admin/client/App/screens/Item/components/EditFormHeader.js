import React from 'react';
import { findDOMNode } from 'react-dom';
import { connect } from 'react-redux';

import Toolbar from './Toolbar';
import ToolbarSection from './Toolbar/ToolbarSection';
import EditFormHeaderSearch from './EditFormHeaderSearch';
import { Link } from 'react-router';

import Drilldown from './Drilldown';
import { GlyphButton, ResponsiveText } from '../../../elemental';
import {loadItems} from "../../List/actions";

export const EditFormHeader = React.createClass({
	displayName: 'EditFormHeader',
	propTypes: {
		data: React.PropTypes.object,
		list: React.PropTypes.object,
		toggleCreate: React.PropTypes.func,
	},
	getInitialState () {
		return {
			searchString: '',
		};
	},
	toggleCreate (visible) {
		this.props.toggleCreate(visible);
	},
	searchStringChanged (event) {
		this.setState({
			searchString: event.target.value,
		});
	},
	handleEscapeKey (event) {
		const escapeKeyCode = 27;

		if (event.which === escapeKeyCode) {
			findDOMNode(this.refs.searchField).blur();
		}
	},
	renderDrilldown () {
		return (
			<ToolbarSection left>
				{this.renderDrilldownItems()}
				{this.renderSearch()}
			</ToolbarSection>
		);
	},
	renderDrilldownItems () {
		const { data, list } = this.props;
		let items = data.drilldown ? data.drilldown.items : [];

		if(list.hideDrilldown) items = [];

		let backName = list.plural;
		let backPath = `${Keystone.adminPath}/${list.path}`;
		if(window.__previousLocation){
			backName = 'Go Back';
			backPath = window.__previousLocation.path;
		}
		const backStyles = { paddingLeft: 0, paddingRight: 0 };
		// Link to the list page the user came from
		if (this.props.listActivePage && this.props.listActivePage > 1) {
			backPath = `${backPath}?page=${this.props.listActivePage}`;
		}

		// return a single back button when no drilldown exists
		if (!items.length) {
			return (
				<GlyphButton
					component={Link}
					data-e2e-editform-header-back
					glyph="chevron-left"
					position="left"
					style={backStyles}
					to={backPath}
					variant="link"
					>
					{backName}
				</GlyphButton>
			);
		}

		// prepare the drilldown elements
		const drilldown = [];
		items.forEach((item, idx) => {
			// FIXME @jedwatson
			// we used to support relationships of type MANY where items were
			// represented as siblings inside a single list item; this got a
			// bit messy...
			item.items.forEach(link => {
				drilldown.push({
					href: link.href,
					label: link.label,
					title: item.list.singular,
				});
			});
		});

		// add the current list to the drilldown
		drilldown.push({
			href: backPath,
			label: backName,
		});

		return (
			<Drilldown items={drilldown} />
		);
	},
	renderSearch () {
		var list = this.props.list;

		if(list.hideSearchInDrilldown) return '';

		return (
			<form action={`${Keystone.adminPath}/${list.path}`} className="EditForm__header__search">
				<EditFormHeaderSearch
					value={this.state.searchString}
					onChange={this.searchStringChanged}
					onKeyUp={this.handleEscapeKey}
				/>
				{/* <GlyphField glyphColor="#999" glyph="search">
					<FormInput
						ref="searchField"
						type="search"
						name="search"
						value={this.state.searchString}
						onChange={this.searchStringChanged}
						onKeyUp={this.handleEscapeKey}
						placeholder="Search"
						style={{ paddingLeft: '2.3em' }}
					/>
				</GlyphField> */}
			</form>
		);
	},
	renderInfo () {
		let actionButtons = [];
		let item = this.props.data;
		//rowButtons
		if(this.props.list.rowButtons && this.props.list.rowButtons.length){
			this.props.list.rowButtons.forEach(btn => {
				if(btn.itemPage && eval(btn.visible)(item)) actionButtons.push(
					<button className='row-button row-button-item' style={{color: btn.color}} onClick={(e) => window[btn.fn](item, e, () => this.props.dispatch(loadItems()))}><i className={btn.icon}></i> {btn.name}</button>);
			});
		}
		return (
			<ToolbarSection right>
				{actionButtons}
				{this.renderCreateButton()}
			</ToolbarSection>
		);
	},
	renderCreateButton () {
		const { nocreate, autocreate, singular } = this.props.list;

		if (nocreate) return null;

		let props = {};
		if (autocreate) {
			props.href = '?new' + Keystone.csrf.query;
		} else {
			props.onClick = () => { this.toggleCreate(true); };
		}
		return (
			<GlyphButton data-e2e-item-create-button="true" color="success" glyph="plus" position="left" {...props}>
				<ResponsiveText hiddenXS={`New ${singular}`} visibleXS="Create" />
			</GlyphButton>
		);
	},
	render () {
		return (
			<Toolbar>
				{this.renderDrilldown()}
				{this.renderInfo()}
			</Toolbar>
		);
	},
});

export default connect((state) => ({
	listActivePage: state.lists.page.index,
}))(EditFormHeader);
