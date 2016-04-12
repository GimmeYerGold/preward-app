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

Date.prototype.dateMaker = function() {
   var yyyy = this.getFullYear().toString();
   var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
   var dd  = this.getDate().toString();
   return yyyy + "-" + (mm[1]?mm:"0"+mm[0]) + "-" + (dd[1]?dd:"0"+dd[0]); // padding
  };

var UserModel = Backbone.Firebase.Model.extend({
	initialize: function(uid) {
		this.url = `https://preward.firebaseio.com/users/${uid}`
	}
})	

var AutoComplete = Backbone.Firebase.Collection.extend({
	initialize: function(targetEmail) {
		this.url = ref.child("users").orderByChild("email").startAt(targetEmail).endAt(targetEmail+"\uf8ff").limitToFirst(20)
	},
	autoSync: false
})

var QueryByEmail = Backbone.Firebase.Collection.extend({
	initialize: function(targetEmail) {
		this.url = ref.child("users").orderByChild("email").equalTo(targetEmail)
	},
	autoSync: false
})

var UserMessages = Backbone.Firebase.Collection.extend({
	initialize: function(uid) {
		this.url = `https://preward.firebaseio.com/users/${uid}/messages`
	}
})

var DashPage = React.createClass({

	componentWillMount: function() {
		var self = this
		this.props.msgColl.on("sync", function() {
			self.forceUpdate()
		})
	},

	render: function() {

		var d = new Date();
		var currentDate = d.dateMaker()

		return (
			<div className="dashboard">
				<p>Welcome {ref.getAuth().password.email}!</p>
				<p>Today is: {currentDate}</p>
				<a href="#logout" >log out</a>
				<Messenger msgColl={this.props.msgColl} currentDate={currentDate} />
				<Inbox currentDate={currentDate} msgColl={this.props.msgColl}/>
			</div>	
		)
	}
})

var Inbox = React.createClass({

	_showMessage: function(mod,i) {
		return <Message currentDate={this.props.currentDate} msgData={mod} key={i} />
	},

	render: function() {
		return (
			<div className="inbox">
				{this.props.msgColl.map(this._showMessage)}
			</div>	
		)
	}
})

var Message = React.createClass({

	render: function() {

		var d = new Date();
		var currentDate = (d.dateMaker())
		var displayType = "block"
		var backgroundColor = "cornflowerblue"
		var messageText = this.props.msgData.get("content") 
		if(this.props.msgData.get("msg_date") > currentDate)  
			backgroundColor = "red",
			messageText = "Do not open until:" + this.props.msgData.get("msg_date")
		if (this.props.msgData.id === undefined)
			displayType = "none"
		return (
			<div style={{display:displayType, background: backgroundColor}}
				className="message" >
				<p className="author">from: {this.props.msgData.get("sender_email")}</p>
				
				<p className="content">{messageText}</p>
			</div>	
		)
	}	
})

var SelectItem = React.createClass({

	render: function(){

		return (
			<div className="listItem">
			<li>{this.props.selData}</li>
			</div>
		)
	}
})

var Messenger = React.createClass({

	targetEmail: "",
	msg: "",
	date: "",
	sendDate: "",

	_setTargetEmail: function(e) {

		this.targetEmail = e.target.value
		
		var results = new AutoComplete(this.targetEmail)

		results.fetch()	
		results.on("sync", function() {
			
			results.map(function(sel, j){

				console.log(sel.attributes.email)

				DOM.render(<SelectItem selData={sel.attributes.email} key={j} />, document.querySelector(".selectList"))
			})
		})
	},

	_setMsg: function(e) {
		this.msg = e.target.value
	},

	_setMsgDate: function(e) {
		this.date = e.target.value
	},

	_submitMessage: function() {

		var queriedUsers = new QueryByEmail(this.targetEmail)
		var self = this

		if(self.targetEmail === undefined || self.targetEmail === "" ) {
			alert("Enter a valid email address.") 
			return
		}

		if (self.date === "" || self.date === undefined || self.date < this.props.currentDate) {
			alert("Select a valid date starting from today.") 
			return
		}	
		if (self.msg === "") {
			alert("Message is blank!") 
			return

		} else {
			queriedUsers.fetch()
			queriedUsers.on("sync", function() {

				if (queriedUsers.models.length === 0) {
			alert("That user does not exist.") 
			return

			} else {

				var userId = queriedUsers.models[0].get("id")

				// var sentDate = self.props.currentDate

					var userMsgCollection = new UserMessages(userId)
					userMsgCollection.create({
						content: self.msg,
						sender_email: ref.getAuth().password.email,
						msg_date: self.date,
						sender_id: ref.getAuth().uid,
						// sent_date: 
					})

					self.targetEmail = ""
					self.msg = ""
					self.date = ""

					self.refs.targetEmail.value = ""
					self.refs.msg.value = ""
					self.refs.msgDate.value = ""

					alert("message sent!")

					return
				}			
			})	
		}		
    },

	render: function() {

		return (

			<div className="messenger">
				<input ref="targetEmail" placeholder="recipient email" onChange={this._setTargetEmail} />
				<div className="selection">
					<ul className="selectList">

					</ul>
				</div>

				<textarea ref="msg" placeholder="your message here" onChange={this._setMsg} />
				<p>Date To Be Opened:</p>
  				<input type="date" ref="msgDate" min={this.props.currentDate} onChange={this._setMsgDate} />
				<button sentDate={this.sentDate} onClick={this._submitMessage} > submit!</button>
			</div>	
		)
	}
})

var SplashPage = React.createClass({
	email: "",
	password: "",
	nickName: "",

	_handleSignUp: function() {
		this.props.createUser(this.email,this.password,this.nickName)
	},

	_handleLogIn: function() {
		this.props.logUserIn(this.email, this.password)
	},

	_updateEmail: function(event) {
		this.email = event.target.value 
	},

	_updateName: function(event) {
		this.nickName = event.target.value
	},

	_updatePassword: function(event) {
		this.password = event.target.value
	},

	render: function() {
		return (
			<div className="loginContainer">
				<input placeholder="enter your email" onChange={this._updateEmail} />
				<input placeholder="your password" onChange={this._updatePassword} type="password" />
				<input placeholder="choose a nickname" onChange={this._updateName} />
				<div className="splashButtons">
					<button onClick={this._handleSignUp} >sign up</button>
					<button onClick={this._handleLogIn}> log in</button>
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
    	var msgColl = new UserMessages(uid)
    	DOM.render(<DashPage user={this.email} msgColl={msgColl}/>,document.querySelector(".container"))
    },

    _logUserIn: function(email,password){
    	console.log(email,password)
    	this.ref.authWithPassword({
    		email: email,
    		password: password
    	}, function(err, authData) {
    	   		if (err) console.log(err)
    			else {
    				location.hash = "dash"
    			}	
    		}	
    	)
    },

    _createUser: function(email,password,nickName) {
    	console.log(email, password)
    	var self = this
    	this.ref.createUser({
    		email: email,
    		password: password,
    		nickName: nickName
    	}, function(err, authData) {
    		if (err) console.log(err)
    		else {
    			var userMod = new UserModel(authData.uid)
    			userMod.set({
    				name: nickName,
    				email: email,
    				id: authData.uid
    			})
    			self._logUserIn(email,password)
    		}		
    	})
    }
})
    var pr = new PrewardRouter()
    Backbone.history.start()
}

app()
