var raptorPubsub = require('raptor-pubsub');
var button = require('../app-button');
var checkbox = require('../app-checkbox');
var progressBar = require('../app-progress-bar');
var extend = require('raptor-util/extend');

var buttonSizes = ['small', 'normal', 'large'];
var buttonVariants = ['primary', 'secondary'];

var currentButtonSize = 0;
var currentButtonVariant = 0;

module.exports = {
    onInput: function(input) {
        var now = (new Date()).toString();

        this.state = {
            buttonSize: input.buttonSize || 'small',
            buttonVariant: input.buttonVariant || 'primary',
            overlayVisible: false,
            checked: input.checked || {
                foo: false,
                bar: true,
                baz: false
            },
            dynamicTabs: [
                {
                    timestamp: now
                },
                {
                    timestamp: now
                }
            ]
        };
    },

    handleCheckboxToggle: function(event, sourceWidget) {
        // event.preventDefault();

        var name = event.data.name;

        // We treat complex objects stored in the state as immutable
        // since only a shallow compare is done to see if the state
        // has changed. Instead of modifying the "checked" object,
        // we create a new object with the updated state of what is
        // checked.
        var newChecked = extend({}, this.state.checked);
        newChecked[name] = event.checked;
        this.setState('checked', newChecked);
    },

    /**
     * This demonstrates how to provide a custom state transition handler to avoid
     * a full rerender.
     */
    update_overlayVisible: function(overlayVisible) {
        this.getComponent('overlay').setVisibility(overlayVisible);
    },

    handleShowOverlayButtonClick: function() {
        // this.setState('overlayVisible', true);
        this.getComponent('overlay').show();
    },

    handleOverlayHide: function() {
        // Synchronize the updated state of the o
        this.setState('overlayVisible', false);
    },

    handleOverlayShow: function() {
        this.setState('overlayVisible', true);
    },

    handleShowNotificationButtonClick: function() {
        raptorPubsub.emit('notification', {
            message: 'This is a notification'
        });
    },

    handleOverlayOk: function() {
        raptorPubsub.emit('notification', {
            message: 'You clicked the "Done" button!'
        });
    },

    handleOverlayCancel: function() {
        raptorPubsub.emit('notification', {
            message: 'You clicked the "Cancel" button!'
        });
    },

    handleRenderButtonClick: function() {
        button.renderSync({
                label: 'Hello World'
            })
            .appendTo(this.getEl('renderTarget'));
    },

    handleRenderCheckboxButtonClick: function() {
        checkbox.renderSync({
                label: 'Hello World',
                checked: true
            })
            .appendTo(this.getEl('renderTarget'));
    },

    handleRenderProgressBarButtonClick: function() {
        progressBar.renderSync({
                steps: [
                    {
                        label: 'Step 1'
                    },
                    {
                        label: 'Step 2'
                    },
                    {
                        label: 'Step 3',
                        active: true
                    },
                    {
                        label: 'Step 4'
                    }
                ]
            })
            .appendTo(this.getEl('renderTarget'));
    },

    handleChangeButtonSizeClick: function() {
        var nextButtonSize = buttonSizes[++currentButtonSize % buttonSizes.length];
        this.state.buttonSize = nextButtonSize;
    },

    handleChangeButtonVariantClick: function() {
        var nextButtonVariant = buttonVariants[++currentButtonVariant % buttonVariants.length];
        this.state.buttonVariant = nextButtonVariant;
    },

    handleToggleCheckboxButtonClick: function(event) {
        var checkbox = this.getComponent('toggleCheckbox');
        checkbox.toggle();
    },

    handleAddTabButtonClick: function() {
        this.state.dynamicTabs = this.state.dynamicTabs.concat({
            timestamp: '' + new Date()
        });
    }
};