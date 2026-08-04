"use client";

import {
  Brain,
  Camera,
  Database,
  Droplets,
  Eye,
  Leaf,
  Microscope,
  Plane,
  Satellite,
  Stethoscope,
  Wifi,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

const services = [
  { icon: Leaf, title: "AI in Agriculture", description: "Crop monitoring, yield prediction, and precision farming powered by deep learning.", glow: "green" as const },
  { icon: Stethoscope, title: "AI in Healthcare", description: "Clinical decision support, diagnostics pathways, and hospital integration.", glow: "blue" as const },
  { icon: Eye, title: "Computer Vision", description: "Real-time visual intelligence for fields, facilities, and medical imaging.", glow: "cyan" as const },
  { icon: Microscope, title: "Medical Imaging", description: "X-ray, MRI, and pathology analysis with state-of-the-art AI models.", glow: "blue" as const },
  { icon: Plane, title: "Drone Analytics", description: "Aerial surveys, multispectral analysis, and autonomous field monitoring.", glow: "green" as const },
  { icon: Droplets, title: "Precision Farming", description: "Soil health, irrigation optimization, and resource-efficient agriculture.", glow: "green" as const },
  { icon: Brain, title: "Disease Detection", description: "Early detection of crop and plant diseases before they spread.", glow: "cyan" as const },
  { icon: Satellite, title: "Remote Sensing", description: "Satellite imagery analysis for large-scale agricultural intelligence.", glow: "cyan" as const },
  { icon: Wifi, title: "IoT Solutions", description: "Connected sensors, edge computing, and real-time field data pipelines.", glow: "blue" as const },
  { icon: Database, title: "Dataset Development", description: "Curated, annotated datasets for agriculture and medical AI training.", glow: "green" as const },
  { icon: Camera, title: "Annotation Services", description: "Expert labeling for computer vision and medical imaging models.", glow: "blue" as const },
  { icon: Brain, title: "Research", description: "Publication-oriented R&D in AI, CV, and applied machine learning.", glow: "cyan" as const },
];

export function Services() {
  return (
    <section id="services" className="section-navy relative py-24 md:py-32">
      <div className="noise-overlay absolute inset-0" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Our Services"
          title="End-to-End AI Solutions"
          subtitle="From research to deployment — comprehensive intelligent systems for agriculture and healthcare."
          align="center"
        />
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {services.map((service, i) => (
            <ScrollReveal key={service.title} delay={i * 0.05}>
              <GlassCard {...service} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
