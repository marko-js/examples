export default class {
  onInput(input) {
    let activeIndex = 0;

    if (input.steps) {
      input.steps.forEach((step, i) => {
        if (step.active) {
          activeIndex = i;
        }
      });
    }

    this.state = {
      activeIndex
    };
  }

  setCurrentStepIndex(index) {
    const { state, input } = this;
    if (state.activeIndex === index) {
      return;
    }

    let defaultPrevented = false;

    this.emit("beforeChange", {
      step: input.steps[state.activeIndex],
      preventDefault() {
        defaultPrevented = true;
      }
    });

    if (defaultPrevented) {
      return;
    }

    const newStep = input.steps[index];

    state.activeIndex = index;

    this.emit("change", {
      name: newStep.name,
      index: index
    });
  }

  handleStepClick(stepIndex, event) {
    event.preventDefault();
    this.setCurrentStepIndex(stepIndex);
  }
};
