---
title: "Pythonic Distance Conversion"
date: 2017-05-28
draft: false
tags: ["development", "python"]
---

When dealing with distances or lengths, it's a common problem to convert values between all the different units
available out there. Of course, converting itself is a less than complicated simple floating point division or
multiplication, depending on how values and conversion factors are stored internally. However, maintaining conversion
factors all across a project is a tedious task, and Python has some good means at hand to simplify our life.

Before entering into implementation details, let's have a look at some general rules that make life easier when dealing
with distances or lengths (or any other unit of measurement). First, it's a good idea to align on one single reference
unit. All values will be stored in this unit, and all computations are done using this unit. Any other unit will be treated as input/output filter.
Second, it's also a very good idea to use
[SI units](https://en.wikipedia.org/wiki/International_System_of_Units) for that purpose. No, that's not another rant
about why the metric system is superior to the imperial system, but SI units generally have well-defined conversions
to any other unit system. Example: common imperial units such as _inch_, _foot_, _yard_ and _mile_ have a standard
definition based on the SI unit _metre_ (broad hint: use _metre_ as base unit when doing length calculations).

Finally, when dealing with conversion, it would be nice (and very pythonic) to not have the poor guy implementing stuff
on your API call `convert` routines for any operation. Instead, providing result objects offering the result in any
conversion available is a much nicer way of implementing API-transparent conversion.

A basic class representing a distance could look like this:

```python
class Distance(object):

    def __init__(self, value=0.0):
        self._distance = float(value)

    @property
    def raw(self):
        return self._distance

    @raw.setter
    def raw(self, value):
        self._distance = float(value)
```

All very fine, but right now, this class is not yet an improvement: its objects cannot be used in arithmetic
expressions, and there's no conversion between units either. On top of that, its representation in a shell is as
speaking as `<Distance object at 0x108479f60>`. Not very impressive, I know --- but let's fix those issues one by one.

First, we want a decent representation making it easier to play with the class in an interactive Python interpreter.
That can be achieved by adding a
[`__repr__` method](https://docs.python.org/3/reference/datamodel.html#object.__repr__).
In our case this can be as simple as this:

```python
def __repr__(self):
    return str(self._distance)
```

The next fundamental problem we want to fix: trying to cast a `Distance` object into a numeric data type will raise
a [TypeError](https://docs.python.org/3/library/exceptions.html#TypeError) exception. This can be easily fixed by adding
[cast methods](https://docs.python.org/3/reference/datamodel.html#object.__int__) to our class:

```python
def __float__(self):
    return self._distance

def __int__(self):
    return int(self._distance)
```

Now we know we can cast a `Distance` object into a float value, we can tackle the problem of arithmetic expressions.
To avoid too much lengthy code right here, I will just demonstrate this for the addition. Python allows us to implement
arithmetic operations in way that allow even mixing `Distance` objects with other numeric objects (i. e. integers or
floating point numbers) or any other object as long as it can be cast into a floating point number:

```python
def __add__(self, other):
    return Distance(self._dist + float(other))

def __radd__(self, other):
    return Distance(self._dist + float(other))
```

Implementing both methods,
[`__add__`](https://docs.python.org/3/reference/datamodel.html#object.__add__) and
[`__radd__`](https://docs.python.org/3/reference/datamodel.html#object.__radd__) is necessary to ensure
addition works also with non-`Distance` operands being put in the first place. This
[post on StackOverflow](https://stackoverflow.com/questions/24431288/understanding-arithmetic-operators-in-python#24431474) by
[Martijn Pieters](https://stackoverflow.com/users/100297/martijn-pieters) offers a good explanation of
the How and Why.

Implementing rich comparison operators (`<`, `>`, `==`, `<=`, `>=`, `!=`) works along the same lines, just that there are no explicit
reflected implementations (instead, the opposite operator is used as reflected implementation, e. g. `<` is the reflected
operator to `>=`, and `==` pairs with `!=`). I will not waste time and space here to replicate what's already written in the
[Python documentation](https://docs.python.org/3/reference/datamodel.html#object.__lt__) on that subject.

Wait, so far we managed to produce a class that more or less does the same as any trivial float? Indeed, you're right
about that, but there was a requirement about converting distances into different units, wasn't it? That would really
set our class apart from what a standard float value could do.

Now, the first thing any programmer would consider is adding properties to the class, managing the conversion of units.
Example:

```python
@property
def in_yards(self):
    return self._distance / 0.9144

@in_yards.setter
def in_yards(self, value):
    self._distance = float(value) * 0.9144
```

This way, `in_yards` becomes a writeable property that automatically converts back and forth, so the internal
representation remains in metres. Pretty cool, eh? But to my reckoning, this is ugly to maintain:

* You need a getter and setter method for each conversion you want to offer, which bloats your code
* Having numeric constants scattered all across the code is a no-no as well
* This approach hurts the DRY paradigm ("don't repeat yourself")

From a code maintenance and transparency point of view, it would be much better to centrally maintain a list of
units and their conversion rules, and have our `Distance` class learn them dynamically. Fostering a modular design,
we keep the list of units and the conversion itself well out of our `Distance` class (so you could use them in
any other class as well).

*The following code goes _outside_ of the `Distance` class definition!*

```python
import math

factors = {
    'mm': 0.001,
    'cm': 0.01,
    'in': 0.0254,
    'dm': 0.1,
    'ft': 0.3048,
    'yd': 0.9144,
    'm':  1.0,
    'km': 1000.0,
    'mi': 1609.344,
    'nm': 1852.0,
    'gm': 1855.3248,
    'ls': 299792458.0,
    'au': 149597870700.0,
    'ly': 9460730472580800.0,
    'pc': (648000.0 / math.pi) * 149597870700.0,
}

available = set(factors.keys())

def convert(value, from_unit, to_unit):
    assert {from_unit, to_unit} <= available
    return value * factors[from_unit] / factors[to_unit]
```

Yes, that's the way the [IAU](https://en.wikipedia.org/wiki/International_Astronomical_Union) defines one
[parsec](https://en.wikipedia.org/wiki/Parsec)...

I put all that in a separate module, hence I set the `available` reference for convenience when using the module
from outside. I consciously chose a set over tuple or list, as it permits checking for subsets (i. e. it is possible
to test multiple units in one statement, as demonstrated in the `convert` implementation).

Now coming back to the `Distance` class. As already shown before, properties would make a nice way to have conversion
implemented. This would allow to get and set the distance value in any unit, probably looking like this:

```python
>>> d = Distance(100)
>>> d.in_ft
328.0839895013123
>>> d.in_yd = 200
>>> d
182.88
```

To spare us the pain of maintaining a gazillion property getter and setter methods for this purpose, we can abuse the
fact that in Python it's quite easy to hack around the implementation of new-style classes. Thus, we just have to
implement a custom method adding properties to the class at runtime:

```python
def __set(self, value, unit):
    self._distance = convert(value, unit, 'm')

def __add_property(self, name, value, doc=None):
    setattr(
        self.__class__, 'in_' + name, property(
            fget=lambda self: convert(self._distance, 'm', name),
            fset=lambda self, value: self.__set(value, name),
            doc=doc
        )
    )
```

Since assignments are not allowed in `lambda` statements, I use an auxiliary `__set()` method which does the
conversion and assigns the result to the internal instance variable representing the distance value.

Finally, `__init__` needs to actually create all the properties. This can be done in a simple loop:

```python
_distance = 0.0

def __init__(self, value=0.0, unit='m'):
    self.__set(value, unit)
    for i in available:
        self.__add_property(i, convert(value, unit, i))
```

Since `__init__` does no longer explicitly define `_distance`, it's good style to set `_distance` as
instance variable already at class level. Otherwise you will get warnings from different lint tools.

That's it already --- with those elements, a `Distance` class fulfils all our requirements set at the beginning:

* its instances behave (almost) like regular numeric data types (float, int)
* an instance's value can be easily retrieved in any unit conversion
* conversions are easy to maintain (Python dictionary)

The full implementation with all the bells and whistles is available as
[GitHub Gist](https://gist.github.com/daemotron/aa100f65c6db0ed5c7064a6954ceaa28) (note how most of the code is actually
dedicated to giving the class a predictable "numeric" behaviour).
