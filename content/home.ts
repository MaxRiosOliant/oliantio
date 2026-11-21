import { site } from "@/config/site"

export const home = {
  header: {
    cta: "Schedule a Call",
    ctaHref: "/schedule-a-call",
  },
  hero: {
    title: "Unlock Your Potential",
    subtitle: "Accelerate your growth",
    text: "Our experts will help you capitalize on opportunities, eliminate problems, and achieve your goals.",
    cta: "Schedule a call",
    ctaHref: "/schedule-a-call",
    image: {
      src: "/images/home/hero-homepage.svg",
      alt: "",
      width: 657,
      height: 626,
    },
  },
  services: {
    title: ["We excel in the following", "services"],
    items: [
      {
        title: "Web Development",
        text: "We help you create and maintain diverse websites, including e-commerce, SaaS solutions, content management platforms, and custom solutions in several technologies.",
        icon: "/images/home/service-web.svg",
      },
      {
        title: "QA & Testing",
        text: "We help you implement best practices for manual and automated testing, extend your teams, or work on a project basis. Our QA professionals align with diverse time zones.",
        icon: "/images/home/service-qa.svg",
      },
      {
        title: "Digital Marketing & SEO",
        text: "We help you improve your website rankings, increase organic traffic, maximize your digital presence, and drive leads through pay-per-click ads, on-page SEO, and marketing campaigns.",
        icon: "/images/home/service-seo.svg",
      },
      {
        title: "Staff\u00a0Augmentation",
        text: "We help you scale your team efficiently with highly qualified vetted professionals with specialized skills managed by experts in diverse IT\u00a0areas.",
        icon: "/images/home/service-staff.svg",
      },
    ],
  },
  reasons: {
    title: "Why work with us",
    items: [
      {
        text: "We are a company founded by IT experts who have worked for 20-30 years on projects of varying sizes in several industries.",
        icon: "/images/home/reason-1.svg",
      },
      {
        text: "We optimize processes and delivery to maximize our clients’ benefits and ensure rapid ROI.",
        icon: "/images/home/reason-2.svg",
      },
      {
        text: "We manage clients and projects from different locations. Our headquarters are in Central Time, but we can deliver from different time zones worldwide.",
        icon: "/images/home/reason-3.svg",
      },
      {
        text: "We love what we do and want our clients to experience our passion for high-quality results by having the best professionals in each technology.",
        icon: "/images/home/reason-4.svg",
      },
    ],
  },
  process: {
    title: "Our Process",
    text: "Our process is simple and proven across multiple industries",
    cta: "Schedule a Call",
    ctaHref: "/schedule-a-call",
    image: {
      src: "/images/home/process.avif",
      alt: "",
    },
    steps: [
      {
        title: "Step 1: Initial Call",
        text: "An exploratory meeting to understand your problems.",
      },
      {
        title: "Step 2: Pre-meeting research",
        text: "Additional research about the company, issues, and potential solutions.",
      },
      {
        title: "Step 3: Review meeting",
        text: "Review our findings and approach. Define metrics for success.",
      },
      {
        title: "Step 4: Agreement & Follow-up",
        text: "Process review and agreement sign-up. Presentation of the follow-up process.",
      },
    ],
  },
  insights: {
    title: "OLIANT’s Insights",
    text: "Dive into OLIANT's thought leadership, highlighting the trends, innovations, and insights that shape the ever-evolving tech landscape.",
    cta: "View All Posts",
    ctaHref: "/blog",
  },
  footer: {
    columns: [
      {
        title: "Discover Oliant",
        links: [
          { label: "Web Development", href: "/services/web" },
          { label: "QA Testing & Automation", href: "/services/qa" },
          { label: "Digital Marketing & SEO", href: "/services/digital-marketing-seo" },
          { label: "Products Partnership", href: "/schedule-a-call" },
        ],
      },
      {
        title: "Resources",
        links: [{ label: "Blog", href: "/blog" }],
      },
      {
        title: "Oliant",
        links: [
          { label: "About Us", href: "/about-us" },
          { label: "Contact Us", href: "/contact-us" },
          { label: "Job Opportunities", href: site.careersUrl },
          { label: "Privacy Policy", href: "/privacy-policy" },
        ],
      },
    ],
    badge: {
      src: "/images/home/badge.avif",
      alt: "",
      width: 366,
      height: 95,
    },
    formTitle: "Get in touch",
    formText:
      "Get insights from experts on building websites and increasing your visibility with Digital Marketing and SEO",
    contact: "Contact Us",
    contactHref: "/contact-us",
    schedule: "Schedule a Call",
    scheduleHref: "/schedule-a-call",
    emailLabel: "Your email address",
    terms: "Terms and Conditions",
    subscribe: "Subscribe",
    socialTitle: "Follow Us",
    social: [
      {
        label: "Facebook",
        href: "https://www.facebook.com/profile.php?id=61563344463128",
        icon: "/images/home/social-facebook.svg",
      },
      {
        label: "Instagram",
        href: "https://www.instagram.com/oliantllc/",
        icon: "/images/home/social-instagram.svg",
      },
      {
        label: "LinkedIn",
        href: "https://www.linkedin.com/company/oliant",
        icon: "/images/home/social-linkedin.svg",
      },
      {
        label: "X",
        href: "https://x.com/OliantGlobal",
        icon: "/images/home/social-x.svg",
      },
      {
        label: "YouTube",
        href: "https://www.youtube.com/@Oliant-Orbit",
        icon: "/images/home/social-youtube.svg",
      },
    ],
  },
} as const

export type HomeContent = typeof home
