"use strict";

var _obj;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _templateObject = _taggedTemplateLiteral(["In ES5 this is\n not legal."], ["In ES5 this is\n not legal."]),
    _templateObject2 = _taggedTemplateLiteral(["In ES5 \"\n\" is a line-feed."], ["In ES5 \"\\n\" is a line-feed."]),
    _templateObject3 = _taggedTemplateLiteral(["http://foo.org/bar?a=", "&b=", "\n    Content-Type: application/json\n    X-Credentials: ", "\n    { \"foo\": ", ",\n      \"bar\": ", "}"], ["http://foo.org/bar?a=", "&b=", "\n    Content-Type: application/json\n    X-Credentials: ", "\n    { \"foo\": ", ",\n      \"bar\": ", "}"]);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// Expression bodies
var odds = evens.map(function (v) {
  return v + 1;
});
var nums = evens.map(function (v, i) {
  return v + i;
});

// Statement bodies
nums.forEach(function (v) {
  if (v % 5 === 0) fives.push(v);
});

// Lexical this
var bob = {
  _name: "Bob",
  _friends: [],
  printFriends: function printFriends() {
    var _this = this;

    this._friends.forEach(function (f) {
      return console.log(_this._name + " knows " + f);
    });
  }
};

var SkinnedMesh = function (_THREE$Mesh) {
  _inherits(SkinnedMesh, _THREE$Mesh);

  function SkinnedMesh(geometry, materials) {
    _classCallCheck(this, SkinnedMesh);

    var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(SkinnedMesh).call(this, geometry, materials));

    _this2.idMatrix = SkinnedMesh.defaultMatrix();
    _this2.bones = [];
    _this2.boneMatrices = [];
    //...
    return _this2;
  }

  _createClass(SkinnedMesh, [{
    key: "update",
    value: function update(camera) {
      //...
      _get(Object.getPrototypeOf(SkinnedMesh.prototype), "update", this).call(this);
    }
  }], [{
    key: "defaultMatrix",
    value: function defaultMatrix() {
      return new THREE.Matrix4();
    }
  }]);

  return SkinnedMesh;
}(THREE.Mesh);

var obj = _obj = _defineProperty({
  // __proto__
  __proto__: theProtoObj,
  // Does not set internal prototype
  '__proto__': somethingElse,
  // Shorthand for ‘handler: handler’
  handler: handler,
  // Methods
  toString: function toString() {
    // Super calls
    return "d " + _get(Object.getPrototypeOf(_obj), "toString", this).call(this);
  }
}, "prop_" + function () {
  return 42;
}(), 42);

// Basic literal string creation
"This is a pretty little template string."

// Multiline strings
(_templateObject);

// Interpolate variable bindings
var name = "Bob",
    time = "today";
"Hello " + name + ", how are you " + time + "?";

// Unescaped template strings
String.raw(_templateObject2);

// Construct an HTTP request prefix is used to interpret the replacements and construction
GET(_templateObject3, a, b, credentials, foo, bar)(myOnReadyStateChangeHandler);

// list matching
var _ref = [1, 2, 3];
var a = _ref[0];
var b = _ref[2];

a === 1;
b === 3;

// object matching

var _getASTNode = getASTNode();

var a = _getASTNode.op;
var b = _getASTNode.lhs.op;
var c = _getASTNode.rhs;

// object matching shorthand
// binds `op`, `lhs` and `rhs` in scope

var _getASTNode2 = getASTNode();

var op = _getASTNode2.op;
var lhs = _getASTNode2.lhs;
var rhs = _getASTNode2.rhs;

// Can be used in parameter position

function g(_ref2) {
  var x = _ref2.name;

  console.log(x);
}
g({ name: 5 });

// Fail-soft destructuring
var _ref3 = [];
var a = _ref3[0];

a === undefined;

// Fail-soft destructuring with defaults
var _ref4 = [];
var _ref4$ = _ref4[0];
var a = _ref4$ === undefined ? 1 : _ref4$;

a === 1;

// Destructuring + defaults arguments
function r(_ref5) {
  var x = _ref5.x;
  var y = _ref5.y;
  var _ref5$w = _ref5.w;
  var w = _ref5$w === undefined ? 10 : _ref5$w;
  var _ref5$h = _ref5.h;
  var h = _ref5$h === undefined ? 10 : _ref5$h;

  return x + y + w + h;
}
r({ x: 1, y: 2 }) === 23;

function f(x) {
  var y = arguments.length <= 1 || arguments[1] === undefined ? 12 : arguments[1];

  // y is 12 if not passed (or passed as undefined)
  return x + y;
}
f(3) == 15;
function f(x) {
  // y is an Array
  return x * (arguments.length - 1);
}
f(3, "hello", true) == 6;
function f(x, y, z) {
  return x + y + z;
}
// Pass each elem of array as argument
f.apply(undefined, [1, 2, 3]) == 6;

function f() {
  {
    var x = undefined;
    {
      // okay, block scoped name
      var _x2 = "sneaky";
    }
    // okay, declared with `let`
    x = "bar";
  }
}

function factorial(n) {
  "use strict";

  var acc = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];
  if (n <= 1) return acc;
  return factorial(n - 1, n * acc);
}

// Stack overflow in most implementations today,
// but safe on arbitrary inputs in ES2015
factorial(100000);

//# sourceMappingURL=example.js.map