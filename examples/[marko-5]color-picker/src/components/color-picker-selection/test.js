/* global test */
const expect = require('chai').expect;

test('color-picker-selection color', function (context) {
  const output = context.render({
    color: '#ff8080'
  });

  expect(output.$('div').attr('style')).to.contain('background-color:#ff8080');
});

test('color-picker-selection when clicked should emit color-selected event', function (context) {
  const output = context.render({
    color: '#ff8080'
  });

  var component = output.component;
  var isCalled = false;
  component.on('color-selected', function () {
    isCalled = true;
  });

  var componentEl = component.el;
  componentEl.click();

  expect(isCalled).to.equal(true);
});
