---
title: "CMake Linux Hack"
date: 2023-01-11T00:16:46+01:00
draft: false
tags: ["cmake", "development", "c/c++"]
---

Beginning with its most recent version (3.25 at the time of writing this post), [CMake](https://cmake.org/) provides the [LINUX](https://cmake.org/cmake/help/latest/variable/LINUX.html) variable, which I used in [my previous post](https://daemotron.github.io/2023/01/04/x-plane-plugin-boilerplate/). Of course, developers on Linux tend to use the version of CMake they can install from their distribution's package manager. On Ubuntu 22.04 LTS that would be 3.22, and even on the most recent Ubuntu version (22.10) we're at 3.24 --- meaning this variable is not available in these CMake versions.

To work around this issue for older CMake versions, there's a simple, yet effective hack --- just insert this somewhere at the top of your `CMakeLists.txt` file:

```cmake
if(CMAKE_VERSION VERSION_LESS "3.25")
    if(UNIX AND NOT APPLE)
        set(LINUX TRUE)
        message("-- Linux detected")
    endif()
endif()
```

This little piece of CMake script sets the `LINUX` variable to `true` if the CMake version is less than 3.25, running on a unixoid system, but not on an Apple system. Of course this is not really a correct way to detect whether we're on Linux or not --- this condition would be `true` on a lot of different systems (BSDs, Cygwin, etc.). However, given we'd build an X-Plane plugin only on Windows, macOS and Linux, this condition is sufficient to rule out Windows and macOS, leaving only Linux as possibility. Just keep this in mind when copying a `CMakeLists.txt` file or parts of it for using them in other projects...
