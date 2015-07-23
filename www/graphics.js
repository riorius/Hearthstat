
var phoneScreen = document.getElementsByClassName('phoneScreen')[0];

var noParent = {};
var clickHandler = {
  Execute: function() { 
    this.onclick(); 
  },
  Setup: function(el) { 
    el.onclick = this.Execute.bind(this); 
  },
  __nosave: true
}

function CreateGridElement(r, c, rMax, cMax, text) {
  var margin = {left: 5, right: 5, top: 5, bottom: 5};
  if (r == 0) {
    margin.top = 10;
  }
  if (c == 0) {
    margin.left = 10;
  }
  if (r == rMax - 1) {
    margin.bottom = 10;
  }
  if (c == cMax - 1) {
    margin.right = 10;
  }
  return CreateElement([text], c / cMax, r / rMax, 1 / cMax, 1 / rMax, ['bluebackground'], margin);
}

function CreateElement(lines, x, y, width, height, classes, margin, parent) {
  if (!(lines instanceof Array)) {
    args = lines;
    lines = args.lines;
    x = args.x;
    y = args.y;
    width = args.width;
    height = args.height;
    classes = args.classes;
    margin = args.margin;
    parent = args.parent;
  }

  //x += margin;
  //y += margin;
  //width -= 2 * margin;
  //height -= 2 * margin;
  margin = margin || {}; //{left: 0, right: 0, top: 0, bottom: 0};
  margin.left = margin.left || 0;
  margin.right = margin.right || 0;
  margin.top = margin.top || 0;
  margin.bottom = margin.bottom || 0;
  parent = parent || phoneScreen;

  if (!parent.clientHeight) {
    parent.clientHeight = phoneScreen.clientHeight;
    parent.clientWidth = phoneScreen.clientWidth;
  }
  var el = document.createElement('div');
  if (classes) {
    for (var i = 0; i < classes.length; ++i) {
      el.classList.add(classes[i]);
    }  
  } 
  el.style.position = 'absolute';
  el.style.display = 'table';
  el.style.textAlign = 'center';
  var xCenter = x * parent.clientWidth;
  var yCenter = y * parent.clientHeight;
  if (width && height) {
    var widthPx = width * parent.clientWidth;
    var heightPx = height * parent.clientHeight;
    el.style.width = widthPx - margin.left - margin.right;
    el.style.height = heightPx - margin.top - margin.bottom;  
  }
  
  el.style.left = x * parent.clientWidth + margin.left; //xCenter - widthPx * 0.5;
  el.style.top = y * parent.clientHeight + margin.top; //yCenter - heightPx * 0.5;

  var textContainer = document.createElement('div');
  textContainer.style.display = 'table-cell';
  textContainer.style.verticalAlign = 'middle';

  for (var i = 0; i < lines.length; ++i) {
    var textEl = document.createElement('div');
    textEl.innerHTML = lines[i];
    textContainer.appendChild(textEl);
  }

  el.appendChild(textContainer);

  if (parent != noParent)
  {
    parent.appendChild(el);
  }
  return el;
}

function CreateImageElement(imgSource, x, y, width, height, parent) {
  var el = document.createElement('div');
  var imageEl = document.createElement('img');
  imageEl.setAttribute('src', imgSource);
  //imageEl.innerHTML = imgSource;
  el.style.position = 'absolute';
  el.style.display = 'table';

  var widthPx = width * phoneScreen.clientWidth;
  var heightPx = height * phoneScreen.clientHeight;
  imageEl.style.width = widthPx;// - margin.left - margin.right;
  imageEl.style.height = heightPx;// - margin.top - margin.bottom;  

  el.style.left = x * phoneScreen.clientWidth;// + margin.left; //xCenter - widthPx * 0.5;
  el.style.top = y * phoneScreen.clientHeight;// + margin.top; //yCenter - heightPx * 0.5;

  el.appendChild(imageEl);

  parent = parent || phoneScreen;
  if (parent != noParent) {
    parent.appendChild(el);
  }
  return el;
}

function AppendToElement(lines, el) {
  var textContainer = el.getElementsByTagName('div')[0];
  for (var i = 0; i < lines.length; ++i) {
    var textEl = document.createElement('div');
    textEl.innerHTML = lines[i];
    textContainer.appendChild(textEl);
  }  
}

function HighlightEl(el) {
  el.classList.remove('redbackground');
  el.classList.remove('bluebackground');
  el.classList.add('greenbackground');

}

var animations = [];
var inputBlocker = document.getElementsByClassName('inputBlocker')[0];

function OnAnimationsSkipped() {
  assert(false);
  var listeners = [];
  for (var i = 0; i < animations.length; ++i) {
    var anim = animations[i];
    anim.obj.el.classList.remove(anim.name);
    if (anim.listener) {
      listeners.push(anim.listener);
    }
  }
  animations = [];
  inputBlocker.classList.remove('inputBlockerActive');
  for (var i = 0; i < listeners.length; ++i) {
    listeners[i].handleEvent();
  }
}

var allAnimsFinishedCallbacks = [];

function OnAllAnimsFinished() {
  inputBlocker.classList.remove('inputBlockerActive');
  for (var i = 0; i < allAnimsFinishedCallbacks.length; ++i) {
    allAnimsFinishedCallbacks[i]();
  }
  allAnimsFinishedCallbacks = [];
}

function WaitForAnimations(callback) {
  if (animations.length == 0) {
    callback();
  }
  allAnimsFinishedCallbacks.push(callback);
}

//inputBlocker.onclick = OnAnimationsSkipped;

var animListener = {
  handleEvent: function(event) {
    if (this.anim.obj.el != event.target) { return; }
    this.anim.obj.el.removeEventListener("webkitAnimationEnd", this, false);
    this.anim.obj.el.classList.remove(this.anim.name);
    this.AfterDelay();
    //setTimeout(this.AfterDelay.bind(this), 0);
  },

  AfterDelay: function() {
    if (this.anim.callback) {
      this.anim.callback.execute();
    }
    this.anim.state = 'finished';
    var found = false;
    for (var i = 0; i < animations.length; ++i) {
      if (animations[i] == this.anim) {
        animations.splice(i, 1);
        --i;
        assert(!found);
        found = true;

        if (animations.length == 0) {
          OnAllAnimsFinished();
        }
      }
    }
  }
}

function CreateAnim(objOrEl, name, callbackFn) {
  var callback = Object.create(animCallback);
  callback.fns = [callbackFn];
  if (objOrEl instanceof Element) {
    objOrEl = {el: objOrEl};
  }
  return {obj: objOrEl, name: name, callback: callback, state: 'created', __nosave: true};
}

function StartAnimation(el, name, callbackFn) {
  var anim = CreateAnim(el, name, callbackFn); 

  StartAnimInternal(anim);

  animations.push(anim);
  return anim;
}

function StartAnimInternal(anim) {
  if (!inputBlocker.classList.contains('inputBlockerActive')) {
    inputBlocker.classList.add('inputBlockerActive');
  }

  anim.obj.el.classList.add(anim.name);
  anim.listener = Object.create(animListener);
  anim.listener.anim = anim;
  anim.obj.el.addEventListener("webkitAnimationEnd", anim.listener, false);
  anim.state = 'running';
}

var animCallback = {
  fns: [],
  execute: function() {
    for (var i = 0; i < this.fns.length; ++i) {
      if (this.fns[i]) {
        this.fns[i]();
      }
    }
  }
}

function QueueAnimation(animParent, el, name, callbackFn) {
  if (!animParent || animParent.state == 'finished') { return StartAnimation(el, name, callbackFn); }

  var anim = CreateAnim(el, name, callbackFn);
  var start = StartAnimInternal.bind(null, anim);
  animParent.callback.fns.push(start);
  return anim;
}

var attackAnim = undefined;
function AnimateAttackRec(atkrec) {
  if (atkrec.attacker.el) {
    attackAnim = QueueTransitionAnimation(attackAnim, atkrec.attacker, 'pulseIn', 'pulseOut');
  }
  var targets = atkrec.target;
  if (!(targets instanceof Array)) {
    targets = [targets];
  }
  var attackAnimPrev = attackAnim;
  for (var i = 0; i < targets.length; ++i) {
    attackAnim = QueueTransitionAnimation(attackAnimPrev, targets[i], 'pulseIn', 'pulseOut');
  }
}

function QueueTransitionAnimation(animParent, obj, animIn, animOut) {
  if (!animParent || animParent.state == 'finished') { return StartTransitionAnimation(obj, animIn, animOut); }
  var anim = CreateAnim(obj, animIn);
  anim.nameNext = animOut;
  anim.nextEl = CreateObjectEl(obj);
  anim.effect = obj.nextEffect;
  obj.nextEffect = null;
  //var start = StartTransitionAnimInternal.bind(null, anim);
  anim.start = function() {
    if (anim.obj.transitionAnim) {
      anim.obj.transitionAnim.callback.fns.push(anim.start);
    } else {
      setTimeout(StartTransitionAnimInternal.bind(null, anim), 1);
    }
  }
  animParent.callback.fns.push(anim.start);

  return anim;
}

function StartTransitionAnimation(obj, animIn, animOut) {
  var anim = CreateAnim(obj, animIn);
  anim.nameNext = animOut;
  anim.nextEl = CreateObjectEl(obj);
  StartTransitionAnimInternal(anim);
  return anim;
}

function StartTransitionAnimInternal(anim) { //obj, animIn, animOut) {
  var callback = Object.create(animCallback);
  var obj = anim.obj;
  assert(!obj.transitionAnim);
  obj.transitionAnim = anim; //{obj: obj, name: animIn, callback: callback, state: 'running', __nosave: true};
  obj.transitionAnim.state = 'running';
  var inAnim = StartAnimation(obj.el, anim.name, function() {
    assert(anim.nextEl);
    phoneScreen.removeChild(obj.el);

    if (anim.effect) {
      RenderEffectImpl(obj, anim.effect);
    }
    if (obj.effectEl) {
      //obj.el.removeChild(obj.effectEl);
      anim.nextEl.appendChild(obj.effectEl);
    }
    obj.el = anim.nextEl;
    phoneScreen.appendChild(obj.el);
    var outAnim = StartAnimation(obj.el, anim.nameNext, function() {
      obj.transitionAnim.state = 'finished';
      var callback = obj.transitionAnim.callback;
      obj.transitionAnim = null;
      callback.execute();
    });
  });

  return obj.transitionAnim;
}

var lEffectParents = [];

var noEffects = false;
function RenderEffect(parent, effect) {
  if (parent instanceof Element) {
    RenderEffectImpl({el: parent}, effect);
    return;
  }
  if (!parent.nextEffect) {
    parent.nextEffect = {lines: []};
  }
  AddAll(parent.nextEffect.lines, effect.lines);
}

var popUpEffectEls = false;
function RenderEffectImpl(parent, effect) {
  if (noEffects) { return; }
  if (!parent.effectEl) {
    parent.effectEl = CreateElement({
      lines: [],
      x: 0.1,
      y: 0.1,
      classes: ['magentabackground', 'effect'],
      parent: parent.el});
    if (!parent.effectElEntered && popUpEffectEls) {
      parent.effectEl.classList.add('popUp');
      parent.effectElEntered = true;
    }
    lEffectParents.push(parent);
  }
  AppendToElement(effect.lines, parent.effectEl);
}

function ClearEffects() {
  while (lEffectParents.length) {
    try {
      var effectParent = lEffectParents[0];
      effectParent.el.removeChild(effectParent.effectEl);
      effectParent.effectElEntered = false;
      delete effectParent.effectEl;
      lEffectParents.splice(0, 1);
    } catch (err) {
      debugger;
    }    
  }
}

function ClearAllElements() {
  var protectedEls = [];
  while (phoneScreen.firstChild) {
    if (phoneScreen.firstChild.clearProtection) {
      protectedEls.push(phoneScreen.firstChild);
    }
    phoneScreen.removeChild(phoneScreen.firstChild);
  }

  for (var i = 0; i < protectedEls.length; ++i) {
    phoneScreen.appendChild(protectedEls[i]);
    protectedEls[i].clearProtection -= 1;
  }
}

function SetupForPhone() {
  //if (window.device) {
    phoneScreen.classList.remove('pcVersion');
    console.remove();
  //}
}

//var margin = {left: 5, top}

function EventTest(event, arg, foo) {
  Print("Event test!");
  debugger;
}

function GraphicsTest() {
  var el = CreateElement("New element!", 0, 0.5, 0.5, 0.25, ['bluebackground'], {left: 5, top: 5, bottom: 2.5, right: 2.5});
  el.onclick = EventTest.bind('asdf', 'qwer');
  el = CreateElement("New element!", 0.5, 0.5, 0.5, 0.25, ['redbackground'], {left: 2.5, top: 5, bottom: 2.5, right: 5});//, margin);
  el.onclick = EventTest;
  el = CreateElement("New element!", 0, 0.75, 0.5, 0.25, ['redbackground'], {left: 5, top: 2.5, bottom: 5, right: 2.5});//, margin);
  el.onclick = EventTest;
  el = CreateElement("New element!", 0.5, 0.75, 0.5, 0.25, ['bluebackground'], {left: 2.5, top: 2.5, bottom: 5, right: 5});//, margin);
  el.onclick = EventTest;
}

Print("Graphics finished.");