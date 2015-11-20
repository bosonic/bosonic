# Introduction

If you've already read the "Getting started" section, you probably don't need to read this.

Why? Because __Bosonic aims to be a library of low-level UI elements__, elements that you can just drop into your project and use immediately. This is a major problem in Web Components' evangelization by the way: a lot of people I've talked to think that Web Components are a stack of technologies designed for building components & complete apps as HTML elements, but that's not the case, at least not in my mind. Web Components enable the creation of __UI atoms__ as HTML elements, atoms that you can include into your components templates, powered by Angular, Ember, React or whatever.

Have you ever use Bootstrap? How did you use it? You included some files, copied&pasted some markup, and you got a nice UI component in your app. It's the same with Bosonic, minus the copy&paste thing. Like Bootstrap, we want to provide you with common, everyday UI behaviours and styling nicely wrapped in custom HTML elements. Of course, as vanilla Web Components tend to be a bit verbose, we built a small library (our so-called runtime) that eases the burden of building our elements, and this is what we documented in this section.

But, if you came here with the intent of building your own elements, think twice: is your planned element really generic, low-level and reusable in all your apps? Could it make its way into the Bosonic elements catalogue (if you think so, drop us a note about it)? Do you feel it would make a nice addition to the HTML native elements? If that's the case, please read on.

