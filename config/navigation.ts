import { site } from "@/config/site"

export type NavLink = {
  label: string
  href: string
}

export type NavGroup = {
  label: string
  href?: string
  links: NavLink[]
}

export type NavItem = {
  label: string
  href?: string
  groups?: NavGroup[]
}

export const primaryNav: NavItem[] = [
  {
    label: "Our Services",
    groups: [
      {
        label: "Enterprise Solutions",
        links: [
          { label: "Web Development", href: "/services/web" },
          { label: "Staff Augmentation", href: "/services/staff-augmentation" },
          { label: "MVP Development", href: "/services/mvp-development" },
        ],
      },
      {
        label: "QA Testing & Automation",
        href: "/services/qa",
        links: [
          { label: "Manual Testing", href: "/services/qa" },
          { label: "Automation", href: "/services/qa" },
          { label: "Performance Testing", href: "/services/qa" },
        ],
      },
      {
        label: "Digital Marketing & SEO",
        href: "/services/digital-marketing-seo",
        links: [],
      },
      {
        label: "Partners",
        href: "/services/digital-marketing-seo",
        links: [],
      },
    ],
  },
  {
    label: "Technologies",
    groups: [
      {
        label: "Languages",
        links: [{ label: ".Net / C#", href: "/services/development/net" }],
      },
      {
        label: "Frameworks",
        links: [
          { label: "React", href: "/services/development/react" },
          { label: "Angular", href: "/services/development/angular" },
        ],
      },
    ],
  },
  { label: "Blog", href: "/blog" },
  { label: "Careers", href: site.careersUrl },
]
