export interface Testimonial {
  text: string;
  who: string;
  href?: string;
}

/**
 * Drives the "From the field" landing section. Empty array hides the section.
 * Repopulate when real quotes exist.
 */
export const TESTIMONIALS: Testimonial[] = [];
