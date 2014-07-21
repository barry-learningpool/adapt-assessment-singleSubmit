define(function(require) {

	var Backbone = require('backbone');
	var Adapt = require('coreJS/adapt');

	var singlesubmitview = Backbone.View.extend({

		className: "block singlesubmit",

		events: {
			'click .buttons-action': 'onSubmitClick'
		},

		onSubmitClick: function() { 
			this.options.parent.onSubmit();
		},

		initialize: function() {
			this.listenTo(Adapt, 'remove', this.remove);
			this.render();
		},

		render: function() {
	         var template = Handlebars.templates["singleSubmit"];
	        this.$el.html(template({submit: this.options.parent.settings.submit}));
	        return this;
		}
		
	});

	return singlesubmitview;
})
	