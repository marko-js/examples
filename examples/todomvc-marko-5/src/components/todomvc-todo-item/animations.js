exports.animateOut = (event, node) => {
  event.preventDefault();
  node.classList.add('animate');
  var height = node.offsetHeight;
  node.style.maxHeight = height + 'px';

  setTimeout(() => {
    node.style.maxHeight = '0px';
    node.style.opacity = 0;

    setTimeout(() => {
        event.detach();
    }, 250);
  }, 0);
};

exports.animateIn = (event, node) => {
  var height = node.offsetHeight;
  node.classList.remove('animate');
  node.style.maxHeight = '0px';
  node.style.opacity = 0;

  setTimeout(() => {
    node.classList.add('animate');
    node.style.maxHeight = height + 'px';
    node.style.opacity = 1;
  }, 10);
}
