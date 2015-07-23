
Print("s0");
/*


*/

try {

Print("s1");

var classes = [
  { name: 'Shaman', children: ['Midrange Shaman', 'Mech Shaman']},
  { name: 'Mage', children: ['Echo Mage', 'Mech Mage', 'Tempo Mage', 'Freeze Mage']},
  { name: 'Paladin', children: ['Aggro Paladin', 'Midrange Paladin']},
  { name: 'Priest', children: ['Control Priest']},
  { name: 'Hunter', children: ['Face Hunter', 'Midrange Hunter']},
  { name: 'Druid', children: ['Midrange/Fast Druid', 'Ramp Druid']},
  { name: 'Warlock', children: ['Malygos', 'Midrange Demonzoo', 'Handlock']},
  { name: 'Rogue', children: ['Oil Rogue']},
  { name: 'Warrior', children: ['Control Warrior', 'Patron Warrior']}
];

var activeDecks = [
  'Control Priest', 'Echo Mage', 'Reincarnate Shaman', 'Tempo Priest'
];

var textInput = { foo: 'textInput'};
var perDeckEvents;

var viewStatsMain = {
  Render: function() {
    perDeckEvents = [];
    for (var i = 0; i < activeDecks.length; ++i) {
      perDeckEvents.push({wins: 0, losses: 0, allEvents: []});
    }

    var activeDeckIndex = 0;
    for (var i = 0; i < allEvents.length; ++i) {
      var evcur = allEvents[i].currentEvent;
      if (evcur.indexOf('Switch Deck') != -1) {
        for (var j = 0; j < activeDecks.length; ++j) {
          if (evcur.indexOf(activeDecks[j]) != -1) {
            activeDeckIndex = j;
          }
        }
        continue;
      }
      
      perDeckEvents[activeDeckIndex].allEvents.push(evcur);
      if (evcur.indexOf('Win') != -1) {
        perDeckEvents[activeDeckIndex].wins++;
      }
      else if (evcur.indexOf('Lose') != -1) {
        perDeckEvents[activeDeckIndex].losses++;
      }
    }

    var textList = [];
    for (var i = 0; i < perDeckEvents.length; ++i) {
      var text = activeDecks[i];
      var pctg = 0;
      var total = perDeckEvents[i].wins + perDeckEvents[i].losses;
      if (total != 0) {
        pctg = Math.round(perDeckEvents[i].wins / total * 100);
      }
      text += ': ' + pctg;
      text += '<br>' + perDeckEvents[i].wins + ' / ' + total;
      textList.push(text);
    }

    var buttons = RenderList(textList);
    for (var i = 0; i < buttons.length; ++i) {
      buttons[i].onclick = RenderState.bind(null, root);
    }
  }
};

Print("s2");

var root = [
  { name: 'Win', children: classes},
  { name: 'Lose', children: classes},
  { name: 'Switch Deck', children: activeDecks},
  { name: 'Make Note', children: textInput},
  { name: 'View Stats', children: viewStatsMain}
];

classes.fixed = true;
root.fixed = true;

var current = root;
var allEvents = [];

Print("s3");

if (!g_fReset) {
  var obj = SaveState.ParseList(LoadVal('allEvents'));
  allEvents = obj.data;
}
var currentEvent = "";

Print("s4");

function SaveAndRestart() {
  allEvents.push({time: new Date().getTime(), currentEvent});
  currentEvent = "";
  SaveVal('allEvents', SaveState.PrintValue(allEvents));
  RenderState(root);
}

function GetChildren(val) {
  if (val instanceof Array) {
    return val;
  }

  if (val instanceof Object) {
    return val.children;
  }

  return undefined;
}

Print("s5");

function GetText(val) {
  if (val instanceof Array) {
    return undefined;
  }

  if (val instanceof Object) {
    return val.name;
  }

  return val;
}

function RenderState(node) {
  ClearAllElements();

  var eventText = GetText(node);
  if (eventText) {
    currentEvent += "~" + GetText(node);
  }

  var list = GetChildren(node);

  if (!list) {
    SaveAndRestart();
    return;
  }

  if (list == textInput) {
    // Not yet implemented
    SaveAndRestart();
    return;
  }

  if (list.Render) {
    viewStatsMain.Render();
    return;
  }

  var buttons = RenderList(list);
  for (var i = 0; i < buttons.length; ++i) {
    buttons[i].onclick = RenderState.bind(null, list[i]);
  }
}

Print("s6");

function RenderList(list) {
  var ret = [];
  var rMax, cMax;
  var numButtons = list.length;
  if (numButtons <= 4) {
    rMax = 2;
    cMax = 2;
  } else if (numButtons <= 6) {
    rMax = 3;
    cMax = 2;
  } else if (numButtons <= 9) {
    rMax = 3;
    cMax = 3;
  } else {
    assert(false);
    rMax = 3;
    cMax = 3;
  }

  var r = 0;
  var c = 0;
  for (var i = 0; i < list.length; ++i) {
    var text = GetText(list[i]);
    var button = CreateGridElement(r, c, rMax, cMax, text);
    ++c;
    if (c >= cMax) {
      ++r;
      c = 0;
    }
    ret.push(button);
  }
  return ret;
}

Print("s7");

RenderState(current);

Print("script.js finished")

} catch (err) {
  debugger;
}