import polyfill from "babel-polyfill"
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
	}
})

//sends user challenge via found username

var QueryByUser = Backbone.Firebase.Collection.extend({
	initialize: function(targetUserName) {
		this.url = ref.child("users").orderByChild("userName").equalTo(targetUserName)
	},

})

var ChallengeModel = Backbone.Model.extend({
	defaults: {
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

		var selected = {fontWeight: "bold",
						color: "tomato"}			
		
		return (
			<div className="dashboard">

				<div className="sidePanel">
					<div className="userBioRow">
					<img className="userImage" src={ref.getAuth().password.profileImageURL}/>
						<div className="stats">
							<h6 className="userName">robbieandbobby</h6>
							<h6>Level 1</h6>
						</div>
					</div>	
					<div className="achievementsChallengesSection">
					<div className="achievementsContainer">
						<a className="achievements" href="#achievements"> Achievements</a>
						<a className="achievementsCount" href="#achievements">99</a>
					</div>
					<div className="challengesContainer">	
						<a className="challenges" href="#challenges"> Challenges</a>
						<a className="challengesCount" href="#achievements">99</a>
					</div>	
					</div>	
				</div>
	
				<div className="viewPanel">	
					<div className="challengeController">	
					<a className="issueChallenge" href="#issuechallenge" >Issue a Challenge</a>
					<a className="challengesIssued" href="#challengesissued" >Challenges Issued</a>
					<a className="logout" href="#logout" >Log Out</a>
					</div>	

					<Challenges challengeColl={this.props.challengeColl} />
				</div>			
			</div>	
		)
	}
})

var Challenger = React.createClass({

	targetUserName: "",
	challenge: "",
	tasks: [],
	imageFile: null,
	rewardLink: "",
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

	_setRewardLink: function(e) {
		this.rewardLink = e.target.value
	},

	_issueChallenge: function() {

		var queriedUsers = new QueryByUser(this.targetUserName)
		var self = this,

			challengeObject = {
				content: self.challenge,
				tasks: [],
				sender_email: ref.getAuth().password.email,
				image_data: self.imageFile,
				link_data: self.rewardLink,
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

		if (self.challenge === "") {
			alert("Message is blank!") 
			return	
	
		} else {
				 promise.then(sendMessage)
			
					self.targetUserName = ""
					self.challenge = ""
					self.rewardLink = ""
					self.imageFile = ""
					self.currentDate = ""
 
					self.refs.targetUserName.value = ""
					self.refs.challenge.value = ""

					self.refs.imageFile.value = ""
					self.refs.rewardLink.value = ""

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

				<h6>The Challenge</h6>
				<input ref="challenge" placeholder="Declare the challenge!" onChange={this._setChallenge} />
				<div className="rewardContainer">
				<h6>The Reward</h6>

				<input ref="rewardLink" className="rewardLinker" type="url" placeholder="send a link" onChange={this._setRewardLink} required pattern="https?://.+"/>
				<button className="splashButtons" sentDate={this.sentDate} onClick={this._issueChallenge} > confirm</button>
				</div>
			</div>
		</div>		
		)
	}
})

var Challenge = React.createClass({

	render: function() {

		var displayType = "block"
		var messageText = this.props.challengeData.get("content")
		var contentDisplay = "block"
		var hyperlink = this.props.challengeData.get("link_data")
		 
		if (this.props.challengeData.id === undefined)
			displayType = "none"

		return (
			<div style={{display: displayType}} className="message" >
				<div className="messageDetails">
					<p className="author">from: {this.props.challengeData.get("sender_email")}</p>
					<p className="content">{messageText}</p>
				</div>
				<div className="trophyContainer">	
				<img className="trophy" src="./images/trophyshadow.png" />
				<h6 className="completeness">0%</h6>
				</div>
				<a className="hyperlink" href={hyperlink} >{hyperlink}</a>
			</div>	
		)
	}	
})

var Challenges = React.createClass({

	_showChallenges: function(mod,i) {
		return <Challenge challengeData={mod} key={i} />
	},

	render: function() {
		return (
			<div className="challenges">
				{this.props.challengeColl.map(this._showChallenges)}
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
				<img className="goldTrophy" src="./images/trophygoldshadow.png" />
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

    var IchieveRouter = Backbone.Router.extend({
    	routes: {
    		"splash" : "_showSplashPage",
    		"dash" : "_showDashboard",
    		"logout" : "_handleLogOut",
    		"issuechallenge" : "_showChallenger",
    		"challenges" : "_showChallenges",
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

    	var uid = ref.getAuth().uid
    	var challengeColl = new UserChallenges(uid)
    	DOM.render(<Challenger challengeColl={challengeColl} />, document.querySelector(".container"))
    },

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
    var pr = new IchieveRouter()
    Backbone.history.start()
}

app()
