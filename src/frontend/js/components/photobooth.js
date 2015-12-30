/** @jsx React.DOM */
var React = require('react');

var setRecruit = require('../redux/actions/set-recruit');

module.exports = React.createClass({
	contextTypes: {
		store: React.PropTypes.object
	},

	getInitialState: function() {
		return {
			autoplay: true,
			showVideo: true,
			countdown: null,
			recruit: this.context.store.getState()
		}
	},

	componentDidMount: function() {
		var recruit = this.state.recruit;

		if (!recruit._id) {
			this.bindPhotoBooth();
		}
	},

	componentDidUpdate: function() {
		var recruit = this.state.recruit;

		this.context.store.dispatch(setRecruit(recruit));
	},

	bindPhotoBooth: function() {
		this.canvasNode = this.refs.imageCanvas;
		var videoDisplay = this.refs.webcamDisplay;

		this.videoDisplay = videoDisplay;

		var videoObj = {"video": true};

		var errBack = function(error) {
			console.log('Video capture error: ', error);
		};

		if(navigator.getUserMedia) { // Standard
			navigator.getUserMedia(videoObj, function(stream) {
				videoDisplay.src = stream;
				videoDisplay.play();
			}, errBack);
		} else if(navigator.webkitGetUserMedia) { // WebKit-prefixed
			navigator.webkitGetUserMedia(videoObj, function(stream){
				videoDisplay.src = window.URL.createObjectURL(stream);
				videoDisplay.play();
			}, errBack);
		}
		else if(navigator.mozGetUserMedia) { // Firefox-prefixed
			navigator.mozGetUserMedia(videoObj, function(stream){
				videoDisplay.src = window.URL.createObjectURL(stream);
				videoDisplay.play();
			}, errBack);
		}
	},

	takePhoto: function() {
		var instance = this;

		var context = this.canvasNode.getContext('2d');

		context.drawImage(this.videoDisplay, 0, 0, 400, 300);

		var imageData = this.canvasNode.toDataURL('image/jpeg');

		this.refs.imageDataInput.value = imageData;

		var recruit = instance.state.recruit;

		recruit.profilePicture = imageData;

		instance.setState({recruit: recruit});

		this.setState({showVideo: false});
	},

	handlePhotoRetake: function() {
		var instance = this;

		var recruit = this.state.recruit;

		recruit.profilePicture = null;

		this.setState({
			countdown: null,
			recruit: recruit,
			showVideo: true
		}, function() {
			instance.bindPhotoBooth();
		});
	},

	handleSnapPhoto: function() {
		var instance = this;

		var countdownNode = this.refs.photoCountdown;

		instance.setState({countdown: 3});

		var interval = setInterval(
			function() {
				var newVal = instance.state.countdown - 1;

				if (newVal === 0) {
					newVal = <i className="fa fa-smile-o"></i>;

					clearInterval(this);
				}

				instance.setState({countdown: newVal});
			},
			1000
		);

		setTimeout(
			function() {
				clearInterval(interval);

				instance.takePhoto();
			},
			3500
		);
	},

	render: function() {
		var recruit = this.state.recruit;

		if (recruit._id) {
			return (
				<div className="img-container">
					<img className="card-img-top" src={recruit.profilePicture} />
				</div>
			);
		}
		else {
			var button = <button type="button" className="btn btn-primary" onClick={this.handlePhotoRetake}>Retake Photo</button>;
			var videoDisplay;
			var countdown;

			if (this.state.showVideo) {
				videoDisplay = (
					<div>
						<video ref="webcamDisplay" width="400" height="300" autoPlay={this.state.autoplay} src={recruit.profilePicture}></video>
					</div>
				);

				button = <button type="button" className="btn btn-primary" onClick={this.handleSnapPhoto}>Snap Photo</button>
			}

			if (this.state.countdown) {
				var cssClass = 'photo-countdown';

				var number = this.state.countdown;

				if (typeof this.state.countdown === 'object') {
					cssClass += ' flash';
					number = '';
				}

				countdown = (
					<div className={cssClass}>
						<span>{number}</span>
					</div>
				);
			}

			return (
				<fieldset className="form-group photo-booth">
					<h3>Take a picture! (Required)</h3>

					<div className="video-container">
						{countdown}

						{videoDisplay}
						<canvas ref="imageCanvas" hidden={this.state.showVideo} width="400" height="300"></canvas>
					</div>

					<input ref="imageDataInput" type="hidden" name="profilePicture" />

					<div className="photo-button">
						{button}
					</div>
				</fieldset>
			);
		}
	}
});