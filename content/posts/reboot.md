---
title: "Reboot"
date: 2017-04-30
draft: false
tags: ["blog", "hubpress"]
categories: ["website"]
---

> I amar prestar aen,  
> Han mathon ne nen,  
> Han mathon ne chae  
> A han noston ned 'wilith

And again, my world is changing. A bit more than one year ago, I moved from a self-hosted blog built with [Ghost](https://ghost.org/) to a fully managed website using Jimdo's website construction kit. Sure, the effort for maintaining the full stack (server, os, database, web server software, etc.) has gone, and I certainly don't want it back.

But maintaining the website itself has proven to be a bit of a hassle with Jimdo --- each page, even each blog post, has to be bricolaged together with predefined content elements. So a lot of my time spent on the website went into layouting articles, instead of writing content. Other than with Ghost, you couldn't just log in and write away in simple plain text ([Markdown](https://en.wikipedia.org/wiki/Markdown), to be precise).

This really had an impact on my posting frequency --- at some time, it was as low as just once every couple of months (my personal "best" was a full 5 months of silence). Not being happy with Jimdo (mostly due to that), I constantly kept looking for alternate solutions, that would give me back an easier content creation, but not at the cost of making me spend hours on administrating servers and applications again.

I tried some big CMS stuff (like [Plone 5](https://plone.org/), [django CMS](https://www.django-cms.org/), [OpenCms](http://www.opencms.org/) and [Ametys](http://www.ametys.org/)) hosted on managed cloud services, but again I didn't find the simplicity I was hoping for. Either it was very complex to set up the site itself, or blogging in general was not well supported. Or media management proved to be complex, or inserting syntax-highlighted code snippets into articles was impossible without bigger hacks... just chose, none of them had real simplicity and elegance in store.

Over time, again and again I was drawn to static site generators. For some time, my blog was running on [Nikola](https://getnikola.com/), and back then I had good reasons to stop using it -- mostly the long run time to get my site updated after having changed something small as a typo fix in an article, but also the fact I had to have access to a computer with the repo cloned locally and all the software dependencies installed.

Yet the simplicity of hosting a static site is still very attractive, so how on earth could I get a static blog without need for local software and build tools, and with the ability to generate content from any computer? I knew about [GitHub Pages](https://pages.github.com/) and [Jekyll](https://jekyllrb.com/), but I could never warm to  Jekyll or derivated static site generators (I'm simply not a ruby guy...). I also experimented with [Sphinx](http://www.sphinx-doc.org/) and [travis-sphinx](https://github.com/syntaf/travis-sphinx), but Sphinx is not really made for websites and blogging.

When I recently stumbled accross [HubPress](http://hubpress.io/), I knew I had found what I was looking for. This blogging solution is built around GitHub pages, works fine even without ever loading something to the local computer, and offers a Ghost-like browser-based post editor (using [AsciiDoc](http://asciidoctor.org/) instead of Markdown). On top, posts can be written via GitHub's built-in editor, or offline with any text editor --- they're just `.adoc` files in a GitHub pages repository or branch.

After more than 15 years of running a personal website, I'm certainly not naive when it comes to site generators and blogging solutions. I'm not sure HubPress will become a sustainable solution, driving my site for a longer period. However, it certainly has the potential to do so, as it brings along all the ingredients I was long looking for --- I will certainly give it the chance to prove it can do this for me, and hopefully also increase my posting frequency.