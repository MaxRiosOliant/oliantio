import { authors } from "@/lib/content"

export async function AuthorBio({ slug }: { slug: string }) {
  const author = authors.find((item) => item.slug === slug)
  if (!author) {
    return null
  }
  const { default: Bio } = await author.loadBody()
  return (
    <div className="[&_p]:m-0">
      <Bio />
    </div>
  )
}
