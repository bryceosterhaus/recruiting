/** @jsx React.DOM */
var React = require('react');

var setRecruit = require('../redux/actions/set-recruit');

module.exports = React.createClass({
	contextTypes: {
		store: React.PropTypes.object
	},

	getInitialState: function() {
		return {
			recruit: this.context.store.getState()
		}
	},

	componentDidMount: function() {
		var instance = this;

		var source = function(request, response) {
			$.ajax(
				{
					url: 'api/skills?term=' + request.term,
					type: 'GET',
					dataType: "json",
					success: function(data) {
						var nameArray = $.map(data, function(item) {
							return item.label.toLowerCase();
						});

						var term = request.term;

						if (nameArray.indexOf(term.toLowerCase()) === -1) {
							data.push(
								{
									label: 'Create new skill: ' + term,
									newSkill: true,
									value: term
								}
							);
						}

						instance._acItems = data;

						response(data);
					},
					error: function(err) {
						console.log('error', err);
					}
				}
			);
		};

		$(this.refs.skills).autocomplete(
			{
				source: source,
				minLength: 1,
				delay: 100,
				select: function(event, ui) {
					var item = ui.item;

					instance.addSkill(item);

					return false;
				}
			}
		).autocomplete( "instance" )._renderItem = function(ul, item) {
			return $( "<li>" )
				.attr("data-value", item.value)
				.attr("data-newSkill", item.newSkill)
				.append( item.label )
				.appendTo( ul );
		};
	},

	componentDidUpdate: function() {
		var recruit = this.state.recruit;

		this.context.store.dispatch(setRecruit(recruit));
	},

	addSkill: function(skill) {
		if (skill.newSkill) {
			this.postNewSkill(skill)
		}
		else {
			var recruit = this.state.recruit;

			recruit.skills.push(skill);

			this.setState({recruit: recruit});
		}

		$(this.refs.skills).val('');
	},

	removeSkill: function(event) {
		var target = event.target;

		var id = target.getAttribute('data-id');

		var recruit = this.state.recruit;

		$.grep(
			recruit.skills,
			function(item, index) {
				if (item._id == id) {
					recruit.skills.splice(index,1);
				}
			}
		);

		this.setState({recruit: recruit});
	},

	postNewSkill: function(item) {
		var instance = this;

		$.ajax(
			{
				url: 'api/skills',
				type: 'POST',
				dataType: "json",
				data: {label: item.value},
				success: function(response) {
					instance.addSkill(response.data);
				},
				error: function(err) {
					console.log('error', err);
				}
			}
		);
	},

	onChange: function(event) {
		var value = $(event.currentTarget).val();

		if (value && this._acItems) {
			var valueLength = value.length;

			var lastChar = value.charAt(valueLength - 1);

			if (lastChar && lastChar === ',') {
				this.addSkill(this._acItems[0]);
			}
		}
	},

	onInputBlur: function(event) {
		$(event.currentTarget).val('');
	},

	render: function() {
		var instance = this;

		var recruit = this.state.recruit;

		return (
			<fieldset className="row form-group">
				<label htmlFor="skillsInput">Know any technical skills?</label>

				<div className="form-control combo-box">
				{
					recruit.skills.map(
						function(skill) {
							return (
								<span className="pill" key={skill._id}>
									{skill.label}
									<button data-id={skill._id} onClick={instance.removeSkill} type="button" className="close">
										<span aria-hidden="true">&times;</span>
										<span className="sr-only">Close</span>
									</button>
								</span>
							);
						}
					)
				}
				<input ref="skills" type="text" className="skills-input" onChange={this.onChange} onBlur={this.onInputBlur} placeholder="HTML, Java, Photoshop, etc" />
				</div>
			</fieldset>
		);
	}
});
