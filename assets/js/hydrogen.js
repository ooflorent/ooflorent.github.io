function highlightHydrogen(node) {
  var code = node.textContent
  var frag = hydrogen(code)
console.log(frag)
  node.parentElement.replaceChild(frag, node)
}

function hydrogen(code) {
  var instructions = []
  var lines = code.trim().split('\n')

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i]

    // Block declaraction
    var m = line.match(/^(B\d+)/)
    if (m) {
      instructions.push(h('span.w', {'data-gutter': m[1]}, '\n'))
      continue
    }

    // Comment
    var m = line.match(/^##(.+)$/)
    if (m) {
      instructions.push(h('span.c', m[1] + '\n'))
      continue
    }

    // Instruction
    var m = line.match()
  }

  return h('.highlight.highlight-gutter', [
    h('pre', [
      h('code.language-hydrogen', instructions)
    ])
  ])
}
