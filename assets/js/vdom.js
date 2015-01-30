function h(selector, properties, children) {
  var nodes = []
  var props

  if (children == null && isChildren(properties)) {
    children = properties
    props = {}
  } else {
    props = properties || {}
  }

  if (children != null) {
    addChild(nodes, children)
  }

  var tag = parseSelector(selector, props)
  var el = document.createElement(tag)

  for (var prop in props) {
    if (props.hasOwnProperty(prop)) {
      el.setAttribute(prop, props[prop])
    }
  }

  for (var i = 0; i < nodes.length; i++) {
    el.appendChild(nodes[i])
  }

  return el
}

function parseSelector(selector, props) {
  var parts = selector.split(/([.#]?[a-zA-Z0-9_-]+)/)
  var classes = []
  var tag

  if (/^[.#]/.test(selector)) {
    tag = 'DIV'
  }

  for (var i = 0; i < parts.length; i++) {
    var part = parts[i]
    if (!part) continue

    if (part[0] === '.') {
      classes.push(part.slice(1))
    } else if (part[0] === '#') {
      if (props.id == null) {
        props.id = part[0].slice(1)
      }
    } else {
      tag = part
    }
  }

  if (props['class']) {
    classes.push(props['class'])
  }

  if (classes.length) {
    props['class'] = classes.join(' ')
  }

  return tag.toUpperCase()
}

function isChild(x) {
  return x instanceof Node
}

function isChildren(x) {
  return isChild(x) || Array.isArray(x) || typeof x === 'string'
}

function addChild(nodes, x) {
  if (Array.isArray(x)) {
    x.forEach(addChild.bind(null, nodes))
  } else if (isChild(x)) {
    nodes.push(x)
  } else if (typeof x === 'string') {
    nodes.push(document.createTextNode(x))
  }
}
