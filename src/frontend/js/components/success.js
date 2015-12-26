/** @jsx React.DOM */
var React = require('react');

var History = require('react-router').History;

module.exports = React.createClass({
	mixins: [History],

	componentDidMount: function() {
		var instance = this;

		setTimeout(
			function() {
				window.location.href = window.location.origin + '/#/form';
			},
			5000
		);
	},

	render: function() {
		var cityName = this.props.location.query.city;
		var message = '';

		if (cityName) {
			message = 'You were sent to ' + cityName + '.';
		}

		return (
			<div className="success-page">
				<div className="message row">
					Thanks for participating! 
					<br />
					{message}
				</div>
				<div className="row">
					<img className="success-image" src="/documents/checkmark.gif" />
				</div>
				<div className="message row">
					Please talk to a Liferay person and ask for your free t-shirt.
				</div>
			</div>
		);
	}
});