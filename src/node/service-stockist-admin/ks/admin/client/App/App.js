/**
 * The App component is the component that is rendered around all views, and
 * contains common things like navigation, footer, etc.
 */

import React from 'react';
import {Container} from './elemental';
import {Link} from 'react-router';
import {css, StyleSheet} from 'aphrodite/no-important';

import MobileNavigation from './components/Navigation/Mobile';
import PrimaryNavigation from './components/Navigation/Primary';
import SecondaryNavigation from './components/Navigation/Secondary';
import Footer from './components/Footer';

const classes = StyleSheet.create({
	wrapper: {
		display: 'flex',
		flexDirection: 'column',
		minHeight: '100vh',
	},
	body: {
		flexGrow: 1,
	},
});

const App = (props) => {
	const listsByPath = require('../utils/lists').listsByPath;
	let children = props.children;
	// If we're on either a list or an item view
	let currentList, currentSection;
	if (props.params.listId) {
		currentList = listsByPath[props.params.listId];
		// If we're on a list path that doesn't exist (e.g. /keystone/gibberishasfw34afsd) this will
		// be undefined
		if (!currentList) {
			children = (
				<Container>
					<p>List not found!</p>
					<Link to={`${Keystone.adminPath}`}>
						Go back home
					</Link>
				</Container>
			);
		} else {
			// Get the current section we're in for the navigation
			currentSection = Keystone.nav.by.list[currentList.key];
		}
	}
	// Default current section key to dashboard
	const currentSectionKey = (currentSection && currentSection.key) || 'dashboard';
	return window.location.href.search(/msp=1/) > -1 ? (<div className={css(classes.wrapper)}>
			<div className="container-fluid">
				<div className="row">
					<div className="col-md-12 col-lg-12" style={{background: "#fefefe", minHeight: '100vh'}}>

						<div className="row">
							<div className="col-md-12" style={{padding: "0"}}>
								{/* If a section is open currently, show the secondary nav */}
								<main className={css(classes.body)}>
									{children}
								</main>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>):



		(<div className={css(classes.wrapper)}>
			<div className="container-fluid">
				<div className="row">
					<div className="col-md-3 col-lg-2" style={{
						background: "#333",
						minHeight: "100vh",
						boxShadow: "1px 0px 5px 0px #797171",
						zIndex: "9"
					}}>

						<div className="row">
							<div className="col-md-12" style={{textAlign: "center"}}>
								<img src="/yantra-sm.jpg" alt="Navigant CRM"
									 style={{width: "80%", padding: "10%"}}/>
							</div>
						</div>

						<div className="row left-menu-item it-dash">
							<div className="col-md-12">
								<Link to="/admin"><i className="fa fa-tachometer-alt"></i> Dashboard</Link>
							</div>
						</div>
						<hr className="item-hr"/>
		{/*
						<div className="row left-menu-item it-agent-command">
							<div className="col-md-12">
								<Link to={{
									pathname: "/admin/agent-commands",
									query: {
										filters: '[]',
										columns: 'agent, type, command, script, status, createdAt, createdBy',
										srbn: 1,
										sort: '-createdOn',
										page: 1
									}
								}}><i className="fa fa-laptop-code"></i> Agent Command</Link>
							</div>
						</div>
						<div className="row left-menu-item it-configs">
							<div className="col-md-12">
								<Link to={{
									pathname: "/admin/configs",
									query: {
										filters: '[]',
										columns: 'name, type, value, environment, isPublic, updatedAt, updatedBy',
										srbn: 1,
										sort: 'name',
										page: 1
									}
								}}><i className="fa fa-cogs"></i> Config</Link>
							</div>
						</div>
						<hr className="item-hr"/>

						<div className="row left-menu-item it-sub-admins">
							<div className="col-md-12">
								<Link to={{
									pathname: "/admin/sub-admins",
									query: {
										filters: '[]',
										columns: 'name,link, description',
										srbn: 1,
										sort: 'name',
										page: 1
									}
								}}><i className="fa fa-users-cog"></i> Sub Admins</Link>
							</div>
						</div>
						<div className="row left-menu-item it-agents">
							<div className="col-md-12">
								<Link to={{
									pathname: "/admin/agents",
									query: {
										filters: '[]',
										columns: 'name, version, status, description, updatedAt',
										srbn: 1,
										sort: 'name',
										page: 1
									}
								}}><i className="fa fa-address-card"></i> Agents</Link>
							</div>
						</div>
						<hr className="item-hr"/>

						<div className="row left-menu-item it-stage-5">
							<div className="col-md-12">
								<Link to={{
									pathname: "/admin/daily-user-stats",
									query: {
										filters: '[]',
										columns: '',
										srbn: 1,
										sort: '-createdAt',
										page: 1
									}
								}}><i className="fa fa-chart-bar"></i> Daily User Stats</Link>
							</div>
						</div>
						<div className="row left-menu-item it-campaigns">
							<div className="col-md-12">
								<Link to="/admin/campaigns"><i className="fa fa-mail-bulk"></i> Reports</Link>
							</div>
						</div>
*/}


					</div>

					<div className="col-md-9 col-lg-10" style={{background: "#fefefe", minHeight: '100vh'}}>
						<div className="row">
							<div className="col-md-12" style={{padding: "0"}}>
								<header>
									<MobileNavigation
										brand={Keystone.brand}
										currentListKey={props.params.listId}
										currentSectionKey={currentSectionKey}
										sections={Keystone.nav.sections}
										signoutUrl={Keystone.signoutUrl}
									/>
									<PrimaryNavigation
										currentSectionKey={currentSectionKey}
										brand={Keystone.brand}
										sections={Keystone.nav.sections}
										signoutUrl={Keystone.signoutUrl}
									/>
								</header>
							</div>
						</div>
						<div className="row">
							<div className="col-md-12" style={{padding: "0"}}>
								{/* If a section is open currently, show the secondary nav */}
								{(currentSection) ? (
									<div>
										<SecondaryNavigation
											currentListKey={props.params.listId}
											lists={currentSection.lists}
											itemId={props.params.itemId}
										/>
										<div>&nbsp;</div>
									</div>
								) : null}
								<main className={css(classes.body)}>
									{children}
								</main>
							</div>
						</div>
						<div className="row">
							<div className="col-md-12">
								<Footer
									appversion={Keystone.appversion}
									backUrl={Keystone.backUrl}
									brand={Keystone.brand}
									User={Keystone.User}
									user={Keystone.user}
									version={Keystone.version}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>);
};

module.exports = App;
