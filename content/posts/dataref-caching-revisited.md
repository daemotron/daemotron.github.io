---
title: "Dataref Caching Revisited"
date: 2023-09-27
draft: false
tags: ["x-plane", "development", "c/c++"]
categories: ["x-plane"]
---

Earlier this year I wrote about [caching datarefs](/2023/04/20/cache-your-datarefs/). Back then we only looked at caching single datarefs, which quickly leads to bloated code once applied in a wider context. So here we are again, taking a closer look at caching *many* datarefs efficiently.

#### What About Trees

> "Are we going to leave those poor little Datarefs here in this horrid, dark, dank, tree-infested --- I mean... charming, quite charming, forest?"
>
> --- unknown dwarf coder

A lot of code (real and sample code alike) out there uses trees for caching datarefs, typically [AVL trees](https://en.wikipedia.org/wiki/AVL_tree). The idea behind this approach: searching an AVL tree is much faster than searching a linear data structure (aka list). Let's break this down a bit:

"Searching" means going through the elements of a data structure, and comparing the elements to a search term. When talking about datarefs, we're usually talking about their identifier, which is a string (e. g. `"sim/flightmodel/weight/m_fixed"`). String comparisons happen to be expensive operations --- [X-Plane's SDK documentation](https://developer.x-plane.com/sdk/XPLMDataAccess/) explicitly warns about this:

> The task of looking up a data reference is relatively expensive; look up your data references once based on the verbose path strings, and save the opaque data reference value for the duration of your plugin’s operation. Reading and writing data references is relatively fast (the cost is equivalent to two function calls through function pointers).

So what do we gain by caching our datarefs in a structure which forces the same, expensive lookup comparison on us? Exactly, nothing. This is why I strongly recommend to not organize a dataref cache by their string identifiers.

#### Searching or Finding?

> One thing to rule them all,  
> one thing to find them,  
> One thing to bring them all,  
> and in the structure bind them;  
> In the Plugin of X-Plane where the FPS dwell.

If we want to avoid string comparisons, what do we do then instead? Numeric comparisons are much faster, can we use them instead? A good question, but let me ask you back --- why did we want strings in the first place? The answer is pretty simple: strings are human-readable, so using the string identifier of a dataref makes our code more readable --- for humans. Thinking about this, isn't the primary purpose of code that of being interpreted (i.e. executed) by a computer? Sure it is, but code maintainability is a (in this case competing) objective we shouldn't neglect.

As a compromise, is there something that is as human-readible as a string, and as computing-friendly as an integer? In fact, there is --- let's dig up the good, old `enum`:

```c
#define DATA_DREF_COUNT_MAX 4

typedef enum dref_ref_n {
    SIM_AIRCRAFT_WEIGHT_ACF_M_EMPTY,
    SIM_FLIGHTMODEL_WEIGHT_M_FIXED,
    SIM_FLIGHTMODEL_WEIGHT_M_FUEL,
    SIM_TEST_TEST_FLOAT
} dref_ref_t;
```

This way, the cache for our datarefs could be a simple array:

```c
#include <stdbool.h>
#include <XPLMDataAccess.h>

static XPLMDataRef Drefs[DATA_DREF_COUNT_MAX];


bool dref_init(dref_ref_t ref, const char *id)
{
    Drefs[ref] = XPLMFindDataRef(id);
    if (Drefs[ref] == NULL || !XPLMIsDataRefGood(Drefs[ref]))
    {
        log_error("Failed to initialize dataref %s", id);
        return false;
    }
    return true;
}


bool drefs_init(void)
{
    bool flag = true;
    flag = flag && dref_init(SIM_AIRCRAFT_WEIGHT_ACF_M_EMPTY, "sim/aircraft/weight/acf_m_empty");
    flag = flag && dref_init(SIM_FLIGHTMODEL_WEIGHT_M_FIXED, "sim/flightmodel/weight/m_fixed");
    flag = flag && dref_init(SIM_FLIGHTMODEL_WEIGHT_M_FUEL, "sim/flightmodel/weight/m_fuel");
    flag = flag && dref_init(SIM_TEST_TEST_FLOAT, "sim/test/test_float");
    return flag;
}
```

And in our code, we address datarefs by their `dref_ref_t` enum label --- perhaps not as nice as the string identifiers, but still human readable and way faster for the computer to handle. A getter function for float values could e.g. look like this:

```c
#include <assert.h>

float dref_get_value_f(dref_ref_t ref)
{
    assert(ref < DATA_DREF_COUNT_MAX);
    return XPLMGetDataf(Drefs[ref]);
}
```

So if we wanted to retrieve the emtpy aircraft weight somewhere in our plugin code, we'd do something like this:

```c
float empty_weight = dref_get_value_f(SIM_AIRCRAFT_WEIGHT_ACF_M_EMPTY);
```

#### TL;DR

Organizing a dataref cache by string identifiers is a horrid idea. Using an AVL tree somewhat improves the performance over a linear list, but the basic idea remains horrid --- the cache won't be faster than `XPLMFindDataRef`, making the cache pretty pointless. Use an array with numeric indices instead, which allows for (almost) immediate dereferencing without expensive string comparisons and data structure traversing. To make your code more readable, use an `enum` to name to those numeric indices in a human-readable way.
