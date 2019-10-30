module.exports = {
  onInput: function (input) {
    var steps = input.steps || [];
    var activeIndex = 0;

    steps.forEach(function (step) {
      if (step.active) {
        activeIndex = steps.length;
      }
    });

    this.state = {
      steps: steps,
      activeIndex: activeIndex
    };
  },

  setCurrentStepIndex (index) {
    if (this.state.activeIndex === index) {
      return;
    }

    var defaultPrevented = false;

    this.emit('beforeChange', {
      step: this.state.steps[this.state.activeIndex],
      preventDefault () {
        defaultPrevented = true;
      }
    });

    if (defaultPrevented) {
      return;
    }

    var newStep = this.state.steps[index];

    this.state.activeIndex = index;

    this.emit('change', {
      name: newStep.name,
      index: index
    });
  },

  handleStepClick (stepIndex, event) {
    event.preventDefault();
    this.setCurrentStepIndex(stepIndex);
  }
};
