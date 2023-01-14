---
title: "Talk to the Log"
date: 2023-01-14T19:51:48+01:00
draft: false
tags: ["x-plane", "development", "c/c++"]
---

Making an [X-Plane](https://www.x-plane.com/) plugin "talk" to us is one of the boilerplate tasks when setting up a new plugin project. X-Plane has its own log file, `log.txt`, which is found in X-Plane's root folder. The file gets reset every time X-Plane starts, so there's no need to rotate or trim it from time to time. As a plugin author, we have the choice to either write our own log file, or to jump on X-Plane's bandwagon and use its logging system for our purposes. While I can see the benefits of having a dedicated logfile for a plugin, personally I prefer to use X-Plane's built in logging mechanism -- there are technical reasons, but mostly it's a comfort and usability decision: most X-Plane users will immediately think of the central `log.txt` file when a developer asks them to provide their log file (e.g. when reporting an issue).

So let's take a look at the [XPLMUtilities](https://developer.x-plane.com/sdk/XPLMUtilities/) API provided by the X-Plane SDK. It provides a function called [XPLMDebugString](https://developer.x-plane.com/sdk/XPLMDebugString/), which provides a pretty simple interface to X-Plane's logging mechanism:

```c
#include <XPLMUtilities.h>

XPLM_API void XPLMDebugString(const char *message);
```

What this function does is pretty straight forward - it appends the string `message` to the `log.txt` log file. It doesn't add fancy timestamps, it doesn't care for log levels and verbosity, and it doesn't process format strings and arguments. In consequence, if we need all that (and normally we do), we'll have to implement it ourselves.

For this purpose, let's create two files called `log.h` and `log.c` within our plugin's source code directory (if you followed [my earlier post on this subject](https://daemotron.github.io/2023/01/04/x-plane-plugin-boilerplate/), the source files would go into the `src` directory). Let's start with the log API we'd like to have available in the other modules of our plugin. I prefer to have a set of four logging functions, so let's define them in `log.h`:

```c
#ifndef _DAEMOPLUG_LOG_H_
#define _DAEMOPLUG_LOG_H_

#ifdef __cplusplus
extern "C" {
#endif

#include <stdarg.h>

#define LOG_BUFFER_SIZE 256

typedef enum log_level
{
    Debug=0,
    Info=1,
    Warn=2,
    Error=4
} log_level_t;

void log_debug(const char *, ...);
void log_info(const char *, ...);
void log_warn(const char *, ...);
void log_error(const char *, ...);

#ifdef	__cplusplus
}
#endif

#endif /* _DAEMOPLUG_LOG_H_ */
```

These function prototypes all expect a string, followed by arbitrary arguments. Basically the same syntax you'd use with the `printf()` family of functions. Now, following the DRY ("don't repeat yourself") principle, it doesn't make sense to implement the full logging functionality four times. Instead, we're going to implement a single logging function, which will do the log processing on behalf of the logging API functions. The function as I implemented it in `log.c` looks like this:

```c
#include <stdarg.h>
#include <stdio.h>
#include <string.h>

#include <XPLMDataAccess.h>
#include <XPLMUtilities.h>

#include "log.h"


log_level_t MinLogLevel = Debug;


const char *log_level_string(log_level_t level)
{
    switch (level)
    {
        case Debug:
            return "DEBUG";
            break;
        
        case Info:
            return " INFO";
            break;
        
        case Warn:
            return " WARN";
            break;
        
        case Error:
            return "ERROR";
            break;
        
        default:
            return "INVAL";
            break;
    }
}


void log_msg_v(log_level_t level, const char *message, va_list args)
{
    /* don't log anything below the set log level */
    if (level < MinLogLevel)
    {
        return;
    }

    /* retrieve data for the time stamp (X-Plane convention) */
    int hrs, min;
    float sec, net_time = XPLMGetDataf(XPLMFindDataRef("sim/network/misc/network_time_sec"));
	hrs = (int)(net_time / 3600.0f);
	min = (int)(net_time / 60.0f) - (int)(hrs * 60.0f);
	sec = net_time - (hrs * 3600.0f) - (min * 60.0f);

    /* create the message by rolling in eventual arguments */
    char msg_buffer[LOG_BUFFER_SIZE + 1];
    memset(msg_buffer, '\0', LOG_BUFFER_SIZE + 1);
    vsnprintf(msg_buffer, LOG_BUFFER_SIZE, message, args);
    
    /* prepare the log buffer and send it to log.txt */
    char log_buffer[LOG_BUFFER_SIZE + 64];
    memset(log_buffer, '\0', LOG_BUFFER_SIZE + 64);
	snprintf(log_buffer, LOG_BUFFER_SIZE + 64, "%d:%02d:%06.3f [DAEMOPLUG]: %s: %s\n", hrs, min, sec, log_level_string(level), msg_buffer);
    XPLMDebugString(log_buffer);
}
```

I created a global variable `MinLogLevel` instead of defining it as a constant in `log.h` for a simple reason --- this way I can modify the log level at runtime, e.g. through a configuration file when initializing the plugin or similar. One of the rare cases where a global variable makes sense, given you only ever write to it in a dedicated place (e.g. define a function `log_level_set()` and make it publicly available).

`log_level_string()` is only an auxiliary function, providing a 6 bytes long string containing the log level label (5 characters plus string terminator). The actual work is done in `log_msg_v()` (I append `_v` to functions which require a `va_list` argument, but we'll get to that in a moment). In a first step, we check if the log level of the message submitted is actually high enough to go through --- otherwise we can already stop here. As already mentioned, we have to take care of providing our own time stamp if we want one (useful to see the timing of certain events in the log, so I highly recommend it). Using X-Plane's `sim/network/misc/network_time_sec` data ref as time source keeps our timestamps in sync with those used by X-Plane internally. Calculating hours, minutes and seconds is just a bit of simple maths.

The third step is to actually assemble the message. So far the message consists of a format string (`message` in our example), and eventual further parameters stored in the `args` parameter (strictly speaking `args` is just a pointer to the data structure holding those parameters, ). `stdio.h` provides a variant of the `s(n)printf` function, taking a single `va_list` pointer instead of individual arguments after the format string. Wherever possible, I try using the `n` versions of these functions to have a solid protection from buffer overflows and subsequent segmentation faults.

Finally all information can be merged into the complete message --- time stamp, plugin identifier, log level and the message we just assembled, and the completed buffer gets handed over to X-Plane's `XPLMDebugString()` function, which takes care that the message actually gets written into the `log.txt` log file, even in case of a crash (at least if the crash occurs after `XPLMDebugString()` has been called).

What remains now is the public interface --- as an example, I'm going to show here just the `log_debug()` function. The other three look almost identical:

```c
void log_debug(const char *message, ...)
{
    va_list args;
    
    va_start(args, message);
    log_msg_v(Debug, message, args);
    va_end(args);
}
```

As usual, there are many more possibilities to solve the logging problem in X-Plane. However, I feel it's crucial to have the most simple and straight-forward interface available, so the principle of format strings and arbitrary arguments is one I would never give up --- having to start fiddling with buffers the moment I just want to log an error doesn't seem appealing to me. Anything else IMO is a matter of taste, including the exact format of the log string.
