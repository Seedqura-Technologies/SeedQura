import siteData from "../../data/site.json";
import teamData from "../../data/team.json";
import productsData from "../../data/products.json";
import coursesData from "../../data/courses.json";
import focusAreasData from "../../data/focus-areas.json";

export type SiteData = typeof siteData;
export type TeamMember = (typeof teamData.members)[number];
export type Product = (typeof productsData.products)[number];
export type Course = (typeof coursesData.courses)[number];
export type FocusArea = (typeof focusAreasData.areas)[number];

export function getSiteData(): SiteData {
  return siteData;
}

export function getTeamMembers(): TeamMember[] {
  return teamData.members;
}

export function getProducts(): Product[] {
  return productsData.products;
}

export function getCourses(): Course[] {
  return coursesData.courses;
}

export function getFocusAreas(): FocusArea[] {
  return focusAreasData.areas;
}
