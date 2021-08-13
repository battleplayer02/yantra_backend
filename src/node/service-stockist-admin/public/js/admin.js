window.__onLocationLoaded = function () {
	var loc = window.location.href;
	console.log('Called....', loc);
	jQuery('.left-menu-item a').removeClass('active');
	if (loc.search(/\/admin\/customers.+filters.+resubmitted/i) > -1) jQuery('.it-unverified a').addClass('active');
	else if (loc.search(/\/admin\/customers.+filters.+welcomePackPrepared.+verified/i) > -1) jQuery('.it-verified a').addClass('active');
	else if (loc.search(/\/admin\/customers.+filters.+rejected/i) > -1) jQuery('.it-rejected a').addClass('active');
	else if (loc.search(/\/admin\/customers.+filters.+delivered.+welcomePackPrepared/i) > -1) jQuery('.it-welcome-pack a').addClass('active');
	else if (loc.search(/\/admin\/customers.+filters.+isDeleted.+true/i) > -1) jQuery('.it-deleted a').addClass('active');
	else if (loc.search(/\/admin\/campaigns/i) > -1) jQuery('.it-campaigns a').addClass('active');
	else if (loc.search(/\/admin\/awb-upload-requests/i) > -1) jQuery('.it-awb a').addClass('active');
	else if (loc.search(/\/admin\/customers/i) > -1) jQuery('.it-allmem a').addClass('active');
	else if (loc.search(/\/admin\/lead/i) > -1) jQuery('.it-responses a').addClass('active');
	else if (loc.search(/\/admin(\/)?(\?|$)/i) > -1) jQuery('.it-dash a').addClass('active');
	
	// add special CSs on special model. HAck
	if(location.href.search(/daily-user-stats/) > -1){
		jQuery('.field-type-number').addClass('large-label-width');
	}
};

setTimeout(function () {
	window.__onLocationLoaded();
}, 100);


window._rejectUser = function (item, e, cb) {
	// window.location.href = '/admin/customers/' + item.id;
	jQuery('.r_modals').html('<div class="reject-modal"></div>');
	jQuery('.reject-modal').load('/views/rejectModal.html', function () {
		console.log('Loaded!');
		
		jQuery('.reject-modal .close').click(function(){
			jQuery('.reject-modal').remove();
		});
		
		// toggle dropdown menu
		jQuery('.reject-modal .dropdown-menu').click(function() {
			jQuery('.reject-modal .dropdown-menu .dropdown-list').css('display', jQuery('.reject-modal .dropdown-menu .dropdown-list').css('display') === 'block' ? 'none' : 'block');
		});
		
		// Select an option from dropdown
		jQuery('.reject-modal .dropdown-menu .Select-option').click(function(e) {
			e.preventDefault();
			jQuery('.reject-modal .dropdown-menu .Select-option').removeClass('is-selected');
			jQuery(this).addClass('is-selected');
			jQuery('.reject-modal .reject-form').get()[0].rejectReason.value = jQuery(this).attr('data-value');
			jQuery('.reject-modal .reject-form .reject-comment-box').css('display', jQuery(this).attr('data-value') === 'Other' ? 'table' : 'none')
			jQuery('.reject-modal .reject-form .Select-value-label').html(jQuery(this).attr('data-value'));
		});
		
		// submit function for form
		jQuery('.reject-modal form').submit(function (event) {
			event.preventDefault();
			const data = jQuery('.reject-modal .reject-form').serializeArray();
			const requestObject = {
				status: 'Rejected',
				rejectReason: data.find(formData => formData.name === 'rejectReason').value,
				rejectComment: data.find(formData => formData.name === 'rejectComment').value,
				welcomePackPrepared: false,
			};
			console.log('Submitted....', requestObject);
			
			jQuery.post(
				'/admin/api/update-status/customers/' + item.id, requestObject,
				function (resp) {
					cb();
					setTimeout(() => jQuery('.reject-modal').remove(), 100);
				}
			).fail(function (error) {
				console.log(error);
			});
		});
	});
};

window._acceptUser = function (item, e, cb) {

	   swal({
			title: "Are you sure you want to accept this terminal?",
			type: "info",
			showCancelButton: true,
			confirmButtonText: 'Yes',
			cancelButtonText: "No",
			closeOnConfirm: false,
			closeOnCancel: true
		}, function (yes) {
			if (!yes) return;

			swal.disableButtons();

			jQuery.get('/admin/api/findByVin/' + item.id, {}, function (res) {
				if (res && res.status) {
					let html = `<strong>There are already users with the same vin number</strong> 
								<table class="mergeResults">
										<tr>
											<th>Name</th>
											<th>Email</th>
											<th>Phone</th>
										</tr>`;
					let td = '';

					(res.results).forEach(function (obj) {
						let emails = [];

						if (obj.alternativeEmails) emails = obj.alternativeEmails;

						if (obj.email) emails.push(obj.email);

						td += '<tr>';

						td += `<td class="matched">${obj.name && obj.name.first || ''} ${obj.name && obj.name.last || ''} (${obj.vin})</td>`;

						td += `<td class="matched">${emails.map(el => el)}</td>`;

						td += `<td class="matched">${obj.phoneNumbers.map(el => el)}</td>`;

						td += '</tr>';

					});

					html += td + '</table>';
					
					swal({
						title: ``,
						html: true,
						showCancelButton: true,
						text: html,
						confirmButtonText: 'ok',
						closeOnConfirm: true,
						inputPlaceholder: "",
						closeOnCancel: true
					}, function (yes) {
						console.log('yes')
					})
				} else {
					jQuery.get('/admin/api/getCustomers/' + item.id, {}, function (user) {
						if (user.results && user.results.length) {
							let html = `<strong>User already exists</strong> 
								<table class="mergeResults">
										<tr>
											<th>Name</th>
											<th>Email</th>
											<th>Phone</th>
										</tr>`;
							let td = '';

							(user.results).forEach(function (obj) {
								let emails = [];

								if (obj.alternativeEmails) emails = obj.alternativeEmails;
								
								if (obj.email) emails.push(obj.email);

								td += '<tr>';

								td += `<td class="matched">${obj.name && obj.name.first || ''} ${obj.name && obj.name.last || ''}</td>`;

								td += `<td class="matched">${emails.map(el => el)}</td>`;

								td += `<td class="matched">${obj.phoneNumbers.map(el => el)}</td>`;

								td += '</tr>';

							});

							html += td + '</table>';

							swal({
								title: ``,
								html: true,
								text: html,
								showCancelButton: true,
								confirmButtonText: 'Do you want to merge this user ?',
								cancelButtonText: "create new ?",
								closeOnConfirm: true,
								inputPlaceholder: "",
								closeOnCancel: true
							}, function (yes) {
								if (yes) {
									let mergedIds = user.results.map((el) => el._id);
									mergedIds.push(item.id);
									swal.disableButtons();
									jQuery.post('/admin/api/user-merge-requests/create', {
										customersToBeMerged: mergedIds,
										doMerge: true
									}, function (resp) {
										swal({
											title: "User successfully merged",
											type: "success",
											showCancelButton: false,
											confirmButtonText: 'Ok',
											closeOnConfirm: false,
											closeOnCancel: true
										});
										cb();
									}).fail(function (error) {
										console.log(error);
									})
								} else verifyUser()
							})
						} else verifyUser()
					}).fail(function (e) {
						console.log(e);
					})
				}
			});
		}
	);

	function verifyUser() {
		jQuery.post('/admin/api/update-status/customers/' + item.id, {
				status: 'Verified',
				verifiedOn: +new Date(),
				welcomePackPrepared: false
			}, function (resp) {
				swal({
					title: "User successfully added",
					type: "success",
					showCancelButton: false,
					confirmButtonText: 'Ok',
					closeOnConfirm: false,
					closeOnCancel: true
				});
				cb();
			}
		).fail(function (error) {
			console.log(error);
		});
	}
};

window._sendToAgent = function (item, e, cb) {
	if (!confirm('Are you sure you want to send this user to agency? It will also trigger the welcome mail to this user.')) return;
	console.log(item);
	jQuery.post(
		'/admin/api/update-status/customers/' + item.id,
		{
			status: 'Verified',
			welcomePackStatus: 'Undelivered',
			welcomePackPrepared: true,
			mailedOn: +new Date()
		},
		function (resp) {
			cb();
		}
	)
		.fail(function (error) {
			console.log(error);
		});
};

window._sendToPinter = function (item, e, cb) {
	if (!confirm('Are you sure you want to send this user to printer?')) return;
	console.log(item);
	jQuery.post(
		'/admin/api/update-status/customers/' + item.id,
		{
			status: 'Verified',
			sharedWithPrinterOn: +new Date()
		},
		function (resp) {
			cb();
		}
	)
		.fail(function (error) {
			console.log(error);
		});
};


window._reRequestWP = function (item, e, cb) {
	if (!confirm('Are you sure you want to send this user to agent for re-shipping of welcome pack?')) return;
	console.log(item);
	jQuery.post(
		'/admin/api/update-status/customers/' + item.id,
		{
			welcomePackStatus: 'Re-Requested',
			welcomePackPrepared: true,
			sharedWithPrinterOn: 'reset'
		},
		function (resp) {
			cb();
		}
	)
		.fail(function (error) {
			console.log(error);
		});
};

window._lostWP = function (item, e, cb) {
	if (!confirm('Are you sure you want to send this user to agent reporting card is lost?')) return;
	console.log(item);
	jQuery.post(
		'/admin/api/update-status/customers/' + item.id,
		{
			welcomePackStatus: 'Re-Requested',
			welcomePackPrepared: true,
			currentCardStatus: 'Pending Loss Request',
			sharedWithPrinterOn: 'reset'
		},
		function (resp) {
			cb();
		}
	)
		.fail(function (error) {
			console.log(error);
		});
};
