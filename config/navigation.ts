import { site } from "@/config/site"

/** Omit `href` to render the label as text instead of a link. */
export type NavLink = {
  label: string
  href?: string
}

/** Omit `href` to render the column label as a heading instead of a link. */
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
          { label: "Custom Development", href: "/services/custom-development" },
          { label: "MVP Development", href: "/services/mvp-development" },
        ],
      },
      {
        label: "QA Testing & Automation",
        href: "/services/qa",
        links: [
          { label: "Manual Testing", href: "/services/qa#manual-testing" },
          { label: "Automation", href: "/services/qa#automation" },
          { label: "Performance Testing", href: "/services/qa#performance-testing" },
        ],
      },
      {
        label: "Digital Marketing & SEO",
        href: "/services/digital-marketing-seo",
        links: [
          { label: "SEO Optimization", href: "/services/digital-marketing-seo#seo-optimization" },
          { label: "Content Marketing", href: "/services/digital-marketing-seo#content-marketing" },
          { label: "Social Media Marketing", href: "/services/digital-marketing-seo#social-media-marketing" },
        ],
      },
      {
        label: "Partners",
        links: [
          { label: "Google Cloud Partner" },
          { label: "Odoo" },
        ],
      },
    ],
  },
  {
    label: "Technologies",
    groups: [
      {
        label: "Languages",
        links: [
          { label: ".Net / C#", href: "/services/development/net" },
          { label: "Java", href: "/services/development/java" },
          { label: "Node", href: "/services/development/node" },
          { label: "Python", href: "/services/development/python" },
        ],
      },
      {
        label: "Frameworks",
        links: [
          { label: "React", href: "/services/development/react" },
          { label: "Angular", href: "/services/development/angular" },
        ],
      },
      {
        label: "No Code",
        links: [
          { label: "WebFlow", href: "/services/development/webflow" },
          { label: "WordPress", href: "/services/development/wordpress" },
        ],
      },
      {
        label: "Cloud",
        links: [
          { label: "Google Cloud Platform", href: "/services/development/google-cloud-platform" },
          { label: "AWS", href: "/services/development/aws" },
          { label: "Microsoft Azure", href: "/services/development/microsoft-azure" },
        ],
      },
    ],
  },
  { label: "Blog", href: "/blog" },
  { label: "About Us", href: "/about-us" },
  { label: "Contact Us", href: "/contact-us" },
  { label: "Careers", href: site.careersUrl },
]
