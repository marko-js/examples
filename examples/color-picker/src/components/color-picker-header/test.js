/* global test */
const expect = require('chai').expect;

test('color-picker-header color', function (context) {
  const output = context.render({
    color: '#000000'
  });

  expect(output.$('div').attr('style')).to.contain('background-color:#000000');
});

test('color-picker-header class included', function (context) {
  const output = context.render({
    color: '#000000'
  });

  expect(output.$('div').attr('class')).to.equal('color-picker-header');
});
