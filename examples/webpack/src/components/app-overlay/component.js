export default class {
  onInput(input) {
    this.state = { visible: Boolean(input.visible) };
  }

  onMount() {
    this.fixPageScrolling();
  }

  onUpdate() {
    this.fixPageScrolling();
  }

  fixPageScrolling() {
    if (this.state.visible === true) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }

  hide() {
    this.setVisibility(false);
  }
  show() {
    this.setVisibility(true);
  }

  setVisibility(visible) {
    if (this.state.visible === visible) {
      // Visibility did not change... nothing to do
      return;
    }

    if (visible) {
      this.emit("show");
    } else {
      this.emit("hide");
    }

    this.state.visible = visible;
  }

  handleMaskClick() {
    this.hide();
  }
  handleCancelButtonClick() {
    this.emit("cancel", {});
    this.hide();
  }
  handleDoneButtonClick() {
    let defaultPrevented = false;

    this.emit("ok", {
      preventDefault() {
        defaultPrevented = true;
      }
    });

    if (!defaultPrevented) {
      this.hide();
    }
  }
};
