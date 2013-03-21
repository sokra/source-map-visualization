var cubes, list, math, num, number, opposite, race, square, __slice = [].slice;

number = 42, opposite = !0, opposite && (number = -42), square = function(e) {
    return e * e;
}, list = [ 1, 2, 3, 4, 5 ], math = {
    root: Math.sqrt,
    square: square,
    cube: function(e) {
        return e * square(e);
    }
}, race = function() {
    var e, t;
    return t = arguments[0], e = arguments.length >= 2 ? __slice.call(arguments, 1) : [], 
    print(t, e);
}, "undefined" != typeof elvis && null !== elvis && alert("I knew it!"), cubes = function() {
    var e, t, r;
    for (r = [], e = 0, t = list.length; t > e; e++) num = list[e], r.push(math.cube(num));
    return r;
}();
/*
//@ sourceMappingURL=example.map
*/