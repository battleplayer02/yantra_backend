
module.exports = function (req, res) {

	req.list.model.findById(req.params.id, function (err, item) {


		if (err) return res.status(500).json({error: 'database error', detail: err});
		if (!item) return res.status(404).json({error: 'not found', id: req.params.id});
		if (req.param('status')) item.status = req.param('status');
		if (req.param('verifiedOn')) item.verifiedOn = new Date(parseInt(req.param('verifiedOn'), 10));
		if (req.param('rejectReason')) item.rejectReason = req.param('rejectReason');
		if (req.param('rejectComment')) item.rejectComment = req.param('rejectComment');
		if (req.param('welcomePackPrepared')) item.welcomePackPrepared = (req.param('welcomePackPrepared') === 'true');
		if (req.param('welcomePackStatus')) item.welcomePackStatus = req.param('welcomePackStatus');
		if (req.param('currentCardStatus')) item.currentCardStatus = req.param('currentCardStatus');
		if (req.param('mailedOn')) item.mailedOn = new Date(parseInt(req.param('mailedOn'), 10));
		if (req.param('sharedWithPrinterOn') === 'reset') item.sharedWithPrinterOn = null;
		else if (req.param('sharedWithPrinterOn')) item.sharedWithPrinterOn = new Date(parseInt(req.param('sharedWithPrinterOn'), 10));
		req.list.updateItem(item, item, {files: req.files, user: req.user}, function (err) {
			if (err) {
				var status = err.error === 'validation errors' ? 400 : 500;
				var error = err.error === 'database error' ? err.detail : err;
				return res.apiError(status, error);
			}
			// Reload the item from the database to prevent save hooks or other
			// application specific logic from messing with the values in the item
			req.list.model.findById(req.params.id, async function (err, updatedItem) {
					res.json(req.list.getData(updatedItem));
			});
		});
	});
};
