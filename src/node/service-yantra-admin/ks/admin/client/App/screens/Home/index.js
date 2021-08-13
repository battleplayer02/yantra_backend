/**
 * The Home view is the view one sees at /keystone. It shows a list of all lists,
 * grouped by their section.
 */

import React from 'react';
import {Container, Spinner} from '../../elemental';
import {connect} from 'react-redux';
import {Link} from 'react-router';

import Lists from './components/Lists';
import Section from './components/Section';
import AlertMessages from '../../shared/AlertMessages';
import ListView from '../List/inline_index';
import moment from 'moment';

import {
	loadCounts,
} from './actions';
import Chart from 'chart.js';

const counterData = [
	{
		name: 'Open Errors',
		sub: '(All Time)',
		color: '#6fbbd3',
		value: '...',
		prop: 'openErrors',
		link: {
			pathname: "/admin/reported-errors",
			query: {
				filters: '[{"path":"isComplete","inverted":false,"value":false}]',
				columns: 'createdAt, source, agent, description, updatedAt',
				srbn: 4
			}
		}
	},
	{
		name: 'Errors Reported',
		sub: '(Today)',
		color: '#9bbc4e',
		value: '...',
		prop: 'errorsToday',
		link: {
			pathname: "/admin/reported-errors",
			query: {
				filters: '[{"path":"createdAt","inverted":false,"mode": "on","value":"'+ new Date().toISOString() +'"}],"before": "2018-10-22T00:00:00+05:30","after": "2018-10-22T00:00:00+05:30"',
				columns: 'createdAt, source, agent, description, isComplete, updatedAt',
				srbn: 4
			}
		}
	},
	{
		name: 'Configs',
		sub: '(All Envs)',
		color: '#458ecc',
		value: '...',
		prop: 'numConfigs',
		link: {
			pathname: "/admin/configs",
			query: {
				// filters: `[{"path":"status","inverted":false,"value":["Second-Dose-Reminder-3"]}]`,
				columns: 'name, type, value, environment, isPublic, updatedAt, updatedBy',
				srbn: 4
			}
		}
	},
	{
		name: 'Workers Running',
		sub: '(Alive Now)',
		color: '#9a78db',
		value: '...',
		prop: 'workersRunning',
		link: {
			pathname: "/admin/workers",
			query: {
				filters: `[{"path":"status","inverted":false,"value":["ONLINE"]}]`,
				columns: 'name, agent, status, description, updatedAt',
				srbn: 4
			}
		}
	},
	{
		name: 'Agents Running',
		sub: '(Alive Now)',
		color: '#f3c447',
		value: '...',
		prop: 'agentsRunning',
		link: {
			pathname: "/admin/agents",
			query: {
				filters: `[{"path":"status","inverted":false,"value":["ONLINE"]}]`,
				columns: 'name, version, status, description, updatedAt',
				srbn: 4
			}
		}
	},
	{
		name: 'N/A',
		sub: '(to-let)',
		color: '#da7a65',
		value: '...',
		prop: 'stage6',
		link: {
			pathname: "/admin/customers",
			query: {
				filters: `[{"path":"status","inverted":false,"value":["Third-Dose-Reminder-6"]}]`,
				columns: 'userName, name, mobileNumber, alternateMobileNumbers, state, district, block, facility, firstInjectionDate, createdOn',
				srbn: 4
			}
		}
	},
	{
		name: 'N/A',
		sub: '(to-let)',
		color: '#1385e5',
		value: '...',
		prop: 'stage7',
		link: {
			pathname: "/admin/customers",
			query: {
				filters: `[{"path":"status","inverted":false,"value":["Third-Dose-Confirm-7"]}]`,
				columns: 'userName, name, mobileNumber, alternateMobileNumbers, state, district, block, facility, firstInjectionDate, createdOn',
				srbn: 4
			}
		}
	}
];

var HomeView = React.createClass({
	displayName: 'HomeView',
	getInitialState() {
		return {
			modalIsOpen: true,
			tabLoaded: 1,
			tabFLoaded: 0,
			dashData: 0,
			totalErrors: 0,
			totalWorkers: 0,
			totalAgents: 0,
			counterData: counterData,
			topCampaigns: [],
			todayDate: new Date().toISOString(),
			nextDate: new Date(+new Date() + 24 * 60 * 60 * 1000).toISOString(),
		};
	},
	// When everything is rendered, start loading the item counts of the lists
	// from the API
	componentDidMount() {
		this.props.dispatch(loadCounts());

		//  load stats
		jQuery
			.get(
				'/admin/api/dash/stats',
				(resp) => {
					try {
						resp = JSON.parse(resp);
					} catch (c) {
						console.log(c);
					}
					counterData.forEach(el => {
						if (typeof (resp[el.prop]) !== 'undefined') el.value = resp[el.prop];
					});
					this.setState({
						counterData: counterData,
						totalAgents: resp.totalAgents || 0,
						totalWorkers: resp.totalWorkers || 0,
						totalErrors: resp.totalErrors || 0,
						// topCampaigns: resp.topCampaigns || [],
						// topDealers: resp.topDealers || [],
						// topCities: resp.topCities || [],
						// topOffers: resp.topOffers || [],
						// topConsumers: resp.topConsumers || []
					});
					console.log('STATSSSS.............', counterData);

					setTimeout(() => {

						// chart render

						var chart = new Chart(document.getElementById('chart-box-dash'), {
							type: 'pie',
							data: {
								datasets: [{
									data: [resp.incoming, resp.outgoing],
									backgroundColor: [
										'rgb(54, 162, 235)',
										'rgb(155, 188, 78)',
										// 'rgba(54, 162, 235, 1)',
										// 'rgba(255,99,132,1)',
										// 'rgba(75, 192, 192, 0.2)',
										// 'rgba(153, 102, 255, 0.2)',
										// 'rgba(255, 159, 64, 0.2)'
									],
									borderColor: [
										'rgb(54, 162, 235)',
										'rgb(155, 188, 78)',
										// 'rgba(255,99,132,1)',
										// 'rgba(75, 192, 192, 1)',
										// 'rgba(153, 102, 255, 1)',
										// 'rgba(255, 159, 64, 1)'
									]
								}],
								labels: [
									'Inbound(' + resp.incoming + ')',
									'Outbound(' + resp.outgoing + ')'
								]
							},
							maintainAspectRatio: true,
							options: Chart.defaults.pie
						});
						chart.canvas.style.width = "auto";
					}, 200);
				})
			.fail((error) => {
				console.log(error);
			});


	},
	getSpinner() {
		if (this.props.counts && Object.keys(this.props.counts).length === 0
			&& (this.props.error || this.props.loading)) {
			return (
				<Spinner/>
			);
		}
		return null;
	},
	toggleMainTab(tab) {
		this.setState({
			tabLoaded: tab
		});
	},
	toggleFollowupTab(tab) {
		this.setState({
			tabFLoaded: tab
		});
	},
	changeDealers(e) {
		console.log(e.target.value);
		let newList = this.state.topDealers.sort((a, b) => (b[e.target.value] || 0) - (a[e.target.value] || 0));
		this.setState({topDealers: newList});
	},
	changeCities(e) {
		console.log(e.target.value);
		let newList = this.state.topCities.sort((a, b) => (b[e.target.value] || 0) - (a[e.target.value] || 0));
		this.setState({topCities: newList});
	},
	render() {
		// followup lists finder
		const listsByPath = require('../../../utils/lists').listsByPath;
		const followup = listsByPath['followups'];
		const spinner = this.getSpinner();
		const topCampaignsEls = [];
		const topDealerEls = [];
		const topConsumerEls = [];
		const topOffersEls = [];
		const topCityEls = [];

		// fetch top campains
		{
			this.state.topCampaigns && this.state.topCampaigns.forEach(campaign => {
				topCampaignsEls.push((
					<tr className="">
						<td className="ItemList__col"><Link
							className="ItemList__value ItemList__value--text ItemList__link--interior ItemList__link--padded ItemList__value--truncate"
							to={"/admin/campaigns/" + campaign._id}>{campaign.name}</Link></td>
						<td className="ItemList__col">
							<div
								className="ItemList__value ItemList__value--datetime ItemList__value--truncate">{moment(campaign.sentOn).format('DD/MM/YYYY hh:mm A')}
							</div>
						</td>
						<td className="ItemList__col">
							<div
								className="ItemList__value ItemList__value--number ItemList__value--truncate">{campaign.recipientCount}</div>
						</td>
						<td className="ItemList__col">
							<div
								className="ItemList__value ItemList__value--number ItemList__value--truncate">{campaign.open}</div>
						</td>
						<td className="ItemList__col">
							<div
								className="ItemList__value ItemList__value--number ItemList__value--truncate">{campaign.openRate}</div>
						</td>
						<td className="ItemList__col">
							<div
								className="ItemList__value ItemList__value--number ItemList__value--truncate">{campaign.clicks}</div>
						</td>
					</tr>
				));
			})
		}

		{
			this.state.topDealers && this.state.topDealers.forEach((dealer, idx) => {
				dealer.total && idx <= 9 && topDealerEls.push((
					<tr className="">
						<td className="ItemList__col">{dealer.name}</td>
						<td className="ItemList__col">
							<div
								className="ItemList__value ItemList__value--datetime ItemList__value--truncate">
								<Link to={{
									pathname: '/admin/customers',
									query: {
										columns: 'userName,name,phoneNumbers,email,engagementStatus,comments,updatedBy',
										filters: '[{"path":"dealership","inverted":false,"value":["' + dealer._id + '"]},{"path":"status","inverted":false,"value":["Verified"]}]',
										srbn: 4
									}
								}}>
									{dealer.total}
								</Link>
							</div>
						</td>
						<td className="ItemList__col">
							<div
								className="ItemList__value ItemList__value--number ItemList__value--truncate">
								<Link to={{
									pathname: '/admin/customers',
									query: {
										columns: 'userName,name,phoneNumbers,email,engagementStatus,comments,updatedBy',
										filters: '[{"path":"engagementStatus","inverted":false,"value":["Inactive"]},{"path":"dealership","inverted":false,"value":["' + dealer._id + '"]},{"path":"status","inverted":false,"value":["Verified"]}]',
										srbn: 4
									}
								}}>
									{dealer.inactive}
								</Link>
							</div>
						</td>
						<td className="ItemList__col">
							<div
								className="ItemList__value ItemList__value--number ItemList__value--truncate">
								<Link to={{
									pathname: '/admin/customers',
									query: {
										columns: 'userName,name,phoneNumbers,email,engagementStatus,comments,updatedBy',
										filters: '[{"path":"engagementStatus","inverted":false,"value":["Active","Engaged"]},{"path":"dealership","inverted":false,"value":["' + dealer._id + '"]},{"path":"status","inverted":false,"value":["Verified"]}]',
										srbn: 4
									}
								}}>
									{dealer.active}
								</Link>
							</div>
						</td>
						<td className="ItemList__col">
							<div
								className="ItemList__value ItemList__value--number ItemList__value--truncate">
								<Link to={{
									pathname: '/admin/customers',
									query: {
										columns: 'userName,name,phoneNumbers,email,engagementStatus,comments,updatedBy',
										filters: '[{"path":"engagementStatus","inverted":false,"value":["Engaged"]},{"path":"dealership","inverted":false,"value":["' + dealer._id + '"]},{"path":"status","inverted":false,"value":["Verified"]}]',
										srbn: 4
									}
								}}>
									{dealer.engaged}
								</Link>
							</div>
						</td>
						<td className="ItemList__col">
							<div
								className="ItemList__value ItemList__value--number ItemList__value--truncate">
								<Link to={{
									pathname: '/admin/customers',
									query: {
										columns: 'userName,name,phoneNumbers,email,engagementStatus,comments,updatedBy',
										filters: '[{"path":"isConsumer","inverted":false,"value": true},{"path":"dealership","inverted":false,"value":["' + dealer._id + '"]},{"path":"status","inverted":false,"value":["Verified"]}]',
										srbn: 4
									}
								}}>
									{dealer.consumers}
								</Link>
							</div>
						</td>
					</tr>
				));
			})
		}

		{
			this.state.topCities && this.state.topCities.forEach((city, idx) => {
				city.total && idx <= 9 && topCityEls.push((
					<tr className="">
						<td className="ItemList__col">{city.name}</td>
						<td className="ItemList__col">
							<div
								className="ItemList__value ItemList__value--datetime ItemList__value--truncate">
								<Link to={{
									pathname: '/admin/customers',
									query: {
										columns: 'userName,name,phoneNumbers,email,engagementStatus,comments,updatedBy',
										filters: '[{"path":"city","mode":"exactly","inverted":false,"value":["' + city.name + '"]},{"path":"status","inverted":false,"value":["Verified"]}]',
										srbn: 4
									}
								}}>
									{city.total}
								</Link>
							</div>
						</td>
						<td className="ItemList__col">
							<div
								className="ItemList__value ItemList__value--number ItemList__value--truncate">
								<Link to={{
									pathname: '/admin/customers',
									query: {
										columns: 'userName,name,phoneNumbers,email,engagementStatus,comments,updatedBy',
										filters: '[{"path":"engagementStatus","inverted":false,"value":["Inactive"]},{"path":"city","mode":"exactly","inverted":false,"value":["' + city.name + '"]},{"path":"status","inverted":false,"value":["Verified"]}]',
										srbn: 4
									}
								}}>
									{city.inactive}
								</Link>
							</div>
						</td>
						<td className="ItemList__col">
							<div
								className="ItemList__value ItemList__value--number ItemList__value--truncate">
								<Link to={{
									pathname: '/admin/customers',
									query: {
										columns: 'userName,name,phoneNumbers,email,engagementStatus,comments,updatedBy',
										filters: '[{"path":"engagementStatus","inverted":false,"value":["Active","Engaged"]},{"path":"city","mode":"exactly","inverted":false,"value":["' + city.name + '"]},{"path":"status","inverted":false,"value":["Verified"]}]',
										srbn: 4
									}
								}}>
									{city.active}
								</Link>
							</div>
						</td>
						<td className="ItemList__col">
							<div
								className="ItemList__value ItemList__value--number ItemList__value--truncate">
								<Link to={{
									pathname: '/admin/customers',
									query: {
										columns: 'userName,name,phoneNumbers,email,engagementStatus,comments,updatedBy',
										filters: '[{"path":"engagementStatus","inverted":false,"value":["Engaged"]},{"path":"city","mode":"exactly","inverted":false,"value":["' + city.name + '"]},{"path":"status","inverted":false,"value":["Verified"]}]',
										srbn: 4
									}
								}}>
									{city.engaged}
								</Link>
							</div>
						</td>
						<td className="ItemList__col">
							<div
								className="ItemList__value ItemList__value--number ItemList__value--truncate">
								<Link to={{
									pathname: '/admin/customers',
									query: {
										columns: 'userName,name,phoneNumbers,email,engagementStatus,comments,updatedBy',
										filters: '[{"path":"isConsumer","inverted":false,"value": true},{"path":"city","mode":"exactly","inverted":false,"value":["' + city.name + '"]},{"path":"status","inverted":false,"value":["Verified"]}]',
										srbn: 4
									}
								}}>
									{city.consumers}
								</Link>
							</div>
						</td>
					</tr>
				));
			})
		}

		{
			this.state.topConsumers && this.state.topConsumers.forEach((customer, idx) => {
				idx <= 9 && topConsumerEls.push((
					<tr className="">
						<td className="ItemList__col">
							<div
								className="ItemList__value ItemList__value--datetime ItemList__value--truncate"> {customer.name.first} {customer.name.last}
							</div>
						</td>
						<td className="ItemList__col">
							<div
								className="ItemList__value ItemList__value--number ItemList__value--truncate">
								<Link to={{
									pathname: '/admin/customers/' + customer._id
								}}>
									{customer.userName}
								</Link>
							</div>
						</td>
						<td className="ItemList__col">
							<div className="ItemList__value ItemList__value--number ItemList__value--truncate">
								<Link to={{
									pathname: '/admin/followups/',
									query: {
										columns: 'createdAt, customer, callType, interactionSource, callDisposition, followupDate, comments, offer, offerAvailed, workDoneByAgent',
										filters: '[{"path":"customer","mode":"exactly","inverted":false,"value":["' + customer._id + '"]},{"path":"offerAvailed","inverted":false,"value":["Yes"]}]',
										srbn: 4
									}
								}}>
									{customer.totalOffersAvailed}
								</Link>
							</div>
						</td>
					</tr>
				));
			})
		}

		{
			this.state.topOffers && this.state.topOffers.forEach((offer, idx) => {
				topOffersEls.push((
					<tr className="">
						<td className="ItemList__col">
							<div className="ItemList__value ItemList__value--number ItemList__value--truncate">
								{offer.name}
							</div>
						</td>
						<td className="ItemList__col">
							<div className="ItemList__value ItemList__value--number ItemList__value--truncate">
								<Link to={{
									pathname: '/admin/followups/',
									query: {
										columns: 'createdAt, customer, callType, interactionSource, callDisposition, followupDate, comments, offer, offerAvailed, workDoneByAgent',
										filters: '[{"path":"offer","mode":"exactly","inverted":false,"value":["' + offer._id + '"]},{"path":"offerAvailed","inverted":false,"value":["Yes"]}]',
										srbn: 4
									}
								}}>    {offer.offerAvailed}
								</Link>
							</div>
						</td>
					</tr>
				));
			})
		}
		return (
			<Container data-screen-id="home">
				<div className="dashboard-header">
					<div className="row">
						<div className="col-md-10">
							<div className="dashboard-heading">{Keystone.brand}</div>
						</div>
						<div className="col-md-2 toggles-main-tab">
							<span onClick={this.toggleMainTab.bind(this, 1)}
								  className={this.state.tabLoaded === 0 ? 'tab-act-btn' : 'tab-nact-btn'}>Dashboard</span>
							<span onClick={this.toggleMainTab.bind(this, 1)}
								  className={this.state.tabLoaded === 1 ? 'tab-act-btn' : 'tab-nact-btn'}>Lists</span>
						</div>
					</div>
				</div>

				{
					this.state.tabLoaded === 0 ? (
						<div className="admin-master-dash">
							<div className="row">
								{
									this.state.counterData.map((elem, index) => <div
										className="col-md-2 stat-pill top-pill" key={index} style={{width: '14%'}}>
										<Link to={elem.link}>
											<div className="card-parent card-shadow"
												 style={{backgroundColor: elem.color}}>
												<div className="card-value">{elem.value}</div>
												<div className="card-name">{elem.name}</div>
												<div style={{color: 'white', fontSize: '9px'}}>{elem.sub}</div>
											</div>
										</Link>
									</div>)
								}
							</div>
							<div className="row">
								<div className="col-md-5">
									<div className="card-dashboard card-shadow"
										 style={{height: '300px', backgroundColor: '#fefefe'}}>
										<h2 className="dash-sub-head">Master Stats</h2>
										<div className="row">
					<div className="col-md-4 master-stats">{this.state.totalAgents}<br/><span>Agents</span></div>
					<div className="col-md-4 master-stats">{this.state.totalWorkers}<br/><span>Workers</span></div>
					<div className="col-md-4 master-stats">{this.state.totalErrors}<br/><span>Total Errors</span></div>
					</div>
									</div>
									<div className="card-dashboard card-shadow"
										 style={{height: '293px', backgroundColor: '#fefefe'}}>
										<h2 className="dash-sub-head">Small Stat Box</h2>
											<canvas id="chart-box-dash" style={{
												maxHeight: "calc(100% - 50px)",
													margin: "auto"
											}}></canvas>
									</div>
								</div>
								<div className="col-md-7">
									<div className="toggles-main-tab" style={{marginTop: '10px', marginLeft: '5px'}}>
										<span onClick={this.toggleFollowupTab.bind(this, 0)}
											  className={this.state.tabFLoaded === 0 ? 'tab-act-btn' : 'tab-nact-btn'}>Today</span>
										<span onClick={this.toggleFollowupTab.bind(this, 1)}
											  className={this.state.tabFLoaded === 1 ? 'tab-act-btn' : 'tab-nact-btn'}>History</span>
										<span onClick={this.toggleFollowupTab.bind(this, 2)}
											  className={this.state.tabFLoaded === 2 ? 'tab-act-btn' : 'tab-nact-btn'}>Pending Errors</span>
									</div>
									<div className="card-dashboard card-shadow table-followups"
										 style={{height: '560px', backgroundColor: '#fefefe', overflowY: 'auto'}}>
										{/*<iframe
													src={'/admin/followups?filters=%5B%7B"path"%3A"followupDate"%2C"mode"%3A"on"%2C"inverted"%3Afalse%2C"value"%3A"2018-10-22T06%3A30%3A00.000Z"%2C"before"%3A"2018-10-22T00%3A00%3A00%2B05%3A30"%2C"after"%3A"2018-10-22T00%3A00%3A00%2B05%3A30"%7D%5D&msp=1'}
													frameBorder="0"></iframe>*/}
										{
											this.state.tabFLoaded === 0 ? <ListView params={{
													listId: "reported-errors",
													columns: 'createdAt, source, agent, description, isComplete, updatedAt',
													filters: [{
														"path": "createdAt",
														"mode": "on",
														"inverted": false,
														"value": this.state.todayDate,
														"before": "2018-10-22T00:00:00+05:30",
														"after": "2018-10-22T00:00:00+05:30"
													}],
													sort: '-createdAt',
													nocreate: true
												}}/> :
												this.state.tabFLoaded === 1 ? <ListView params={{
														listId: "reported-errors",
														columns: 'createdAt, source, agent, description, isComplete, updatedAt',
														filters: [{
															"path": "createdAt",
															"mode": "before",
															"inverted": false,
															"value": this.state.todayDate,
															"before": "2018-10-22T00:00:00+05:30",
															"after": "2018-10-22T00:00:00+05:30"
														}],
														sort: '-createdAt',
														nocreate: true
													}}/> :
													<ListView params={{
														listId: "reported-errors",
														columns: 'createdAt, source, agent, description, updatedAt',
														filters: [{
															"path": "isComplete",
															"inverted": false,
															"value": false
														}],
														sort: '-createdAt',
														nocreate: true
													}}/>
										}
									</div>
								</div>
							</div>
							<div className="row">
								<div className="col-md-12">
									<hr/>
								</div>
							</div>


							<div className="row">

								<div className="col-md-6">
									<div className="card-dashboard card-shadow"
										 style={{height: '530px', backgroundColor: '#fefefe'}}>
										<div style={{
											textAlign: 'right',
											width: '100%',
											display: 'inline-flex',
											justifyContent: 'flex-end'
										}}>
											<span style={{alignSelf: 'center', marginRight: '5px'}}>Sort by: </span>
											<select onChange={this.changeCities.bind(this)} className={'mr-1'}>
												<option value="total" selected>Total Members</option>
												<option value="active">Active Members</option>
												<option value="inactive">Inactive Members</option>
												<option value="engaged">Engaged Members</option>
												<option value="consumers">Consumer Members</option>
											</select>
											<a id="listHeaderDownloadButton" style={{width: 'auto'}}
											   className="base_b0alru-o_O-base_hn2280-o_O-block_1u6cnnt"
											   type="button" target="_blank"
											   href="/admin/api/city-stats/export.csv?select=name,total,inactive,active,engaged,consumers&sort=-total&expandRelationshipFields=true&limit=10">
												<span className="label_1u09trc">Download</span>
											</a>
										</div>
										<h2 className="dash-sub-head">Stat Box 1</h2>
										<table cellPadding="0" cellSpacing="0" className="Table ItemList">
											<colgroup>
												<col/>
												<col/>
												<col/>
												<col/>
												<col/>
												<col/>
											</colgroup>
											<thead>
											<tr>
												<th colSpan="1">
													<button className="ItemList__sort-button th-sort"
															title="Sort by Name">City Name
													</button>
												</th>
												<th colSpan="1">
													<button
														className="ItemList__sort-button th-sort th-sort--desc">Total
														Members
													</button>
												</th>
												<th colSpan="1">
													<button className="ItemList__sort-button th-sort"
															title="Sort by Recipient Count">Inactive
													</button>
												</th>
												<th colSpan="1">
													<button className="ItemList__sort-button th-sort"
															title="Sort by Open">Active
													</button>
												</th>
												<th colSpan="1">
													<button className="ItemList__sort-button th-sort"
															title="Sort by Open Rate">Engaged
													</button>
												</th>
												<th colSpan="1">
													<button className="ItemList__sort-button th-sort"
															title="Sort by Clicks">Consumers
													</button>
												</th>
											</tr>
											</thead>
											<tbody>
											{topCityEls}
											</tbody>
										</table>
									</div>
								</div>
								<div className="col-md-6">
									<div className="card-dashboard card-shadow"
										 style={{height: '530px', backgroundColor: '#fefefe'}}>
										<div style={{
											textAlign: 'right',
											width: '100%',
											display: 'inline-flex',
											justifyContent: 'flex-end'
										}}>
											<a id="listHeaderDownloadButton" style={{width: 'auto'}}
											   className="base_b0alru-o_O-base_hn2280-o_O-block_1u6cnnt"
											   type="button" target="_blank"
											   href="/admin/api/followups/export.csv?filters={%22offerAvailed%22:{%22inverted%22:false,%22value%22:[%22Yes%22]}}&select=createdAt,customer,callType,interactionSource,callDisposition,followupDate,comments,offer,offerAvailed,workDoneByAgent&sort=createdAt&expandRelationshipFields=true&limit=10">
												<span className="label_1u09trc">Download</span>
											</a>
										</div>
										<h2 className="dash-sub-head">Stat Box 2</h2>
										<table cellPadding="0" cellSpacing="0" className="Table ItemList">
											<colgroup>
												<col/>
												<col/>
											</colgroup>
											<thead>
											<tr>
												<th colSpan="1">
													<button className="ItemList__sort-button th-sort"
															title="Sort by Name">Offer Name
													</button>
												</th>
												<th colSpan="1">
													<button
														className="ItemList__sort-button th-sort th-sort--desc">Total
														Offer Availed
													</button>
												</th>
											</tr>
											</thead>
											<tbody>
											{topOffersEls}
											</tbody>
										</table>
									</div>
								</div>

								<div className="col-md-12">
									<div className="card-dashboard card-shadow"
										 style={{height: '530px', backgroundColor: '#fefefe', overflowY: 'auto'}}>
										<h2 className="dash-sub-head">Stat Box 3</h2>
										<table cellPadding="0" cellSpacing="0" className="Table ItemList">
											<colgroup>
												<col/>
												<col/>
												<col/>
												<col/>
												<col/>
												<col/>
											</colgroup>
											<thead>
											<tr>
												<th colSpan="1">
													<button className="ItemList__sort-button th-sort"
															title="Sort by Name">Name
													</button>
												</th>
												<th colSpan="1">
													<button className="ItemList__sort-button th-sort th-sort--desc">Sent
														On
													</button>
												</th>
												<th colSpan="1">
													<button className="ItemList__sort-button th-sort"
															title="Sort by Recipient Count">Recipient Count
													</button>
												</th>
												<th colSpan="1">
													<button className="ItemList__sort-button th-sort"
															title="Sort by Open">Open
													</button>
												</th>
												<th colSpan="1">
													<button className="ItemList__sort-button th-sort"
															title="Sort by Open Rate">Open Rate
													</button>
												</th>
												<th colSpan="1">
													<button className="ItemList__sort-button th-sort"
															title="Sort by Clicks">Clicks
													</button>
												</th>
											</tr>
											</thead>
											<tbody>
											{topCampaignsEls}
											</tbody>
										</table>
									</div>
								</div>
							</div>


						</div>
					) : (
						<div className="dashboard-groups">
							{(this.props.error) && (
								<AlertMessages
									alerts={{
										error: {
											error:
												"There is a problem with the network, we're trying to reconnect...",
										}
									}}
								/>
							)}
							{/* Render flat nav */}
							{Keystone.nav.flat ? (
								<Lists
									counts={this.props.counts}
									lists={Keystone.lists}
									spinner={spinner}
								/>
							) : (
								<div>
									{/* Render nav with sections */}
									{Keystone.nav.sections.map((navSection) => {
										return (
											<Section key={navSection.key} id={navSection.key} label={navSection.label}>
												<Lists
													counts={this.props.counts}
													lists={navSection.lists}
													spinner={spinner}
												/>
											</Section>
										);
									})}
									{/* Render orphaned lists */}
									{Keystone.orphanedLists.length ? (
										<Section label="Other" icon="octicon-database">
											<Lists
												counts={this.props.counts}
												lists={Keystone.orphanedLists}
												spinner={spinner}
											/>
										</Section>
									) : null}
								</div>
							)}
						</div>
					)
				}
			</Container>
		);
	},
});

export {
	HomeView,
};

export default connect((state) => ({
	counts: state.home.counts,
	loading: state.home.loading,
	error: state.home.error,
}))(HomeView);
