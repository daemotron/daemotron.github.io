---
title: "Reload 2023"
date: 2023-01-03T21:19:03+01:00
draft: false
tags: ["blog", "hugo"]
categories: ["website"]
---

More than five years without new content --- that's a new sad record, even for me. Time to change things. While originally this site was set up to run with [HubPress](https://github.com/HubPress/hubpress.io), it never really worked up for as well as it promised in the beginning. Working with HubPress was hit and miss --- for me it frequently lost its session context, losing some work done. Also it was pretty picky which browser it worked with. And finally, in 2019, HubPress got shut down. The GitHub repo is still around (archived, i.e. read-only), so there's no hope the pending issues will ever see a fix.

This time I moved to a more proven solution --- [Hugo](https://gohugo.io/) has been around for a while now, with its first release dating back to July 2013, nearly ten years ago. I wasn't keen on customising and modifying tons of stuff, so I just went off with the [Puppet](https://themes.gohugo.io/themes/hugo-theme-puppet/) theme, made to run out of the box. Following [Sarah Gibson's excellent tutorial](https://sgibson91.github.io/blog/hugo-tutorial/), I now use a mixture of local test environment, and automated building & deployment using [GitHub Actions](https://github.com/features/actions).

Since I felt my old posts from 2017 were still relevant and not entirely outdated, I decided to migrate the content from the old HubPress site. With just four posts, converting from AsciiDoc to MarkDown wasn't too hard an exercise. Creating content with Hugo is pretty straight forward after all --- all text content is stored and edited in MarkDown format, and converted by Hugo to (static) HTML pages.

#### What next?

I have a few ideas in mind I want to write about --- certainly all around software development. On the technical side, there will be content around [Python](https://www.python.org/) development, but also [X-Plane](https://www.x-plane.com/) plugin development (in C and/or C++), and perhaps a bit about [Go](https://go.dev/) and [Vue.js](https://vuejs.org/). On the process and soft factors side of things, I intend to revisit Git management flows (my old nemesis), and eventually touch on Scrum, Jira and how they can even help a single-source developer to organize and streamline development tasks.

Mind you, these are ideas, and I usually tend to have a lot more ideas than time to materialize them. I can't tell yet what the posting frequency on this blog might be --- in average something between monthly and quarterly I guess, hopefully not any slower than that, but likely also not much faster.
