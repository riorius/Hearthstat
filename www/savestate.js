
Print("Starting SaveState");
SaveState = {
  objects: {},
  constructors: {},
  fidMap: {},
  oidNext: 1,

  LoadObject: function(oid) {
    if (this.objects[oid] == this) {
      // Circular reference: guess we need to smarten this up
      // enough to handle such data structures?
      assert(false);
    }

    if (this.objects[oid]) {
      return this.objects[oid];
    }

    var strval = LoadVal(oid);
    if (!strval) {
      return null;
    }

    // guard against circular data structures
    this.objects[oid] = {};
    this.objects[oid]._loadinprogress = true;

    var parseResult = this.ParseObject(strval, this.objects[oid]);

    assert(parseResult.rest.length == 0);

    //this.objects[oid] = parseResult.data;
    if (parseResult.data == null) {
      this.objects[oid] = null;
      return null;
    }

    this.objects[oid]._oid = oid;
    var oidInt = parseInt(oid);
    if (!isNaN(oidInt)) {
      this.oidNext = Math.max(this.oidNext, parseInt(oid) + 1);
    }

    delete this.objects[oid]._loadinprogress;
    return this.objects[oid];
  },

  ParseObject: function(str, outobj) {
    // Object format:
    // {cid;name=val;name=val;name=val}
    assert(str.charAt(0) == '{');
    var result = {};
    str = str.substring(1);

    var temp = this.ReadStringUntil(str, ';');
    var cid = temp.first;
    str = temp.rest.substring(1);

    var data = outobj || {};
    while(true) { //str.charAt(0) != '}') {
      temp = this.ReadStringUntil(str, ':');
      var name = temp.first;
      str = temp.rest.substring(1);
      var parseResult = this.ParseUnknown(str);
      data[name] = parseResult.data;
      str = parseResult.rest;
      assert(str.charAt(0) == ';' || str.charAt(0) == '}');
      if (str.charAt(0) == '}') {
        break;
      }
      str = str.substring(1);
    }
    str = str.substring(1);

    /*if (!this.constructors[cid]) {
      result.data = null;
    } else {
      result.data = this.constructors[cid](data);
      result.data._cid = cid;   
    }*/
    result.data = data;
    result.rest = str;
    return result;
  },

  ParseList: function(str) {
    // Format: [val,val,val]
    assert(str.charAt(0) == '[');
    var result = {};
    result.data = [];
    str = str.substring(1);

    if (str.charAt(0) == ']') {
      result.rest = str.substring(1);
      return result;
    }

    while (true) {
      var parseResult = this.ParseUnknown(str);
      result.data.push(parseResult.data);
      str = parseResult.rest;
      assert(str.charAt(0) == ',' || str.charAt(0) == ']');
      if (str.charAt(0) == ']') {
        break;
      }
      str = str.substring(1)
    }
    str = str.substring(1);

    result.rest = str;
    return result;
  },

  ParsePrimitive: function(str) {
    var readResult = this.ReadStringUntil(str, ',;]}');
    var result = {};
    result.data = readResult.first;
    if (result.data === 'undefined') {
      result.data = undefined;
    } else if (result.data === 'null') {
      result.data = null;
    } else {
      var asInt = parseInt(result.data);
      if (!isNaN(asInt)) {
        result.data = asInt;
      }
    }
    result.rest = readResult.rest;
    return result;
  },

  ParseOid: function(str) {
    var result = this.ParsePrimitive(str);
    // 5 = '$OID_'.length
    result.data = this.LoadObject(result.data.substring(5));
    return result;
  },

  ParseFid: function(str) {
    var result = this.ParsePrimitive(str);
    var fid = parseInt(result.data.substring(5));
    result.data = this.fidMap[fid];
    return result;
  },

  ParseUnknown: function(str) {
    switch(str.charAt(0)) {
      case '{': assert(false); return this.ParseObject(str);
      case '[': return this.ParseList(str);
      case '$': 
        if (str.substring(0, 5) == "$OID_") { return this.ParseOid(str); }
        return this.ParseFid(str);
      default: return this.ParsePrimitive(str);
    }
  },

  ReadStringUntil: function(str, delimiters) {
    for (var i = 0; i < str.length; ++i) {
      if (delimiters.indexOf(str.charAt(i)) != -1) {
        return {
          first: str.substring(0, i),
          rest: str.substring(i)
        };
      }
    }
  },

  WriteObject: function(obj) {
    this.deepCopyCache = {};
    this.WriteObjectInternal(obj);
  },

  WriteObjectInternal: function(obj) {
    if (!obj._oid) {
      obj._oid = this.oidNext++;
    }
    if (!this.deepCopyCache) {
      this.deepCopyCache = {};
    }
    if (this.deepCopyCache[obj._oid]) { return obj._oid; }
    this.deepCopyCache[obj._oid] = true;

    var output = "{" + (obj._cid || 'CID_UNKNOWN');
    for (var key in obj) {
    //var keys = Object.keys(obj);
    //for (var i = 0; i < keys.length; ++i) {
    //  var key = keys[i];
      var val = obj[key];
      if (val == undefined) { continue; }
      if (val instanceof Element) { continue; }
      if (val.__nosave) { continue; }
      output += ";" + key + ":" + this.PrintValue(val);
    }
    output += "}";
    SaveVal(obj._oid, output);

    return obj._oid;
  },

  PrintValue: function(val) {
    if (val instanceof Array) {
      var output = "[";
      for (var i = 0; i < val.length; ++i) {
        if (i) { output += ","}
        output += this.PrintValue(val[i]);
      }
      output += "]";
      return output;
    } else if (val instanceof Function) {
      assert(val._fid);
      return "$FID_" + val._fid;
    } else if (val instanceof Object) {
      return "$OID_" + this.WriteObjectInternal(val);
    } else {
      return "" + val;
    }
  },
    
  CopyData: function(objFrom, objTo) {
    var keys = Object.keys(objFrom);
    for (var i = 0; i < keys.length; ++i) {
      var key = keys[i];
      var val = objFrom[key];
      if (typeof(objTo[key]) == 'number') {
        objTo[key] = parseInt(val);
      } else {
        objTo[key] = val;
      }
    }
  }
};

Print("SaveState finished");
