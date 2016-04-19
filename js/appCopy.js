// es5, 6, and 7 polyfills, powered by babel
import polyfill from "babel-polyfill"

//
// fetch method, returns es6 promises
// if you uncomment 'universal-utils' below, you can comment out this line
import fetch from "isomorphic-fetch"
import DOM from 'react-dom'
import React, {Component} from 'react'
import Backbone from 'bbfire'
import Firebase from 'firebase'

var ref = new Firebase("https://preward.firebaseio.com/")

//sets up promise

Backbone.Firebase.Model.prototype.fetchWithPromise = Backbone.Firebase.Collection.prototype.fetchWithPromise = function() {
	this.fetch()
	var self = this
	var p = new Promise(function(res, rej){
		self.once('sync', function() {
			res()
	})
	self.once("err", function() {
		rej()
	})		
		})
	return p
}

//sets up usermodel with unique id for each

var UserModel = Backbone.Firebase.Model.extend({
	initialize: function(uid) {
		this.url = `https://preward.firebaseio.com/users/${uid}`
	}
})	

//autocompleter for guessing user names

var AutoComplete = Backbone.Firebase.Collection.extend({
	initialize: function(targetVal) {

		if(targetVal.length > 0) {

		this.url = ref.child("users").orderByChild("userName").startAt(targetVal).endAt(targetVal+"\uf8ff").limitToFirst(20)
		}

		else { targetVal = " "

			this.url = ref.child("users").orderByChild("userName").startAt(targetVal).endAt(targetVal+"\uf8ff").limitToFirst(20)
		}	
	},
	// autoSync: false
})

//sends user challenge via found username

var QueryByUser = Backbone.Firebase.Collection.extend({
	initialize: function(targetUserName) {
		this.url = ref.child("users").orderByChild("userName").equalTo(targetUserName)
	},
	// autoSync: false
})

var ChallengeModel = Backbone.Model.extend({
	defaults: {
		tasks: [],
		done: false
	}
})


var UserChallenges = Backbone.Firebase.Collection.extend({
	model: ChallengeModel,
	initialize: function(uid) {
		this.url = `https://preward.firebaseio.com/users/${uid}/challenges`
	}
})

var DashPage = React.createClass({

	componentWillMount: function() {
		var self = this

		var promise = this.props.challengeColl.fetchWithPromise()

		promise.then(function() {
			self.forceUpdate()
		})
	},

	render: function() {

		console.log(ref.getAuth())

		// var d = new Date();
		// var currentDate = d.dateMaker()
		
		return (
			<div className="dashboard">
				<div className="userContainer">
					<img className="userImage" src={ref.getAuth().password.profileImageURL}/>
					<div className="userControls">
					<div className="userNameLogOutSection">
						<h6 className="userName">username</h6><a className="logout" href="#logout" >Log Out</a>
					</div>
					<div className="achievementsChallengesSection"><a className="achievements" href="#achievements">99 Achievements</a>
						<a className="challenges" href="#challenges">99 Challenges</a>
					</div>	
				<Inbox challengeColl={this.props.challengeColl} />
					<div className="challengeController">	
					<a className="issueChallenge" href="#issuechallenge" >Issue a Challenge</a>
					<a className="challengesIssued" href="#challengesissued" >Challenges Issued</a>
					</div>
					</div>
				</div>	
			</div>
		)
	}
})

var PrewardsPage = React.createClass({

	componentWillMount: function() {
		var self = this

		var promise = this.props.challengeColl.fetchWithPromise()

		promise.then(function() {
			self.forceUpdate()
		})
	},

	render: function() {

		// var d = new Date();
	
		// var currentDate = d.dateMaker()

		return (
			<div className="dashboard">
				<p>Welcome {ref.getAuth().password.email}!</p>
				<a href="#logout" >Log Out</a>
				<a href="#issuechallenge" >Issue a Challenge</a>
				<a href="#dash"> Back</a>
				<PrewardInbox challengeColl={this.props.challengeColl} />
			</div>	
		)
	}
})

var Inbox = React.createClass({

	_showMessage: function(mod,i) {
		return <Message challengeData={mod} key={i} />
	},

	render: function() {
		return (
			<div className="inbox">
				{this.props.challengeColl.map(this._showMessage)}
			</div>	
		)
	}
})

var PrewardInbox = React.createClass({


	_showMessage: function(mod,i) {

		return <Preward challengeData={mod} key={i} />
	},

	render: function() {
		return (
			<div className="inbox">
				{this.props.challengeColl.map(this._showMessage)}
			</div>	
		)
	}
})

var Message = React.createClass({

	render: function() {

		// var d = new Date();
		// var currentDate = d.dateMaker()

		var displayType = "block"
		var imgStyle = "block"
		var backgroundColor = "cornflowerblue"
		var messageText = this.props.challengeData.get("content")
		var contentDisplay = "block"
		var hyperlink = this.props.challengeData.get("link_data")
		 
		// if(this.props.msgData.get("msg_date") > currentDate)
			displayType = "none",  
			backgroundColor = "red",
			messageText = "Do not open until:" + this.props.challengeData.get("msg_date")

		if (!this.props.challengeData.get("image_data")) imgStyle ="none"	
		if (this.props.challengeData.id === undefined)
			displayType = "none"

		// if (this.props.type === "pre") {
		// 	contentDisplay = "none"
		// }
		return (
			<div style={{display:displayType, background: backgroundColor}}
				className="message" >
				<p className="author">from: {this.props.challengeData.get("sender_email")}</p>
				<p className="content">{messageText}</p>
				<img style={{display: imgStyle}} src={this.props.challengeData.get('image_data')} />
				<a className="hyperlink" href={hyperlink} >{hyperlink}</a>
			</div>	
		)
	}	
})

var Preward = React.createClass({

	render: function() {

		// var d = new Date();
		// var currentDate = (d.dateMaker())

		var displayType = "none"
		var backgroundColor = "cornflowerblue"
		var messageText = this.props.msgData.get("content")
 
		// if(this.props.challengeData.get("msg_date") > currentDate)

 	// 		displayType = "block",
		// 	backgroundColor = "red",
		// 	messageText = "Do not open until:" + this.props.challengeData.get("msg_date")
		if (this.props.challengeData.id === undefined)
			displayType = "none"
		return (
			<div style={{display:displayType, background: backgroundColor}}
				className="message" >
				<p className="author">from: {this.props.challengeData.get("sender_email")}</p>
				<p className="sendDate">sent on: {this.props.challengeData.get("sent_date")}</p>
				<div className="timeLine">
	    			<div className="progressBar">
	  				<div className="howMuchLonger"></div>
	      			</div>
				</div>
				<p className="content">{messageText}</p>
			</div>	
		)
	}	
})

var Challenger = React.createClass({

	targetUserName: "",
	challenge: "",
	imageFile: null,
	hyperlink: "",
	// date: "",
	sendDate: "",
	currentDate: "",

	_setTargetUserName: function(e) {

		var here = this

		this.targetUserName = e.target.value
		
		var results = new AutoComplete(this.targetUserName)

		var promise = results.fetchWithPromise()

		promise.then(function() {

			var liEls = results.map(function(sel, j){

				if(sel.get("userName")) {

					console.log(sel)

				return <li key={j}>{sel.get("userName")}</li> 
				}
			})

			here.setState({
				queriedNames: liEls
			})
		})
	},

	_setChallenge: function(e) {
		this.challenge = e.target.value
	},

	_setUpload: function(e) {
		var inputEl = e.target
		this.imageFile = inputEl.files[0]

		if (this.imageFile) {
            var reader = new FileReader()
            reader.readAsDataURL(this.imageFile)
            reader.addEventListener('load', function() {
                var base64string = reader.result
                 this.imageFile = base64string
            })
		}
	},	

	_setHyperlink: function(e) {
		this.hyperlink = e.target.value
	},

	_issueChallenge: function() {

		// var d = new Date();

		// var currentDate = (d.dateMaker())

		var queriedUsers = new QueryByUser(this.targetUserName)
		var self = this,

			challengeObject = {
				content: self.challenge,
				sender_email: ref.getAuth().password.email,
				image_data: self.imageFile,
				link_data: self.hyperlink,
				// challenge_date: self.date,
				// sent_date: currentDate,
				sender_id: ref.getAuth().uid,
				
				}

		var sendMessage = function() {
			console.log('sending challenge')
			var userId = queriedUsers.models[0].get("id")

			if (queriedUsers.models.length === 0) {
			alert("That user does not exist.") 
			return

			} else {

			var userChallengeCollection = new UserChallenges(userId)

					userChallengeCollection.create(challengeObject)
			}
		}	

		var promise = queriedUsers.fetchWithPromise()	

		if (this.imageFile) {
            var reader = new FileReader()
            reader.readAsDataURL(this.imageFile)
            reader.addEventListener('load', function() {
                var base64string = reader.result
                ChallengeObject.image_data = base64string
                promise.then(sendMessage)
            })
        }	
	
		if(self.targetUserName === undefined || self.targetUserName === "" ) {
			alert("Enter a valid email address.") 
			return
		}

		// if (self.date === "" || self.date === undefined || self.date < this.props.currentDate) {
		// 	alert("Select a valid date starting from today.") 
		// 	return
		// }	

		if (self.challenge === "") {
			alert("Message is blank!") 
			return	
	
		} else {
				 promise.then(sendMessage)
			
					self.targetUserName = ""
					self.challenge = ""
					// self.date = ""
					self.hyperlink = ""
					self.imageFile = ""
					self.currentDate = ""
 
					self.refs.targetUserName.value = ""
					self.refs.challenge.value = ""
					// self.refs.msgDate.value = ""
					self.refs.imageFile.value = ""
					self.refs.hyperlink.value = ""

					this.state.queriedNames = []

					alert("message sent!")

					return
			}			
		},
	
    getInitialState: function() {

    	 return {queriedNames: []};
    },

	render: function() {

		return (

			<div className="challenger">
			<div className="challengerSideBar">
			<img className="userImage" src={ref.getAuth().password.profileImageURL}/>
			</div>
			<div className="composeChallenge">	
				<div className="selection">
					<input ref="targetUserName" placeholder="Issue a challenge to whom?" onChange={this._setTargetUserName} onBlur={this._clearSuggestions} />
					<ul className="queryResults">{this.state.queriedNames}</ul>
				</div>

				<input ref="challenge" placeholder="Declare the challenge!" onChange={this._setChallenge} />
				<div className="rewardContainer">
				<h6>The Reward</h6>

				<input ref="hyperlink" className="hyperlinker" type="url" placeholder="send a link" onChange={this._setHyperlink} required pattern="https?://.+"/>
				<input ref="imageFile" className="uploader" type="file" onChange={this._setUpload} />
				<button sentDate={this.sentDate} onClick={this._issueChallenge} > confirm</button>
				<button onClick={function(){location.hash="dash"}}> cancel </button>
				</div>
			</div>
		</div>		
		)
	}
})

var SplashPage = React.createClass({
	email: "",
	password: "",
	userName: "",

	_handleSignUp: function() {
		this.props.createUser(this.email,this.password, this.userName)
	},

	_handleLogIn: function() {
		this.props.logUserIn(this.email, this.password, this.userName)
	},

	_updateEmail: function(event) {
		this.email = event.target.value 
	},

	_updateUser: function(event) {
		this.userName = event.target.value
	},

	_updatePassword: function(event) {
		this.password = event.target.value
	},

	render: function() {

		return (
			<div className="loginContainer">
				<div className="inputContainer">
				<img src="/images/trophy.png" />
				<h3>ichieve</h3>
				<input type="email" name="email" placeholder="enter your email" onChange={this._updateEmail} required/>
				<input type="text" name="username" placeholder="enter your username" onChange={this._updateUser} required/>
				<input type="text" name="password" placeholder="enter your password" onChange={this._updatePassword} type="password" required/>
				<div className="splashButtons">
					<button onClick={this._handleLogIn}> Log in</button>
					<button onClick={this._handleSignUp} >Sign up</button>	
					</div>	
				</div>	
			</div>	
		)
	}
})

function app() {
    // start app
    // new Router()

    var PrewardRouter = Backbone.Router.extend({
    	routes: {
    		"splash" : "_showSplashPage",
    		"dash" : "_showDashboard",
    		"logout" : "_handleLogOut",
    		"issuechallenge" : "_showChallenger",
    		"challenges" : "_showPrewards",
    		"achievements" : "_showAchievements",
    		"challengesissued" : "_showIssuedChallenges",
    		"*default" : "_showSplashPage"
    	},

    	initialize: function() {
    		this.ref = new Firebase("https://preward.firebaseio.com/")
    		window.ref = this.ref

    	if (!this.ref.getAuth()) {
                location.hash = "splash"
            }	

    	this.on("route", function() {	
    		if (!this.ref.getAuth()) {
    			location.hash = "splash"
    		}
    	})	
    },

    _handleLogOut: function() {
    	this.ref.unauth()
    	location.hash = "splash"
    },

    _showSplashPage: function() {
    	DOM.render(<SplashPage logUserIn={this._logUserIn.bind(this)}
    		createUser={this._createUser.bind(this)} />, document.querySelector(".container"))
    },

    _showDashboard: function() {

    	var uid = ref.getAuth().uid
    	var challengeColl = new UserChallenges(uid);

    	DOM.render(<DashPage user={this.email} challengeColl={challengeColl}/>,document.querySelector(".container"))
    },

    _showChallenger: function() {

  //   	var d = new Date();
		// var currentDate = (d.dateMaker())

    	var uid = ref.getAuth().uid
    	var challengeColl = new UserChallenges(uid)
    	DOM.render(<Challenger challengeColl={challengeColl} />, document.querySelector(".container"))
    },

    // _showPrewards: function() {
    // 	var uid = ref.getAuth().uid
    // 	var challengeColl = new UserChallenges(uid)
    // 	DOM.render(<PrewardsPage user={this.email} challengeColl={challengeColl}/>,document.querySelector(".container"))
    // },

    _logUserIn: function(email,password,userName){
    	console.log(email, password, userName)
    	this.ref.authWithPassword({
    		email: email,
    		password: password,
    		userName: userName,
    	}, function(err, authData) {
    	   		if (err) console.log(err)
    			else {
    				location.hash = "dash"
    			}	
    		}	
    	)
    },

    _createUser: function(email,password,userName) {
    	console.log(email, password, userName)
    	var self = this
    	this.ref.createUser({
    		email: email,
    		password: password,
    		userName: userName,
    	}, function(err, authData) {
    		if (err) console.log(err)
    		else {
    			var userMod = new UserModel(authData.uid)
    			userMod.set({
    				email: email,
    				userName: userName,
    				id: authData.uid,
    			})
    			self._logUserIn(email,password,userName)
    		}		
    	})
    }
})
    var pr = new PrewardRouter()
    Backbone.history.start()
}

app()
