---
title: "Meet Nova Act, Amazon’s Powerful New AI Agent SDK"
slug: nova-act-ai-agent-sdk
date: 2025-07-11
updated: 2025-07-14
author: max-rios
category: technology
excerpt: "The Nova Act SDK powers Amazon’s AI agent, handles browser automation, multi-step workflows, and could be outperforming ChatGPT and Claude in benchmarks."
coverImage:
  src: /images/articles/nova-act-ai-agent-sdk/cover.png
  alt: Nova Act Amazon AI Agent SDK
draft: false
seo:
  title: Why Amazon Nova Act Could Lead the AI Agent Race in 2025
  description: "The Nova Act SDK powers Amazon’s AI agent to handle browser automation, execute multi-step workflows, and outperform ChatGPT and Claude in benchmarks."
  noindex: false
---

With all the buzz that surrounds AI and LLMs nowadays, there’s not often a lot said about the more active AI agents. They’re not always seen as accessible as some other frameworks, but I believe we’re on the cusp of that changing, and Nova Act might be a good example of that.

Amazon Nova Act, a new AI agent from [Amazon’s AGI](https://labs.amazon.science/blog/nova-act) Labs, is part of a new breed of reliable AI agents designed for action, not just output.

Most people are familiar with AI in the form of chatbots or content generators. This model is instead tailored to navigate browsers, perform real tasks, and handle multi-step workflows the way a virtual assistant would.

So, how does it work? And how can you set up Nova Act for yourself? Let’s take a look.

## Breaking Down the AI Agent

When it comes to AI agents, autonomy is one of the things that we’re all paying attention to. In Nova Act’s case, this can be attributed to the Nova Act SDK, a developer toolset that transforms natural language instructions into real, repeatable actions in a web browser. The system can break down vague commands like “book a trip” into precise sequences of clicks, scrolls, and form entries.

What sets Nova Act apart for us isn’t just what it can do; it’s how reliably it does it compared to other AI models. Its internal benchmarks show it excelling in areas where others frequently trip up.

All of this is possible because Nova Act is trained across more than 100 domains, including travel, finance, and healthcare. That broad training scope makes it uniquely adaptable to real-world, web-based AI tasks beyond what current assistants can manage.

###### \[Also check out [the top ChatGPT alternatives](https://www.oliant.io/articles/chatgpt-alternatives) \]

For example, Amazon reports a 94% success rate in handling tricky calendar widgets and a 91% accuracy rate when parsing dense restaurant menus, both common problem areas for AI systems trying to mimic human browser behavior.

Performance data further backs this up. Nova Act outperformed competitors on the ScreenSpot benchmark, achieving a 0.939 score in executing textual UI commands and 0.879 in visual element interaction. On the GroundUI Web benchmark, which evaluates how well an AI agent interacts with a variety of web UI elements, it scored 0.805—nearly neck and neck with Claude 3.7 and [OpenAI’s comparable tools](https://www.oliant.io/articles/chatgpt-alternatives).

![](/images/articles/nova-act-ai-agent-sdk/6875502f40fe2b6971727dc6-novaact-media.png)

These metrics might not mean much to the average user, but for developers and researchers building browser-based agents, this kind of browser automation fidelity is a game-changer.

## How Nova Act Works

What powers this leap forward is the modularity and clarity of the Nova Act SDK. With it, you can easily create agents by writing natural-language prompts that are broken down into reliable atomic tasks (things like clicking buttons, filling in forms, or submitting data). However, it goes further, allowing you to embed Python code, schedule recurring tasks, and even trigger workflows asynchronously.

There’s no need to watch over it as it performs. Once the agent works, it can run in headless mode or be deployed via API. Nova also works in tandem with tools like Playwright, so it can tackle challenges like password entry or cookie consent banners.

### Stepping Into AGI

Nova Act also marks Amazon’s first concrete step toward artificial general intelligence (AGI), a system that can learn to perform any task, not just ones it's specifically trained on. While other AI agents rely on static instruction-following, Nova is built with the idea that agents should adapt and improve through experience across diverse environments.

Amazon’s internal research suggests this generalist approach is already paying off. In test environments, Nova showed it could handle interfaces it had never seen before, including dynamic web games. This kind of cross-environment learning is a big deal. It hints at a future where agents like Nova don’t need to be hand-programmed for each new website; they can generalize and perform reliably wherever they go.

Of course, Nova Act isn’t perfect. Complex scenarios still require handholding, and there are certain circumstances where the reasoning is still too literal. For example, an [experimenting user](https://medium.com/@ajdevlife/my-first-autonomous-web-agent-what-i-learned-from-nova-act-744feba6a70f) mentioned Nova getting stuck in a loop for not being able to see the menu of a closed restaurant when trying to schedule an order for later.

CAPTCHA forms, pop-ups, and ambiguous layouts still pose a challenge. But even with these limitations, Nova Act is a giant leap toward a future where agents handle the online busywork for us.

### The Issues with Nova Act

Despite looking pretty promising, there are still some valid concerns about Nova Act and these kinds of agents in general.

First, there’s the issue of trust; Nova can access your email, calendar, passwords, and possibly even bank accounts. While Amazon has implemented end-to-end encryption and various guardrails in the SDK, handing that level of access to a machine will be a tough sell for many users.

Then there’s the ethical side. Should an AI agent be allowed to negotiate salaries? Make decisions on behalf of someone in a healthcare setting? The answers aren’t clear, and Amazon is wisely positioning the SDK as a research preview to get feedback before scaling the technology.

Despite all of these questions, this moment already feels like the starting line of an AI agent arms race. OpenAI, for instance, has launched “Operator,” which can draft emails but often stumbles on follow-through. Anthropic’s agent performs well at research tasks but struggles with transactions. And other players, like China’s Manus, claim outlandish capabilities (like buying real estate) that remain unproven.

The difference with Nova Act is Amazon’s scale. With Alexa embedded in over 500 million devices worldwide, they have a direct pathway to global deployment that few competitors can match.

###### \[Also check out [our Grok 3 Review](https://www.oliant.io/articles/grok-3-2025-review) \]

## How to Set Up Nova Act on Windows

If anything in our article has made you curious and you're looking to try Nova Act for yourself, you can arrange a Windows setup pretty easily with venv. The API key is already available on Nova’s own website for anyone who wants to take their latest AI agent for a try. Just follow these steps:

1.  Create and activate a virtual environment

2.  Install Nova act

3.  Get the API key

That should be it. If you want to give it a test, we suggest using the example script (hello\_nova.py) given by the Nova Act GitHub page.

## Closing Thoughts

Rohit Prasad, Amazon’s head of AGI, said about Nova, *“We’re not building a better chatbot. We’re building a better day.”* These are strong words; ultimately, the Amazon Nova Act isn’t perfect, but it does show a lot of potential, and it might be a sign of things to come.

With AWS still keeping any further developments under cover while their competitors keep investing in their AI agent tech, we can only guess what the LLM industry will bring in the following years.
