module.exports = {
  onInput: function(input) {
    this.state = {
      width: input.width || "80%",
      visible: input.visible === true ? true : false,
      body: input.renderBody
    };
  },

  onMount: function() {
    this.fixPageScrolling();
  },

  onUpdate: function() {
    this.fixPageScrolling();
  },

  fixPageScrolling: function() {
    if (this.state.visible === true) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  },

  hide: function() {
    this.setVisibility(false);
  },
  show: function() {
    this.setVisibility(true);
  },

  setVisibility: function(visible) {
    if (this.state.visible === visible) {
      // Visibility did not change... nothing to do
      return;
    }

    if (visible) {
      this.emit("show");
    } else {
      this.emit("hide");
    }

    this.setState("visible", visible);
  },

  handleMaskClick: function() {
    this.hide();
  },
  handleCancelButtonClick: function() {
    this.emit("cancel", {});
    this.hide();
  },
  handleDoneButtonClick: function() {
    var preventDefault = false;

    this.emit("ok", {
      preventDefault: function() {
        preventDefault = true;
      }
    });

    if (!preventDefault) {
      this.hide();
    }
  }
};
