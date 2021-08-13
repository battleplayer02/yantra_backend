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

import DateRangePicker from 'react-bootstrap-daterangepicker';

import {
	loadCounts,
} from './actions';
import Chart from 'chart.js';

const counterData = [
	{
		name: 'M.Pts',
		sub: '(Total Today)',
		color: '#6fbbd3',
		value: '...',
		prop: 'mpts',
		link: {
			pathname: "/admin/retailer-day-wise-reports",
			query: {
				filters: '[{"path":"date","mode":"on","inverted":false,"value":"'+ new Date().toISOString() + '","before":"2021-03-04T00:00:00+05:30","after":"2021-03-04T00:00:00+05:30"}]',
				columns: 'retailer,mPts,fPts,gp,bal,cancel,totalPtsColl,date',
				srbn: 4
			}
		}
	},
	{
		name: 'F.Pts',
		sub: '(Total Today)',
		color: '#9bbc4e',
		value: '...',
		prop: 'fpts',
		link: {
			pathname: "/admin/retailer-day-wise-reports",
			query: {
				filters: '[{"path":"date","mode":"on","inverted":false,"value":"'+ new Date().toISOString() + '","before":"2021-03-04T00:00:00+05:30","after":"2021-03-04T00:00:00+05:30"}]',
				columns: 'retailer,mPts,fPts,gp,bal,cancel,totalPtsColl,datet',
				srbn: 4
			}
		}
	},
	{
		name: 'G.P',
		sub: '(Total Today)',
		color: '#458ecc',
		value: '...',
		prop: 'gp',
		link: {
			pathname: "/admin/retailer-day-wise-reports",
			query: {
				filters: '[{"path":"date","mode":"on","inverted":false,"value":"'+ new Date().toISOString() + '","before":"2021-03-04T00:00:00+05:30","after":"2021-03-04T00:00:00+05:30"}]',
				columns: 'retailer,mPts,fPts,gp,bal,cancel,totalPtsColl,date',
				srbn: 4
			}
		}
	},
	{
		name: 'Bal',
		sub: '(Total Today)',
		color: '#9a78db',
		value: '...',
		prop: 'bal',
		link: {
			pathname: "/admin/retailer-day-wise-reports",
			query: {
				filters: '[{"path":"date","mode":"on","inverted":false,"value":"'+ new Date().toISOString() + '","before":"2021-03-04T00:00:00+05:30","after":"2021-03-04T00:00:00+05:30"}]',
				columns: 'retailer,mPts,fPts,gp,bal,cancel,totalPtsColl,date',
				srbn: 4
			}
		}
	},
	{
		name: 'Cancel',
		sub: '(Total Today)',
		color: '#f3c447',
		value: '...',
		prop: 'cancel',
		link: {
			pathname: "/admin/retailer-day-wise-reports",
			query: {
				filters: '[{"path":"date","mode":"on","inverted":false,"value":"'+ new Date().toISOString() + '","before":"2021-03-04T00:00:00+05:30","after":"2021-03-04T00:00:00+05:30"}]',
				columns: 'retailer,mPts,fPts,gp,bal,cancel,totalPtsColl,date',
				srbn: 4
			}
		}
	},
	{
		name: 'Total Pts Coll',
		sub: '(Total Today)',
		color: '#da7a65',
		value: '...',
		prop: 'ptsColl',
		link: {
			pathname: "/admin/retailer-day-wise-reports",
			query: {
				filters: '[{"path":"date","mode":"on","inverted":false,"value":"'+ new Date().toISOString() + '","before":"2021-03-04T00:00:00+05:30","after":"2021-03-04T00:00:00+05:30"}]',
				columns: 'retailer,mPts,fPts,gp,bal,cancel,totalPtsColl,date',
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
			tabLoaded: 0,
			tabFLoaded: 0,
			dashData: 0,
			totalErrors: 0,
			totalWorkers: 0,
			totalAgents: 0,
			counterData: counterData,
			topCampaigns: [],
			todayDate: new Date().toISOString(),
			yesterday: new Date(+new Date() - (1000*60*60*24)).toISOString(),
			sevenDaysAgo: new Date(+new Date() - (1000*60*60*24*7)).toISOString(),
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
						canPer: resp.canPer || 'u/n',
						payoutPer: resp.payoutPer || 'u/n',
						totalRetailers: resp.totalRetailers || 0,
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
									data: [resp.mpts, resp.fpts, resp.gp, resp.cancel, resp.bal, resp.ptsColl],
									backgroundColor: [
										'rgb(54, 162, 235)',
										'rgb(155, 188, 78)',
										'rgba(54, 162, 235, 1)',
										'rgba(255,99,132,1)',
										'rgba(75, 192, 192, 0.2)',
										'rgba(153, 102, 255, 0.2)',
										// 'rgba(255, 159, 64, 0.2)'
									],
									borderColor: [
										'rgb(54, 162, 235)',
										'rgb(155, 188, 78)',
										'rgba(255,99,132,1)',
										'rgba(75, 192, 192, 1)',
										'rgba(153, 102, 255, 1)',
										'rgba(255, 159, 64, 1)'
									]
								}],
								labels: [
									'M.Pts(' + resp.mpts + ')',
									'F.Pts(' + resp.fpts + ')',
									'G.P(' + resp.gp + ')',
									'Cancel(' + resp.cancel + ')',
									'Bal(' + resp.bal + ')',
									'Pts.Coll(' + resp.ptsColl + ')',
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
							<span onClick={this.toggleMainTab.bind(this, 0)}
								  className={this.state.tabLoaded === 0 ? 'tab-act-btn' : 'tab-nact-btn'}>Dashboard</span>
							<span onClick={this.toggleMainTab.bind(this, 0)}
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
										className="col-md-2 stat-pill top-pill" key={index} style={{width: '16%'}}>
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
					<div className="col-md-4 master-stats">{this.state.totalRetailers}<br/><span>Retailers</span></div>
					<div className="col-md-4 master-stats">{this.state.payoutPer}<br/><span>Payout given</span></div>
					<div className="col-md-4 master-stats">{this.state.canPer}<br/><span>Canceled</span></div>
					</div>
									</div>
									<div className="card-dashboard card-shadow"
										 style={{height: '293px', backgroundColor: '#fefefe'}}>
										<h2 className="dash-sub-head">Today Ratio Chart</h2>
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
											  className={this.state.tabFLoaded === 1 ? 'tab-act-btn' : 'tab-nact-btn'}>Yesterday</span>
										<span onClick={this.toggleFollowupTab.bind(this, 2)}
											  className={this.state.tabFLoaded === 2 ? 'tab-act-btn' : 'tab-nact-btn'}>Last 7 Days</span>
									</div>
									<div className="card-dashboard card-shadow table-followups"
										 style={{height: '560px', backgroundColor: '#fefefe', overflowY: 'auto'}}>
										{/*<iframe
													src={'/admin/followups?filters=%5B%7B"path"%3A"followupDate"%2C"mode"%3A"on"%2C"inverted"%3Afalse%2C"value"%3A"2018-10-22T06%3A30%3A00.000Z"%2C"before"%3A"2018-10-22T00%3A00%3A00%2B05%3A30"%2C"after"%3A"2018-10-22T00%3A00%3A00%2B05%3A30"%7D%5D&msp=1'}
													frameBorder="0"></iframe>*/}
										{
											this.state.tabFLoaded === 0 ? <ListView params={{
													listId: "retailer-day-wise-reports",
													columns: 'retailer,mPts,fPts,gp,bal,cancel,totalPtsColl,date',
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
														listId: "retailer-day-wise-reports",
														columns: 'retailer,mPts,fPts,gp,bal,cancel,totalPtsColl,date',
															filters: [{
																"path": "createdAt",
																"mode": "on",
																"inverted": false,
																"value": this.state.yesterday,
																"before": "2018-10-22T00:00:00+05:30",
																"after": "2018-10-22T00:00:00+05:30"
															}],
														sort: '-createdAt',
														nocreate: true
													}}/> :
													<ListView params={{
														listId: "retailer-day-wise-reports",
														columns: 'retailer,mPts,fPts,gp,bal,cancel,totalPtsColl,date',
														filters: [{
															"path": "createdAt",
															"mode": "after",
															"inverted": false,
															"value": this.state.sevenDaysAgo,
															"before": "2018-10-22T00:00:00+05:30",
															"after": "2018-10-22T00:00:00+05:30"
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



								<div className="col-md-12">
									<div className="card-dashboard card-shadow"
										 style={{height: '530px', backgroundColor: '#fefefe', overflowY: 'auto'}}>
										<h2 className="dash-sub-head">Detailed Retailer Wise Report</h2>
				<DateRangePicker startDate={moment("1/1/2014")} endDate={moment("3/1/2014")}>
				<div className="dp_btn">Click Me To Open Picker</div>
				</DateRangePicker>
										<table cellPadding="0" cellSpacing="0" className="Table ItemList">
											<colgroup>
												<col/>
												<col/>
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
															title="Sort by Name">Retailer
													</button>
												</th>
												<th colSpan="1">
													<button className="ItemList__sort-button th-sort"
															title="Sort by Recipient Count">Date
													</button>
												</th>
												<th colSpan="1">
													<button className="ItemList__sort-button th-sort"
															title="Sort by Open">M.Pts
													</button>
												</th>
												<th colSpan="1">
													<button className="ItemList__sort-button th-sort"
															title="Sort by Open Rate">F.Pts
													</button>
												</th>
												<th colSpan="1">
													<button className="ItemList__sort-button th-sort"
															title="Sort by Clicks">G.P
													</button>
												</th>
												<th colSpan="1">
													<button className="ItemList__sort-button th-sort"
															title="Sort by Clicks">Bal
													</button>
												</th>
												<th colSpan="1">
													<button className="ItemList__sort-button th-sort"
															title="Sort by Clicks">Cancel
													</button>
												</th>
												<th colSpan="1">
													<button className="ItemList__sort-button th-sort"
															title="Sort by Clicks">Total Pts Col
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
