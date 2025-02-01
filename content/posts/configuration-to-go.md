---
title: "Configuration to Go"
date: 2024-04-06
draft: false
tags: ["development", "go"]
categories: ["go"]
---
One of the boilerplate tasks for nearly every (application development) project is the implementation of an application configuration management. In most cases, applications have aspects we want to be configurable, e.g. the port a server listens on, the language an UI starts with or the database connection an application shall use. [The twelve-factor app methodology](https://12factor.net/) propagates using environment variables for this purpose, but what might be a good idea for cloud-deployed web apps won't work equally well for desktop applications or in traditional deployment scenarios. For them, more traditional ways like configuration files or command line flags might be a better choice.

Therefore, configuration solutions like [Viper](https://github.com/spf13/viper) have gained populiarity. They combine various inflow paths for configuration information and bundle them in one path-agnostic interface, allowing the application developer to use configuration information without having to care how the information was provided to the application. 

#### Appconf for Go

With [Appconf for Go](https://github.com/daemotron/appconf) I implemented my own configuration solution for Go --- while inspired by Viper, it is much more leightweight and doesn't have any dependencies outside of Go's standard library. And other than Viper, it makes assumptions about configuration file locations (in line with XDG) and provides default paths for storing data, cache and configuration files. And finally, it was a great little project to learn the ropes of Go and familiarize with interfaces, pointers and similar Go-isms.

Adding Appconf to an existing Go project is simple:

```shell
got get github.com/daemotron/appconf
```

Appconf doesn't require much setup; you only have to register the configuration options you want it to manage for your application:

```go
package main

import (
    "github.com/daemotron/appconf"
    "log"
)

func main() {
    // initialize configuration context
    conf := appconf.NewConf("MyApp")
    
    // register configuration option
    err := conf.NewOption("foo", appconf.WithDefaultString("bar"), appconf.WithFlag("f"))
    if err != nil {
        log.Fatalf("Error: %v", err)
    }
	
    // update configuration from files, environment and command line flags
    err = conf.Update()
    if err != nil {
        log.Fatalf("Error: %v", err)
    }
}
```

The sample code above registers a single configuration option called "foo", with a default value of "bar" (indirectly setting the type of this option to `string`). The option is tied to the command line flag `f`, so if the application is launched with `-f baz`, foo's value will be "baz" instead of "bar".

#### Appconf from Scratch

But lets start with the Appconf configuration context. As shown in the example above, it is created by calling the `NewConf()` function. `NewConf()` only has one mandatory paramter, namely the application name, passed as `string`. Beyond the application name, `NewConf()` understands a couple of functional options:

* `WithAuthor(string)` lets you pass an author or publisher name for the application
* `WithVersion(string)` lets you pass a version string for the application
* `WithConfFile(string)` lets you set a single configuration file (absolute path preferred)
* `WithConfFiles([]string)` lets you set a list of configuration files
* `WithRoaming()` lets you chose to use the `roaming` instead of the `local` directory structure (applies only to Windows)

App name, author, version and the roaming flag influence the various paths Appconf can provide --- e.g. `conf.UserDataDir()` returns the user-specific data directory for your appliction (e.g. `~/.local/share/<AppName>` on Linux). If you don't want author or version be used in those paths, just omit their respective functional arguments. Btw. Appconf implements all directories in the same manner as the (now deprecated) [appdirs](https://github.com/ActiveState/appdirs) Python package by ActiveState.

#### Options from Scratch

But Appconf isn't mostly about directories, but rather about configuration options, so let's take a closer look at those. Similar to `NewConf()`, registering a configuration option only requires a unique key (or name) passed as `string`:

```go
err := conf.NewOption("foo")
```

This short statement is already sufficient to register a new option in the `conf` context. Its value can now be set with one of the value setters:

* `conf.SetBool("foo", true)` sets the value of "foo" to the boolean value `true`
* `conf.SetFloat("foo", 123.456)` sets the value of "foo" to the float64 value `123.456`
* `conf.SetInt("foo", 123)` sets the value of "foo" to the int value `123`
* `conf.SetString("foo", "bar")` sets the value of "foo" to the string `"bar"`

Querying values for a key works the same way, just using the `GetInt`, `GetFloat`, `GetBool` and `GetString` methods.

#### No Fault by Default

Ok, that wasn't really spectacular so far --- getting and setting values could be done simply with variables or a map. An absolute must for every configuration solution is however dealing with default values --- if no custom value has been set, it's the default we should get. Appconf can do this, but we have to defined said default value:

```go
err := conf.NewOption("port", appconf.WithDefaultInt(8080))
```

Now we have an option called `port`, which defaults to an integer value of `8080`. Initially, default value and current value are the same:

```go
current, err := conf.GetInt("port")
standard, err := conf.GetDefaultInt("port")
log.Printf("Current Port: %d", current)
log.Printf("Default Port: %d", standard)
```

will result in this output:

```txt
Current Port: 8080
Default Port: 8080
```

If we now set a different current value for the port option using the `conf.SetInt()` method, the output for `GetInt` will change, while the output for `GetDefaultInt` will still be the same. This allows you to recur to the original default value whenever you need it.

**A word of caution:** Appconf does not check if you assign a value of a different type --- you could define an option with a default type of `int`, and later assign a string to its current value. If you then try to retrieve the value with `GetInt`, you might run into an error. `GetInt` will try its best to return an integer value, even if the current value is a string (it can convert a string like "123" just fine), but of course it cannot perform real magic and turn "Wizzard" into an integer value. Therefore I strongly recommend you chose a type when creating an option, and stick with this type.

#### Now I'm Hooked

But wait, Appconf is meant to be a configuration solution, so we don't want to call `SetInt` and the like at all. Don't worry, if configured properly, you won't have to touch any of the `Set` methods. Instead, we can make Appconf do the dirty work for us and update the current value of our options to whatever the configuration tells. We just have to tell Appconf where it should look for the current value for an option:

```go
err := conf.NewOption("port", appconf.WithDefaultInt(8080), appconf.WithFlag("p"), appconf.WithEnv("PORT"), appconf.WithJson("server.port"))

// can only be called once, so do call it after having defined all options
conf.Update()
```

Now we have hooked our `port` option to the command line flag `-p`, to the environment variable `PORT` and to the JSON key `server.port`. What Appconf does now is the following:

First, it will look for configuration files. By default these reside in `UserConfigDir`, `SiteConfigDir` or `GlobalConfigDir` and are called `config.json`. Alternatively, on Unix systems `/etc/appname.json` also works. Appconf will parse all configuration files it found, so if there's more than one matching for this application, we cannot be sure which one was parsed last and thus had the final say about configuration values. Let's assume we only created one file, `/etc/appname/config.json` with the following content:

```json
{
    "server": {
        "host": "localhost",
        "port": 3000
    }
}
```

The port option can be accessed by concatenating the keys, using `.` as a separator (i.e. `server.host`, `server.port`). Since Appconf found our configuration file, the current value of our `port` option is now `3000`, while the default still is `8080`.

Next, Appconf will look for environment variables. If we set the environment variable `PORT` to `8000`, Appconf will update the current value of the `port` option to `8000`. So environment variables override configuration files.

Finally, Appconf will look at command line flags. If it finds `-p <port>` or `-p=<port>`, it will set the current value of the `port` option to whatever was provided via the command line. Command line flags override both, configuration files and environment variables.

Oh, and by the way, when using command line flags it would be a good idea to define a help text, explaining the configuration option:

```go
err := conf.NewOption("port", appconf.WithDefaultInt(8080), appconf.WithFlag("p"), appconf.WithHelp("TCP port to listen on"))
```

This way, we can work with a configuration file on our testbed or development system, use environment variables when deploying to the cloud or a container, and can use command line flags to temporarily override options e.g. for testing or diagnostic purposes. Pretty cool, isn't it?

#### Caveats and the Plumbing

Now while the default behaviour of Appconf covers my personal needs fairly well, there are a few edge cases where you might need to deal with Appconf's inner plumbing to achieve what you need. Let's look at these use cases:

If you want to use Appconf with a different precendence order, you can do so by calling `conf.UpdateFromFiles()`,`conf.UpdateFromEnv()` and `conf.UpdateFromFlags()` in arbitrary order. Just keep in mind that you can call `conf.UpdateFromFlags()` only once, which is a limitation of the underlying [flag](https://pkg.go.dev/flag) package.

The same limitation applies if you want to define command line flags outside of Appconf's configuration context. You can do so using the `flag.BoolVar`, `flag.IntVar` etc. functions from the [flag](https://pkg.go.dev/flag) package, but make sure you don't call `flag.Parse()` --- Appconf will call it within its `UpdateFromFlags()` method.

If you want to access stored options directly, you can do so via the Appconf context object:

```go
conf := appconf.NewConf("MyApp")
err := conf.NewOption("port", appconf.WithDefaultInt(8080))

portString := conf.Options["port"].Value.ToString()
```

**Warning:** `option.Value` and `option.Default` are interface pointers. If you want to set them directly (which I do not recommend), you need to make sure they receive a deep copy of the value pointer:

```go
iv := IntValue(1234)
conf.Options["port"].Value = iv.Copy()
```

Also reading them directly is a no-no, since Go doesn't know what type they really are. If for whatever reason you want to access `Value` or `Default` directly, use their `ToString()`, `ToInt()`, `ToBool()` and `ToFloat64()` methods to obtain a Go standard data type.

#### My Use Case

I use Appconf in several projects. In all of them, I only use the application name to configure the Appconf context. On my local development machine, I use a JSON file located in `~/.config/<AppName>` to set the configuration options, or command line flags if I want to test specific cases. To make the configuration context accessible to all package of the application, I define it as global variable:

```go
package main

import "github.com/daemotron/appconf"

var Conf appconf.AppConf

func setup() {
    Conf = NewConf("MyApp")
    Conf.NewOption("verbose", appconf.WithFlag("v"), appconf.WithDefaultBool(false), appconf.WithHelp("verbose output"))
}
