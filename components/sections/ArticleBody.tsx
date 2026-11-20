import { mdxComponents, type MdxContent } from "@/components/mdx"

type ArticleBodyProps = {
  loadBody: () => Promise<{ default: MdxContent }>
}

export async function ArticleBody({ loadBody }: ArticleBodyProps) {
  const { default: Content } = await loadBody()

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10 [&_p]:text-base [&_p]:leading-7">
      <Content components={mdxComponents} />
    </section>
  )
}
