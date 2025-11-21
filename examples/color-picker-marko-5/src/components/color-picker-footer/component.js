'use strict';

module.exports = class {
  handleColorSelected (color) {
    this.emit('color-selected', color);
  }
  handleHexInput () {
    let hexInput = this.getEl('hexInput').value;

    if (!hexInput.startsWith('#')) {
      hexInput = '#' + hexInput;
    }

    if (!isValidHexValue(hexInput)) {
      hexInput = this.input.colors[0];
    }

    this.emit('color-selected', hexInput);
  }
};

function isValidHexValue (hexValue) {
  return /^#[0-9A-F]{6}$/i.test(hexValue);
}