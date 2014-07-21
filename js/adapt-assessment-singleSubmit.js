/*
* adapt-singleSubmit
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/

define(function(require) {

	var Adapt = require('coreJS/adapt');
	var Backbone = require('backbone');
	var SingleSubmitView = require('extensions/adapt-assessment-singleSubmit/js/adapt-assessment-singleSubmit-view');

	var SingleSubmit = Backbone.View.extend({
		view: null,
		components: null,
		componentViews: null,
		submitted: false,
		settings: {},
		viewSetup: function(view) {
			//CAPTURE ASSESSMENT VIEW AND SUB COMPONENTS

			this.view = view;
			var assessment = view.model.get("_assessment");
			assessment._canShowFeedback = false;
			view.$el.addClass("singleSubmit");

			var subComponentModels = view.model.findDescendants("components");
			this.components = subComponentModels;
			this.componentViews = {};
			
		},
		insertButton: function() {
			//INSERT BUTTON AFTER BLOCK OR AT END

			var view = this.view;
			var buttonView = new SingleSubmitView({parent:SingleSubmit});
			var insertBeforeBlock = view.model.get("_assessment")._singleSubmit._insertBeforeBlock;

			var inner = view.$el.find(".article-inner");
			var innerChildren = inner.children();
			var insertBefore = null;
			for (var i = 0; i < innerChildren.length; i++) {
				var $block = $(innerChildren[i]);
				if ($block.is("." + insertBeforeBlock) || $block.find( "." + insertBeforeBlock ).length > 0) {
					insertBefore = $block;
					break;
				}
			}

			if (insertBefore !== null) insertBefore.before(buttonView.$el);
			else inner.append(buttonView.$el);
		},
		onInteraction: function(event) {
			//ENABLE BUTTON ON CANSUBMIT ALL
			if (SingleSubmit.submitted) return;

			var id = event.data._id;
			
			var canSubmit = true;
			_.each(SingleSubmit.componentViews, function(view) {
				if (view.canSubmit && !view.canSubmit() ) canSubmit = false;
			});

			if (canSubmit)
			SingleSubmit.view.$el.find(".buttons-action").removeAttr("disabled");

		},
		onSubmit: function() {
			_.each(SingleSubmit.componentViews, function(view) {
				var submitButton = view.$el.find(".buttons-action");
				view.$el.off("inview", SingleSubmit.onInteraction);
				view.$el.off("click", SingleSubmit.onInteraction);
				if (submitButton.length === 0) return;
				submitButton.trigger("click");
			});
			SingleSubmit.submitted = true;
			SingleSubmit.view.$el.find(".buttons-action").attr("disabled","");
		}
	});
	SingleSubmit = new SingleSubmit();


	//LISTEN TO GLOBAL EVENTS
		//SETUP VIEW
		Adapt.on("articleView:preRender", function(view) {
			if (!view.model.get("_assessment") && view.model.get("_assessment")._isEnable !== true) return;
			if (!view.model.get("_assessment")._singleSubmit && view.model.get("_assessment")._singleSubmit._isEnable !== true) return;

			SingleSubmit.settings = view.model.get("_assessment")._singleSubmit;

			SingleSubmit.viewSetup(view);
		});

		//INSERT BUTTON
		Adapt.on("articleView:postRender", function(view) {

			if (!view.model.get("_assessment") && view.model.get("_assessment")._isEnable !== true) return;
			if (!view.model.get("_assessment")._singleSubmit && view.model.get("_assessment")._singleSubmit._isEnable !== true) return;

			SingleSubmit.insertButton();

		});

		//SETUP COMPONENT INTERACTION CHECKING
		Adapt.on('componentView:postRender', function(componentView) {

			var componentId = componentView.model.get('_id');
			var blockId = componentView.model.get("_parentId");
			var articleId = Adapt.findById(blockId).get("_parentId");
			var article = Adapt.findById(articleId);

			if (!article.get("_assessment") && article.get("_assessment")._isEnable !== true) return;
			if (!article.get("_assessment")._singleSubmit && article.get("_assessment")._singleSubmit._isEnable !== true) return;

			if (SingleSubmit.components.findWhere({ _id: componentId }) === undefined) return;

			SingleSubmit.componentViews[componentId] = componentView;

			//SETUP SUB COMPONENT INTERACTION LISTENERS
			componentView.$el.on("inview", { _id: componentId }, SingleSubmit.onInteraction);
			componentView.$el.on("click", { _id: componentId }, SingleSubmit.onInteraction);

		});
})