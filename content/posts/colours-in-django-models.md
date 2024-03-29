---
title: "Colours in Django Models"
date: 2017-11-08
draft: false
tags: ["development", "python", "django"]
---

Colours are quite a common property to real world objects. So naturally when building web applications, sooner or later one encounters the need to assign a colour attribute to an object. For [Django](https://djangoproject.com) developers, this usually means adding a `models.CharField` to their model, ready to capture the colour's [hex code](https://en.wikipedia.org/wiki/Web_colors#Hex_triplet).

Technically this works pretty well, as those hex codes can directly be used in HTML style attributes, embedded SVG drawings, etc. However, setting colour values via text input widget is quite tedious. On the frontend side, various libraries offer quite elaborate solutions for integrating nice colour picking widgets. For the Django admin, there is however a quite simple solution: use HTML 5 color inputs!

To achieve this, we need to define a custom data type, alongside with a custom widget. Let's start with the widget, as it has no further dependencies, but is later needed to define the custom data type. I prefer encapsulating widgets in their own Python module within a Django application, usually centralizing them in `widgets.py`. The code would look like:

```python
class ColorWidget(Input):
    input_type = 'color'
    template_name = 'myapp/forms/widgets/color.html'
```

OK, looks as if we had to somewhere store a template. Frankly speaking, you could also use `django/forms/widgets/text.html`; it wouldn't make any difference. I just think that when using custom stuff, it's better to use a custom copy --- you never know what they'll be modifying with the next Django release... The template is extremely simple and looks like this:

```django
{% include "django/forms/widgets/input.html" %}
```

Now finally we need the custom data type. As Django keeps its data types all in `django.db.models`, I consider it ok to define the one extra custom data type within my `models.py`. However, if there are more custom types needed, I would separate them in their own module and just import them. The colour data type using our custom widget looks like this:

```python
class ColorField(models.CharField):
    def __init__(self, *args, **kwargs):
        kwargs['max_length'] = 10
        super(ColorField, self).__init__(*args, **kwargs)

    def formfield(self, **kwargs):
        kwargs['widget'] = ColorWidget
        return super(ColorField, self).formfield(**kwargs)
```

Overwriting the constructor is not absolutely necessary, but it offers a nice way to ensure the field length is sufficient for capturing colour codes. Please also note that in this example, the legacy notation for `super()` has been used. Python 3 only developers can of course use the modern `super()` notation.

Using this new custom data type is straight forward --- in your model, use it like any other data type:

```python
class ShinyThing(models.Model):
    color = ColorField(default='#ffffff')
```

That's it --- no fiddling with JavaScript libraries, custom forms etc. Maybe this is not the most sophisticated solution, but I find it's quite good and proved to be sufficient in many cases, where colour editing in the Django admin was more an "every now and then" story.