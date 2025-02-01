---
title: "Cache Your Datarefs"
date: 2023-04-20T22:20:48+02:00
draft: false
tags: ["x-plane", "development", "c/c++"]
---

Nearly every X-Plane plugin accesses one or several of X-Plane's [datarefs](https://developer.x-plane.com/datarefs/) at runtime. It's not uncommon to find code like this:

```c
void set_data(float value)
{
    XPLMDataRef dref = XPLMFindDataRef("what/ever/data/ref/we/need");
    XPLMSetDataf(dref, value);
}
```

Admittedly this works. However, there are a couple of reasons why the code above is not the best idea, if you're seeking to write a solid and well-performing plugin:

* The code doesn't check if dref actually points to a dataref before attempting to write to it
* The caller doesn't get notified about success or failure of the operation
* `XPLMFindDataRef` is expensive, and should be used only during plugin initialisation

In fact, also [X-Plane's SDK documentation](https://developer.x-plane.com/sdk/XPLMDataAccess/) emphasizes the third point:

> The task of looking up a data reference is relatively expensive; look up your data references once based on the verbose path strings, and save the opaque data reference value for the duration of your plugin’s operation. Reading and writing data references is relatively fast (the cost is equivalent to two function calls through function pointers).

I tend to organise the code to handle all dataref operations in a dedicated source code file with a fitting header file. In my nomenclature they're called `data.c` and `data.h` in most of my projects.

Some plugins only require to handle very few datarefs; in such a case, we can write pretty explicit code:

```c
#include <math.h>

static XPLMDataRef Dref = NULL;
static int Initialized = 0;

int init_data(void)
{
    Dref = XPLMFindDataRef("what/ever/data/ref/we/need");
    if (Dref == NULL || !XPLMIsDataRefGood(Dref))
    {
        return 0;
    }
    Initialized = 1;
    return 1;
}

int set_data(float value)
{
    if (Initialized && XPLMCanWriteDataRef(Dref))
    {
        XPLMSetDataf(Dref, value);
        return fabs(XPLMGetDataf(Dref) - value) < 0.001;
    }
    return 0;
}
```

This code looks a lot more complicated, but it addresses the shortcomings of our previous example:

* `init_data` is called from `XPluginStart` or `XPluginEnable`, so the expensive `XPLMFindDataRef` is only called once
* `init_data` checks whether the initialisation was successfull, and returns `1` if true, otherwise `0`
* `set_data` uses the cached reference of the dataref, instead of using its own lookup every time it's called
* `set_data` checks whether it's safe to attempt writing to the dataref
* `set_data` checks if the write operation was successful (i.e. the value of the dataref and the submitted parameter are similar)

In case you wonder about the somewhat funky comparison in `set_data`'s return value: this is called an epsilon comparison ([comparing two floats for equality is a bad idea](https://randomascii.wordpress.com/2012/02/25/comparing-floating-point-numbers-2012-edition/)). I admit it's not the most clever implementation, but it will do for our purpose (while an equality comparison could actually trigger a false negative result). Depending the actual purpose and values expected, it might become necessary to implement and [ULP](https://en.wikipedia.org/wiki/Unit_in_the_last_place)-based comparison.

While this approach is pretty effective for a small number of datarefs, it just bloats with an increasing number of datarefs. There are ways to work with these, but that's for another post -- hopefully somewhere soon.
