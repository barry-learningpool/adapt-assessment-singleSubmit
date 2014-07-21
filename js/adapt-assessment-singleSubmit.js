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
			var count = 0;
			_.each(SingleSubmit.componentViews, function(view) {
				if (view.model.get("_isComplete")) return;
				if (!view.model.get("_isVisible")) return;
				if (typeof view.canSubmit !== "undefined") {
					if (!view.canSubmit() ) canSubmit = false;
					count++;
				} else {
					if (typeof view.model.get("_selectable") !== "undefined") {
						if (view.model.get("_selectedItems").length === 0) canSubmit === false;
						count++;
					}
				}
			});

			if (canSubmit && count > 0)
			SingleSubmit.view.$el.find(".buttons-action").removeAttr("disabled");

		},
		onSubmit: function() {
			_.each(SingleSubmit.componentViews, function(view) {
				if (!view.model.get("_isVisible")) return;
				var submitButton = view.$el.find(".buttons-action");
				if (submitButton.length === 0) submitButton = view.$el.find(".button.submit");
				view.$el.off("inview", SingleSubmit.onInteraction);
				view.$el.off("click", SingleSubmit.onInteraction);
				if (submitButton.length === 0) return;
				submitButton.trigger("click");
			});
			//SingleSubmit.submitted = true;
			SingleSubmit.view.$el.find(".buttons-action").attr("disabled","");
		},
		findById : function(id) {
			if (Adapt.findById === undefined) {
				var componentTypes = {
					"co": "contentObjects",
					"a": "articles",
					"b": "blocks",
					"c": "components"
				};
				var prefix = id.substr(0, id.indexOf("-"));
				return Adapt[componentTypes[prefix]].findWhere({ _id: id });
			} else {
				return Adapt.findById(id);
			}
		}
	});
	SingleSubmit = new SingleSubmit();


	//LISTEN TO GLOBAL EVENTS
		//SETUP VIEW
		Adapt.on("articleView:preRender", function(view) {
			if (typeof view.model.get("_assessment") === "undefined" || view.model.get("_assessment")._isEnabled !== true) return;
			if (typeof view.model.get("_assessment")._singleSubmit === "undefined" || view.model.get("_assessment")._singleSubmit._isEnabled !== true) return;

			SingleSubmit.settings = view.model.get("_assessment")._singleSubmit;

			SingleSubmit.viewSetup(view);
		});

		//INSERT BUTTON
		Adapt.on("articleView:postRender", function(view) {

			if (typeof view.model.get("_assessment") === "undefined" || view.model.get("_assessment")._isEnabled !== true) return;
			if (typeof view.model.get("_assessment")._singleSubmit === "undefined" || view.model.get("_assessment")._singleSubmit._isEnabled !== true) return;

			SingleSubmit.insertButton();

		});

		//SETUP COMPONENT INTERACTION CHECKING
		Adapt.on('componentView:postRender', function(componentView) {

			var componentId = componentView.model.get('_id');
			var blockId = componentView.model.get("_parentId");
			var articleId = SingleSubmit.findById(blockId).get("_parentId");
			var article = SingleSubmit.findById(articleId);

			if (typeof article.get("_assessment") === "undefined" ||article.get("_assessment")._isEnabled !== true) return;
			if (typeof article.get("_assessment")._singleSubmit === "undefined" || article.get("_assessment")._singleSubmit._isEnabled !== true) return;

			if (SingleSubmit.components.findWhere({ _id: componentId }) === undefined) return;

			SingleSubmit.componentViews[componentId] = componentView;

			//SETUP SUB COMPONENT INTERACTION LISTENERS
			componentView.$el.on("inview", { _id: componentId }, SingleSubmit.onInteraction);
			componentView.$el.on("click", { _id: componentId }, SingleSubmit.onInteraction);

		});
})