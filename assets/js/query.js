function $(selector, startNode) {
  return (startNode || document).querySelector(selector)
}

function $$(selector, startNode) {
  var list = (startNode || document).querySelectorAll(selector)
  var nodes = []

  for (var i = 0; i < list.length; i++) {
    nodes.push(list[i])
  }

  return nodes
}
