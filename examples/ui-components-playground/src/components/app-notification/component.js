module.exports = {
  onInput: function (input) {
    this.state = {
      timeout: input.timeout,
      message: input.message
    };
  },

  onMount: function () {
    const el = this.getEl("root");
    setTimeout(function () {
      el.style.opacity = 1;
      el.style.maxHeight = '60px';
    }, 10);
  },

  fadeOut: function (callback) {
    const el = this.getEl("root");
    el.style.opacity = 0;
    setTimeout(callback, 300);
  }
};
