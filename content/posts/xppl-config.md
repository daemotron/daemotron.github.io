---
title: "Configuration File with XPPL"
date: 2023-09-23
draft: false
tags: ["x-plane", "development", "c/c++"]
categories: ["x-plane"]
---

In this blog post we're looking into using [XPPL](https://github.com/daemotron/xppl/) to enhance a plugin with a configuration file. Working with XPPL's configuration module is follows this five-step sequence:

1. initialize a configuration context
2. register configuration properties
3. load the configuration file
4. access the configuration values
5. clean up

First, we need a configuration context. Since we will need to keep it alive throughout the whole plugin life cycle, we declare it as static, global variable:

```c
#include <xppl.h>
#include <xppl_config.h>

static xppl_config_ctx_t CfgCtx;
```

I recommend to initialize the configuration context in the `XPluginStart` callback function. For writing portable code, I strongly recommend enabling X-Plane's native paths feature (as also proposed by [X-Plane's API documentation](https://developer.x-plane.com/sdk/XPLMUtilities/#Directory_Separators))

```c
#include <stdbool.h>

#include <XPLMPlugin.h>
#include <XPLMUtilities.h>


PLUGIN_API int
XPluginStart(char *outName, char *outSig, char *outDesc)
{
    XPLMEnableFeature("XPLM_USE_NATIVE_PATHS", 1);
    xppl_config_init(&CfgCtx, "Daemoplug Configuration", "Output/daemoplug/config.txt", XPLMGetDirectorySeparator(), true)
    return 1;
}
```

Before XPPL can read configuration properties from a file, we have to tell it about the properties it should read --- much safer and easier to have a parser that only processes what it knows, and ignores the rest... In the example below, we register two configuration properties:

```c
long long default_int = 1234;
const char *default_str = "Hello World";

xppl_config_register(&CfgCtx, "my_int", XPPL_CONFIG_INT, &default_int, "My configurable integer");
xppl_config_register(&CfgCtx, "my_str", XPPL_CONFIG_STRING, default_str, "My configurable string");
```

Now the configuration context "knows" to expect two entries in the configuration file, one named `my_int` with a signed (long) integer as value, and `my_str`, with a string as value. Now we're ready to load and parse the configuration file:

```c
xppl_config_load(&Cfg_Ctx);
```

This short statement is the gist of XPPL's configuration voodoo: It will check whether the configuration file set for the context exists. If it doesn't and the context was initialized the way we did, it creates the configuration file with the default values we indicated when registering the different configuration properties. And finally, it reads and parses the configuration file and updates the configuration property values stored within the configuration context.

The generated configuration file looks like this:

```ini
# Daemoplug Configuration
# =======================

# My configuration integer
my_int = 1234

# My configuration string
my_str = Hello World
```

**NB:** you can call `xppl_config_load` as often as you want (or need) on the same context to re-load values from the configuration file. Adding it to the `XPluginEnable` callback will make sure the configuration file is read and parsed everytime the user disables and re-enables the plugin in X-Plane's plugin admin.

Accessing configuration property values is fairly straight forward, but you'll need to use the correct function for the configuration value's data type:

```c
long long conf_int;
char conf_str[255];

conf_int = xppl_config_data_get_i(&CfgCtx, "my_int");
size_t len = xppl_config_data_get_s(&CfgCtx, "my_str", conf_str, 255);
```

The getters for integer, float and unsigned return the configuration value as scalar, while the string getter requires a buffer and returns the length of the string copied into the buffer.

**NB:** even if the function names use the most popular designation for a data type, the actual data type used is always the longest possible: "integer" is represented by `long long`, "float" by `long double`, and "unsigned" by `unsigned long long`. If your code requires smaller data types, you'll need to cast them.

Finally, we need to clean up the context when shutting down the plugin. This is best done here:

```c
PLUGIN_API void
XPluginStop(void)
{
    xppl_config_destroy(&CfgCtx);
}
```
