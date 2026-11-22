export const FORM_SUCCESS = "Thank you! Your submission has been received!"
export const FORM_ERROR = "Oops! Something went wrong while submitting the form."

export const formNames = {
  schedule: "Schedule a Call",
  newsletter: "Newsletter",
  contact: "Contact Us",
} as const

export type FormName = (typeof formNames)[keyof typeof formNames]
