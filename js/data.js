import Backbone from 'bbfire'

var Collections = {

	AutoComplete: Backbone.Firebase.Collection.extend({
	initialize: function(targetVal) {
		this.url = ref.child("users").orderByChild("email").startAt(targetVal).endAt(targetVal+"\uf8ff").limitToFirst(20)
	},

	OtherOne: Backbone.Firebase.Collection.extend({
	initialize: function(targetVal) {
		this.url = ref.child("users").orderByChild("email").startAt(targetVal).endAt(targetVal+"\uf8ff").limitToFirst(20)
	},

	// autoSync: false
})
}

var auto = new Collections.AutoComplete(event.target.value)
export {Collections,Models}
