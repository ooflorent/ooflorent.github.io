---
layout: post
title: Weird loop speed-up
pitch: What you see may not be what you get…
date: 2015-01-30
---

## Introduction

A few days ago some, while reading [phaser3](https://github.com/photonstorm/phaser3)'s source code, I faced a weird loop optimization. Some hot loops were written in an unusual way. The developer left a comment to explain the trick:

```js
// weird loop speed-up (http://www.paulirish.com/i/d9f0.png) gained 2fps on my rig!
for ( var i = -1, c = 0; ++i < len; c += 44 )
```

What [Paul Irish](https://twitter.com/paul_irish) is showing here is interesting. His test suggests that manually unrolling loops would improve performance. If you run his snippet in Chrome you will observe the speed boost.

> Let's rewrite all our loops that way!<br>
> **NO! don't blindly trust micro-benchmarks.**

- - -

## Analysis

### Execution environment

I did not immediately realize it when I saw [Paul Irish's screenshot](http://www.paulirish.com/i/d9f0.png)… Pay attention to the numbers. Why are the loops so slow? Why is there such a big performance difference when our loops are wrapped by functions? What if evaluating those scripts in the Devtools' inspector was far more costly than running the loops? Would the results be pertinent?

The below snippet tries to calculate the evaluation cost. To achieve it we need to disable V8's optimizations (using `try/catch`).

```js
function isolate() {
  var start = Date.now()
  try {
    for (var i = 0; i < 1e6; i++);
  } catch (e) {}
  return Date.now() - start
}

var start = Date.now()
try {
  for (var i = 0; i < 1e6; i++);
} catch (e) {}
var delta = Date.now() - start
var deltaIsolate = isolate()

console.log(String(deltaIsolate) + 'ms')          //   2ms
console.log(String(delta - deltaIsolate) + 'ms')  // 364ms
```

There is it! The loop iteration cost is less than 1%. Before making assumptions about which loop syntax is the fastest we need to setup a better benchmarking environment.

### Loops

As seen, the execution cost of the inspector may be huge compared to what we try to benchmark. We also have to pay close attention to how V8 will optimize our functions: **Dead Code Elimination** can ruin the results!

```js
function standardLoop() {
  var count = 0
  for (var i = 0; i < 1e8; i++) count += 1
  if (count !== 1e8) throw ''
}

function weirdLoop() {
  var count = 0
  for (var i = -1; ++i < 1e8;) count += 1
  if (count !== 1e8) throw ''
}

function measure(test, fn) {
  var start = Date.now()
  fn()
  print(String(Date.now() - start) + 'ms')
}

// First run
measure('Standard loop', standardLoop)  // 101ms
measure('Weird loop', weirdLoop)        // 113ms

// Second run (optimized)
measure('Standard loop', standardLoop)  // 66ms
measure('Weird loop', weirdLoop)        // 91ms
```

Interesting! We are not able to reproduce the performance boost. But more important, the gap between the _standard_ loop and the _weird_ one has increased on the second run. This is because V8 optimized the loops. I could have stopped here saying that _standard_ loops are faster than their _weird_ alternatives but it would be a poor conclusion. No, what we really want to know is **why is there a difference**.

[Vyacheslav Egorov](http://mrale.ph) built an amazing tool ([IRHydra^2](http://mrale.ph/irhydra/2/)) to analyze compilation artifacts produced by V8. To use it we need to pass some flags to V8:

```sh
$ d8 \
  --trace-hydrogen \
  --trace-phase=Z \
  --trace-deopt \
  --code-comments \
  --hydrogen-track-positions \
  --redirect-code-traces \
  --redirect-code-traces-to=code.asm \
  --print-opt-code \
  loop.js
```

The above command will output 2 files: `code.asm` and `hydrogen-xxxxx-1.cfg`. Loading them to IRHydra reveals the <abbr title="Hydrogen Intermediate Representation">HIR</abbr> instructions of our loops.

<pre data-lang="hydrogen">
B5
i35 Phi [ i31  i56   TaggedNumber]  // var count
i36 Phi [ i32  i61   TaggedNumber]  // var i
##  for (var i = 0; i < 1e8; i++) count += 1
##                  --^----
i44 CompareNumericAndBranch LT i36 i43 goto (B6, B8) Tagged

B6
v47 Goto B7 Tagged

B7
##  for (var i = 0; i < 1e8; i++) count += 1
##                                -------^--
i56 Add i35 i55 ! TaggedNumber
##  for (var i = 0; i < 1e8; i++) count += 1
##                           ^--
i61 Add i36 i60 TaggedNumber
v64 Goto B5 Tagged
</pre>

<pre data-lang="hydrogen">
B5
i35 Phi [ i31  i59   TaggedNumber]
i36 Phi [ i32  i44   TaggedNumber]
##  for (var i = -1; ++i < 1e8;) count += 1
##                   --^
i44 Add i36 i43 ! TaggedNumber
##  for (var i = -1; ++i < 1e8;) count += 1
##                   ----^----
i47 CompareNumericAndBranch LT i44 i46 goto (B6, B8) Tagged

B6
v50 Goto B7 Tagged

B7
##  for (var i = -1; ++i < 1e8;) count += 1
##                               -------^--
i59 Add i35 i58 ! TaggedNumber
v63 Goto B5 Tagged
</pre>

## Resources

1. Paul Irish's [screenshot](http://www.paulirish.com/i/d9f0.png) ([mirror](/assets/images/weird_loop.png))
1. [Doubt Everything](http://www.youtube.com/watch?v=65-RbBwZQdU) ([slides](http://mrale.ph/talks/lxjs2013)) by Vyacheslav Egorov ([@mraleph](https://twitter.com/mraleph))
1. [IRHydra^2](http://mrale.ph/irhydra/2/) by Vyacheslav Egorov (again)
