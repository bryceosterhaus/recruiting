var async = require('async');
var cityModel = require('../models/city');
var countryModel = require('../models/country');
var peopleModal = require('../models/people');

var Utils = require('../utilities/utils');

var OBJ_ERROR = {'success': false, 'message': 'Unknown Error Occured'};

module.exports = function(router, io) {
	router.route('/api/recruits')
		.get(
			function(req, res) {
				var term = req.query.term;
				var delta = req.query.delta;

				if (!term) {
					term = '';
				}

				if (!delta) {
					delta = null;
				}

				var regex = new RegExp('.*' + term + '.*', 'i');

				peopleModal.find(
					{fullName: regex},
					function(err,data) {
					var response = {};

					if (err) {
						response = OBJ_ERROR;
					}
					else {
						response = data;
					}

					res.json(response);
				}).limit(delta);
			}
		)
		.post(
			function(req,res) {
				var body = req.body;
				var db = new peopleModal();

				var firstName = body.firstName;
				var lastName = body.lastName;

				if (firstName && lastName && body.email) {
					for (var key in body) {
						if (body[key] !== undefined) {
							db[key] = body[key];
						}
					}

					db.fullName = firstName + ' ' + lastName;

					async.series([
						function(callback){
							var profilePicture = body.profilePicture;

							if (profilePicture) {
								var imageBuffer = Utils.decodeBase64Image(profilePicture);

								Utils.writeImage(imageBuffer, db._id, function(event) {
									db.profilePicture = event;

									callback(null, 1);
								});
							}
							else {
								db.profilePicture = '/documents/default_avatar.jpg';

								callback(null, 1);
							}
						},
						function(callback){
							var generateCityLocation = function(country) {
								countryModel.findOne(
									{label:country},
									function(err, data) {
										if (data) {
											cityModel.find(
												{country: data.code[0]},
												function(err, data) {
													var city = data[Math.floor(Math.random()*data.length)];

													if (city) {
														db.missionsLocation = city.full;
														db.geoPoints = [city.latitude, city.longitude];
													}

														callback(null, 2);
												}
											);
										}
										else {
											return;
										}
									}
								);
							}

							var missionsLocation = body.missionsLocation;

							if (!missionsLocation) {
								missionsLocation = countryModel.find(
									{},
									function(err, data) {
										var country = data[Math.floor(Math.random()*data.length)];

										generateCityLocation(country.label);
									}
								);
							}
							else {
								generateCityLocation(missionsLocation);
							}
						}
					],
					function() {
						db.save(
							function(err) {
								var response = {};

								if (err) {
									response = OBJ_ERROR;
								}
								else {
									response = {'data': db, 'success': true, 'message': 'Successfully submitted!'};
								}

								res.json(response);

								io.emit('newRecruit', db);
							}
						);
					});
				}
				else {
					res.json({'success': false, 'message': 'First name, last name, and email are all required fields.'});
				}
			}
		);

	router.route('/api/recruits/:id')
		.get(
			function(req,res) {
				peopleModal.findById(
					req.params.id,
					function(err, data) {
						var response = {};

						if (err) {
							response = OBJ_ERROR;
						}
						else {
							response = data;
						}

						res.json(response);
					}
				);
			}
		)
		.put(
			function(req,res) {
				peopleModal.findById(
					req.params.id,
					function(err,data) {
						var response = {};

						if (err) {
							response = OBJ_ERROR
						}
						else {
							var body = req.body;

							var firstName = body.firstName;
							var lastName = body.lastName;

							if (!firstName) {
								firstName = data.firstName;
							}

							if (!lastName) {
								lastName = data.lastName;
							}

							for (var key in body) {
								if (body[key] !== undefined) {
									data[key] = body[key];
								}
							}

							data.fullName = firstName + ' ' + lastName;

							data.save(
								function(err, newData) {
									if (err) {
										response = OBJ_ERROR;
									}
									else {
										response = {'data': newData, 'success': true, 'message': 'Data is updated for ' + req.params.id};
									}

									res.json(response);
								}
							);
						}
					}
				);
			}
		)
		.delete(
			function(req,res) {
				peopleModal.findById(
					req.params.id,
					function(err,data) {
						var response = {};

						if (err) {
							response = OBJ_ERROR
						}
						else {
							peopleModal.remove(
								{_id: req.params.id},
								function(err) {
									if (err) {
										response = OBJ_ERROR;
									}
									else {
										response = {'success': true, 'message': 'Data associated with '+req.params.id+'is deleted'};
									}

									res.json(response);
								}
							);
						}
					}
				);
			}
		);
}