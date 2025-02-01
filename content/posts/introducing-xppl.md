---
title: "Introducing XPPL"
date: 2023-09-22
draft: false
tags: ["x-plane", "development", "c/c++"]
categories: ["x-plane"]
---

Are you tired of (re-)writing the same boilerplace code for every [X-Plane](https://www.x-plane.com) plugin project --- over and over again? Well, at least that's how I felt when I started my fourth or fifth plugin. Sure, I reused a lot of my boilerplate code, but with every project, I refined and enhanced it. Backporting those changes to older plugins became a tedious task though; therefore I started the X-Plane Plugin Library ([XPPL](https://github.com/daemotron/xppl)).

The name is slightly misleading --- XPPL is not a shared library (like a Windows `.dll` or Unix `.so` file), but rather a *code library*, providing a modular collection of source code files which can be embedded into any C or C++ project. The way the code library is organized allows you to cherry-pick only code you really need for your plugin project.

#### What Can XPPL Do?

Currently, XPPL is relatively light and provides some basic functionality:

* `xppl.h`: macros for min / max comparisons, marking unused arguments, and crashing the application
* `xppl_alloc.h`: `malloc`, `calloc` and `realloc` implementations with integrated success checking and failure logging. Requires the `xppl_common` module.
* `xppl_config.h`: enhance your plugin by a configuration file. Requires the `xppl_common` and `xppl_config` modules.
* `xppl_float.h`: equality checks for different floating point types, using epsilon and [ULP](https://en.wikipedia.org/wiki/Unit_in_the_last_place). Requires the `xppl_common` module.
* `xppl_int.h`: activate 128 bit integer (if available) and provide `abs` macro for integers.
* `xppl_log.h`: configurable logging. Requires the `xppl_common` module.
* `xppl_path.h`: platform-independent dirname, create path, create path recursively and check for path existence implementation. Requires the `xppl_common` module.
* `xppl_test.h`: basic unit test framework without third-party dependencies. Requires the `xppl_common` and `xppl_test` modules. 

#### How To Use XPPL

In this example, we're using XPPL's logging functionality in a simple, barebone X-Plane plugin (as described in [X-Plane Plugin Boilerplate](/2023/01/04/x-plane-plugin-boilerplate/). In a first step, let's add XPPL as [Git submodule](https://git-scm.com/book/en/v2/Git-Tools-Submodules):

```sh
git submodule add https://github.com/daemotron/xppl.git
```

If you don't track your plugin with Git, you can alternatively check out the XPPL repository into your project directory:

```sh
git clone https://github.com/daemotron/xppl.git 
```

Either method will end with a directory called `xppl`, sitting at the same level as your `src` and `SDK` directories. Next, we need to tell CMake to include XPPL into the plugin build. Insert the following snippet into your `CMakeLists.txt`:

```cmake
# Detect XPPL
get_filename_component(XPPL_PATH "./xppl/" ABSOLUTE)
message("-- Detecting XPPL path")

if(NOT EXISTS ${XPPL_PATH})
    message(FATAL_ERROR "Missing XPPL folder: ${XPPL_PATH}")
endif(NOT EXISTS ${XPPL_PATH})
```

Now we have to make sure CMake picks up the required XPPL module(s):

```cmake
# Include files
include_directories ("./src")
include_directories ("${SDK_PATH}")
include_directories ("${SDK_PATH}/CHeaders/XPLM")
include_directories ("${SDK_PATH}/CHeaders/Wrappers")
include_directories ("${SDK_PATH}/CHeaders/Widgets")
include_directories ("${XPPL_PATH}/include")

file(GLOB_RECURSE PROJECT_SOURCES "src/*.c")
file(GLOB_RECURSE XPPL_COMMON_SOURCES "xppl/xppl_common/*.c")

set(SOURCES ${PROJECT_SOURCES} ${XPPL_COMMON_SOURCES})
```

Further modules could be added using the same scheme. Now let's take a look at the plugin code itself (`main.c`):

```c
#include <string.h>

#include <XPLMPlugin.h>
#include <XPLMUtilities.h>

#include <xppl.h>
#include <xppl_log.h>


PLUGIN_API int
XPluginStart(char *outName, char *outSig, char *outDesc)
{
    strcpy(outName, "DaemoPlug");
    strcpy(outSig, "net.daemotron.plugin");
    strcpy(outDesc, "The uber cool plugin that does absolutely nothing.");

    xppl_log_init(XPLMDebugString, XPPL_LOG_DEBUG, "DAEMOPLUG");
    xppl_log_info("DaemoPlug version 1337");

    return 1;
}


PLUGIN_API void
XPluginStop(void)
{
    xppl_log_destroy();
}
```

That's all --- now the simple plugin can use the various `xppl_log` functions, which will automagically dump the log output to X-Plane's `log.txt`.

#### How About libacfutils?

Let me be clear about this: XPPL is ***not*** meant to be a replacement for Saso Kiselkov's excellent [libacfutils](https://github.com/skiselkov/libacfutils/). His library goes far beyond what XPPL is (and likely ever will) meant to be. XPPL is designed to be (and remain) a lightweight code collection, facilitating the most basic boilerplate tasks.
