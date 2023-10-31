---
title: "Elegant Python Exceptions"
date: 2023-10-31
draft: false
tags: ["development", "python"]
categories: ["python"]
---

Particularly when creating library packages in [Python](https://www.python.org/), raising exceptions is a great way to let the downstream developer know about problems occuring while executing code from within the library. Python's [built-in exceptions](https://docs.python.org/3/library/exceptions.html) cover a whole host of cases. However, some problems might be library-specific and deserve a custom exception.

#### Custom Exceptions

Creating a [custom exception](https://docs.python.org/3/tutorial/errors.html#user-defined-exceptions) in Python isn't particularly hard when observing a few rules:

* Custom exceptions shall be derived from Python's [Exception](https://docs.python.org/3/library/exceptions.html#Exception) class
* By convention, exception names shall end with "Error" 

```python
class MyLibError(Exception):
    pass
```

In many library packages, you will find exceptions similar to the one shown in the code example above. There's nothing wrong with that; if chosen wisely, the exception name by itself will already tell what went wrong. However, the more details an exception provides about the circumstances it was raised in, the easier to diagnose and debug the problem, and the more appropriate the reaction to an exception.

#### Tell Me Why

In my projects, I like to pass messages to an exception raised, adding some descriptive information, maybe even disclose the offending element. Let's illustrate this with an example:

```python
class ValueOutOfScopeError(Exception):

    def __init__(self, message: str)
        this.message = message
    
    def __repr__(self):
        return this.message
    
    def __str__(self):
        return this.message


def do_something(value: int):
    """Do something with a value between 5 and 10"""
    if (value < 5) or (value > 10):
        raise ValueOutOfScopeError("{} is not between 5 and 10".format(value))
```

As you can see, the exception clearly tells what's wrong --- it indicates the offending value, and also states what your code would have expected instead. Now, we could improve the example by defining a default message for our custom exception --- there might be situations where typing a lengthy message does just not add value, and a brief default would do. However, doing this within the code structure shown above would create quite bloaty code.

#### Keeping Things Lean

In bigger projects with more than just a few custom exceptions, I therefore use my own Exception base class. Since it's good practice to document custom exceptions (or any custom class or function) with [Python Documentation Strings](https://docs.python.org/3/tutorial/controlflow.html#documentation-strings), I use these documentation strings to define a default message:

```python
from typing import Optional

class MyLibBaseException(Exception):

    def __init__(self, message: Optional[str] = None):
        super().__init__()
        if (message is None) or (message == ""):
            self.message = self.__doc__
        else:
            self.message = str(message)
    
    def __str__(self):
        return self.message
    
    def __repr__(self):
        return self.message


class MyLibValueOutOfScopeError(MyLibBaseException):
    """MyLib Error: value is outside of the expected scope"""


class MyLibValueTooBigError(MyLibValueOutOfScopeError):
    """MyLib Error: value is bigger than expected"""


class MyLibValueTooLowError(MyLibValueOutOfScopeError):
    """MyLibError: value is lower than expected"""
```

#### With Extra Cheese, Please

With this custom base exception in place, defining additional custom exceptions with a default message is simple, elegant, and easy to read --- just create an additional class with a documentation string. The base exception class takes care of the rest. As shown in the example below, these custom exceptions can be raised in various ways:

```python
import sys


def do_something(value: int):
    if value < 0:
        raise MyLibValueTooLowError
    elif value > 10:
        raise MyLibValueTooBigError("Too big!")
    
    daList = [1, 2, 3, 4, 5]
    try:
        print(daList[value])
    except IndexError as e:
        raise MyLibValueOutOfScopeError(e)


if __name__ == '__main__':
    try:
        do_something(int(sys.argv[1]))
    except MyLibValueOutOfScopeError as e:
        print(e)
```

Disclaimer: yes, this example is cheesy. But it nicely illustrates the three main use cases with our custom exception:

* raise them without arguments --- will produce the default error message
* raise them with a custom message --- will produce the custom error message
* raise them from another exception --- will pass on the originating exception's message

#### Final Thoughts

Custom exceptions are a must-have in nearly any bigger Python project. In my opinion, combining documentation strings and error messages is an elegant approach to communicating failure verbosely, without unnecessarily bloating my code. Is this the most pythonic way to deal with custom exceptions? Honestly, I don't know. For me it's pythonic enough, whatever this means. It works, and it doesn't feel wrong to do it this way.
