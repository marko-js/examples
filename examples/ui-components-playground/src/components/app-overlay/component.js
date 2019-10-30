module.exports = {
  onInput (input) {
    this.state = {
      width: input.width || '80%',
      visible: input.visible === true
    };
  },

  onMount () {
    this.fixPageScrolling();
  },

  onUpdate () {
    this.fixPageScrolling();
  },

  fixPageScrolling () {
    if (this.state.visible === true) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  },

  hide () {
    this.setVisibility(false);
  },

  show () {
    this.setVisibility(true);
  },

  setVisibility (visible) {
    if (this.state.visible === visible) {
      // Visibility did not change... nothing to do
      return;
    }

    if (visible) {
      this.emit('show');
    } else {
      this.emit('hide');
    }

    this.setState('visible', visible);
  },

  handleMaskClick () {
    this.hide();
  },

  handleCancelButtonClick () {
    this.emit('cancel', {});
    this.hide();
  },

  handleDoneButtonClick () {
    var preventDefault = false;

    this.emit('ok', {
      preventDefault () {
        preventDefault = true;
      }
    });

    if (!preventDefault) {
      this.hide();
    }
  }
};
