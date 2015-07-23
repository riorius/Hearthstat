
var resetCode = 'final?';

var console = document.getElementsByClassName('console')[0];

function Print(str) {
  console.innerHTML += '<div class="println">' + str + "</div>\n";
}

function ClearConsole() {
  while (console.firstChild) {
    console.removeChild(console.firstChild);
  }
}

function RandFromList(list, count) {
  if (!count)
    return list[Math.floor(Math.random() * list.length)];

  if (count == -1)
    count = list.length;

  var ret = [];
  var left = list.slice(0);

  if (count > left.length) { return left; }
  for (var i = 0; i < count; ++i) {
    var iSelected = Math.floor(Math.random() * left.length);
    ret.push(left[iSelected]);
    left.splice(iSelected, 1);
  }

  return ret;
}

function RandInRange(min, max) {
  var d = Math.random() * (max - min);
  return Math.floor(min + d);
}

function RandWithProb(prob) {
  return Math.random() < prob;
}

function map(list, fun) {
  var ret = [];
  for (var i = 0; i < list.length; ++i) {
    ret.push(fun(list[i]));
  }
  return ret;
}

function AddAll(bucket, toAdd) {
  for (var i = 0; i < toAdd.length; ++i) {
    bucket.push(toAdd[i]);
  }
}

function ConcatLists(lists) {
  var ret = [];
  for (var i = 0; i < lists.length; ++i) {
    AddAll(ret, lists[i]);
  }
  return ret;
}

function assert(condition) {
  if (!condition) {
    debugger;
  }
}

var g_fReset = false;

function LoadVal(key) { return window.localStorage.getItem(key); };
function SaveVal(key, val) { return window.localStorage.setItem(key, val); };

if (LoadVal('resetCode') != resetCode) {
  g_fReset = true;
  SaveVal('resetCode', resetCode);
}

var mazeParams = {
  level: 0,
  tier: 0
};

Print("Util finished.");
if (g_fReset) {
  Print("Reset");
} else {
  Print("No reset");
}
