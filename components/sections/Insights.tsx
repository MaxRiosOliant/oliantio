import Image from "next/image"
import Link from "next/link"

import { home } from "@/content/home"
import { ButtonLink } from "@/components/ui/ButtonLink"

type Post = {
  category: string
  title: string
  href: string
  author: string
  date: string
  image: string
  avatar: string
}

function Category({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="relative z-10 inline-flex rounded-full bg-paper px-3 py-1 text-sm leading-5 font-medium text-ink"
    >
      {children}
    </Link>
  )
}

function Author({ post }: { post: Post }) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src={post.avatar}
        alt=""
        width={40}
        height={40}
        unoptimized={post.avatar.endsWith(".svg")}
        className="size-10 rounded-full object-cover"
      />
      <div>
        <p className="text-sm leading-5 font-medium">{post.author}</p>
        <p className="text-sm leading-5 text-brand">{post.date}</p>
      </div>
    </div>
  )
}

function Featured({ post }: { post: Post }) {
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-ink text-paper">
      <div className="relative aspect-[7/3.6]">
        <Image
          src={post.image}
          alt=""
          fill
          sizes="(min-width: 73rem) 40rem, 100vw"
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col items-start gap-5 p-6">
        <Category href={post.href}>{post.category}</Category>
        <h3 className="text-xl leading-snug font-bold">
          <Link href={post.href} className="before:absolute before:inset-0">
            {post.title}
          </Link>
        </h3>
        <Author post={post} />
      </div>
    </article>
  )
}

function Compact({ post }: { post: Post }) {
  return (
    <article className="relative flex flex-col overflow-hidden rounded-2xl bg-ink text-paper desk:flex-row">
      <div className="relative aspect-[7/3.6] desk:aspect-[2/3.2] desk:w-40 desk:shrink-0">
        <Image
          src={post.image}
          alt=""
          fill
          sizes="(min-width: 73rem) 10rem, 100vw"
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col justify-between gap-4 p-5">
        <div className="flex flex-col items-start gap-3">
          <Category href={post.href}>{post.category}</Category>
          <h3 className="text-xl leading-snug font-bold">
            <Link href={post.href} className="before:absolute before:inset-0">
              {post.title}
            </Link>
          </h3>
        </div>
        <Author post={post} />
      </div>
    </article>
  )
}

export function Insights() {
  const insights = home.insights

  return (
    <section className="bg-[linear-gradient(#142314,#45ab34)] py-[clamp(4rem,3.142857rem+4.285714vw,7rem)] text-paper">
      <div className="site-container">
        <div className="flex max-w-xl flex-col gap-6">
          <h2 className="font-display text-[clamp(2.25rem,2.035714rem+1.071429vw,3rem)] leading-none font-black text-outline">
            {insights.title}
          </h2>
          <p className="max-w-[40ch] text-xl leading-normal">{insights.text}</p>
        </div>
        <div className="mt-8 mb-8 grid gap-6 md:grid-cols-2">
          <Featured post={insights.featured} />
          <div className="hidden flex-col gap-4 md:flex">
            {insights.posts.map((post) => (
              <Compact key={post.href} post={post} />
            ))}
          </div>
          <div className="flex flex-col gap-4 md:hidden">
            {insights.mobilePosts.map((post, index) => (
              <Featured key={`${post.title}-${index}`} post={post} />
            ))}
          </div>
        </div>
        <ButtonLink href={insights.ctaHref}>{insights.cta}</ButtonLink>
      </div>
    </section>
  )
}
