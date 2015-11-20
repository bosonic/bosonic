# FAQ

## Why Bosonic?

When the initial Web Components spec draft was released, I ([@goldoraf](https://twitter.com/goldoraf/)) was immediately sold. At that time, my team and I were developing Single-Page Apps (commonly referred to as SPA's) for two years. We used many different JavaScript frameworks in our quest for the perfect stack. The end result of this was that we had ended up rewriting the same basic UI code over and over again. We found that each framework required the same core code but had it's own unique requirements that wouldn't allow us to share a common code base. We became convinced that there should be a better and more effective way to do this. That was when we found what we needed in Web Components.

[Polymer](https://www.polymer-project.org/) and [x-tag](http://www.x-tags.org/) were soon released, and we began to experiment with them. The team & I rejected Polymer almost immediately, noting that it was too 'feature-rich' for what we needed (two-way data binding required too many performance trade offs, etc) and the elements were not as useful for our particular use cases. We are extremely thankful to the Polymer authors for their awesome work. Without their dedication and innovation in the Web Components community, we wouldn't have all of the fantastic polyfills and related projects to work with! My team began to implement some elements using x-tag and soon discovered that building an element's DOM manually was cumbersome (x-tag doesn't use the `<template>` element nor Shadow DOM). After our discoveries, we then decided to build our own tool that would better serve our needs and philosophies. This tool would aim to be lighter in file size than Polymer and contain more rich features than x-tag. After many doubts and rewrites, Bosonic was born.

## Why the "reboot"?

There have been a long hiatus between Bosonic's initial release and this "refresh". There are many reasons for that.

First, I've been surprised by the lack of feedback from the community. It took me a long time and many conversations during conferences, meetups and other events to begin to understand why. Basically, a lot of people were confused and didn't "get" Web Components the same way I did: they believed that Web Components were proposed as a standard way for building complete apps with only Web Components and vanilla JS. I personally believe Web Components are ideal for low-level, "standard", reusable UI elements like dialogs, tabs or dropdowns, and that they should be combined with a more powerful library or framework like React, Angular or Ember in order to develop a complete application.

Some people found that working with Bosonic was too complicated: the necessity of a build step was an obstacle for some to even try Bosonic. My will of Internet Explorer 9 (IE9) browser support and awesome performance is the main culprit here: I saw that build step as a necessary evil in order to achieve these goals.

It's hard to stay motivated when you put many long hours into a project you believe in and then don't receive much feedback at all. It's even harder when health issues (not life-threatening, but very painful) and professional difficulties get in the mix.

A few months ago, with these personal issues resolved, I began to think about what to do with Bosonic. Polymer 1.0 and its Material Design integration (in the form of their 'paper-elements' Polymer Elements) had been released. I found that the paper-elements were mostly useless for my team (again, Polymer people, you did an awesome job, but it's just not for everyone). x-tag hadn't moved at all, so I thought there was still an opportunity for Bosonic because I still thought that Web Components were important.

I then realized two things: 
- I needed to simplify Bosonic a lot: no more mandatory build step, even if it meant to drop IE9 support for a time ;
- I needed to reformulate my value proposition: in short, I wanted Bosonic to be like Bootstrap ported to Web Components, i.e. a library of everyday UI elements, and much less a library for building Web Components.

Hence the reboot :-)

## What do you plan next?

Lot of things.

- Get IE9 (and other older browsers) support back: it'll involve a build step, but it'll be optional and shouldn't block people to try Bosonic ;
- Release a build tool for element concatenation & CSS Variables post-processing ;
- Refactor some elements' code into mixins applicable to all elements, not just custom elements: I found out working on Bosonic that what should be simple tasks can get really complicated when using DOM. In some ways, I miss jQuery sometimes :p ;
- Work on elements a11y: I tried to implement a11y as best as I could, but I need testers and feedback to be sure it works fine ;
- And of course...more elements!

