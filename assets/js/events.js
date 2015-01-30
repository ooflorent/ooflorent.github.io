function bind(node, event, fn) {
  node.addEventListener(event, fn)
}

function unbind(node, event, fn) {
  node.removeEventListener(event, fn)
}

function trigger(node, event) {
  node.dispatchEvent(event)
}
