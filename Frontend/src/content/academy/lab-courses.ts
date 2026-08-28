export type LabCourseDetail = {
  id: string;
  heroHeadline: string;
  heroSubline: string;
  projectStory: string;
  uspChips: string[];
  learnings: string[];
  deliverables: { label: string; title: string; description: string }[];
  tools: string;
  audience: string;
  prerequisites: string;
  trustLine: string;
  ecosystemLine?: string;
  ctaHeadline: string;
  premiumBlurb?: string;
  honestyLines?: string[];
};

export const LAB_COURSE_DETAILS: Record<string, LabCourseDetail> = {
  "frameworks-lab": {
    id: "frameworks-lab",
    heroHeadline: "Ship computer vision projects recruiters can run.",
    heroSubline: "8 live hours · 4 weekends · Colab-friendly",
    projectStory: "Campus Vision",
    uspChips: ["Commit every session", "3 GitHub artifacts", "Demo-day ready"],
    learnings: [
      "Image pipelines from raw data to train-ready splits",
      "Classification and detection with PyTorch in practice",
      "Evaluation and model behavior without heavy math",
      "Public GitHub portfolio with clear run instructions",
    ],
    deliverables: [
      {
        label: "01",
        title: "Vision Data Lab",
        description: "Cleaned pipeline and augmentation notebook",
      },
      {
        label: "02",
        title: "Scene Classifier",
        description: "Transfer-learning model with metrics",
      },
      {
        label: "03",
        title: "Detection Mini + Portfolio",
        description: "Detection demo and monorepo README",
      },
    ],
    tools: "Python · OpenCV · PyTorch · Jupyter · GitHub · Colab",
    audience: "Students and early-career learners with Python basics.",
    prerequisites: "Python basics · Jupyter or VS Code",
    trustLine:
      "Applied sprint aligned with NASSCOM Concepts of Computer Vision (SSC/N8139).",
    ctaHeadline: "Ready to ship vision work?",
  },
  "signal-lab": {
    id: "signal-lab",
    heroHeadline: "From business question to deployed model.",
    heroSubline: "8 live hours · 4 weekends",
    projectStory: "Student Success Predictor",
    uspChips: [
      "Commit every session",
      "End-to-end ML workflow",
      "Live prediction API",
    ],
    learnings: [
      "Frame a business question with clear success metrics",
      "Build a clean dataset and exploratory analysis pipeline",
      "Train and evaluate supervised models with scikit-learn",
      "Deploy a simple API and package the workflow on GitHub",
    ],
    deliverables: [
      {
        label: "01",
        title: "Data Intake Lab",
        description: "Merged dataset and cleaning pipeline",
      },
      {
        label: "02",
        title: "At-Risk Classifier",
        description: "Trained model and evaluation report",
      },
      {
        label: "03",
        title: "Prediction API + Portfolio",
        description: "FastAPI endpoint and monorepo README",
      },
    ],
    tools: "Python · pandas · scikit-learn · FastAPI · GitHub · Colab",
    audience: "Students and early-career learners with Python basics.",
    prerequisites: "Python basics · Jupyter or VS Code",
    trustLine:
      "Applied sprint aligned with NASSCOM AI Machine Learning Analyst (SSC/Q8113).",
    ctaHeadline: "Ready to ship analyst-grade work?",
  },
  "groundtruth-lab": {
    id: "groundtruth-lab",
    heroHeadline: "Models are only as good as their labels.",
    heroSubline: "8 live hours · 4 weekends",
    projectStory: "Campus Safety Labeling Kit",
    uspChips: [
      "No ML degree required",
      "Labeled dataset shipped",
      "ML-ready handoff docs",
    ],
    learnings: [
      "Design a label taxonomy and annotation guidelines from a brief",
      "Label and curate a real image dataset with industry tools",
      "Run quality checks and fix labels before handoff",
      "Package annotation work as a public GitHub portfolio",
    ],
    deliverables: [
      {
        label: "01",
        title: "Annotation Brief & Taxonomy",
        description: "Label classes and tool setup",
      },
      {
        label: "02",
        title: "Labeled Dataset",
        description: "COCO or YOLO export with manifest",
      },
      {
        label: "03",
        title: "QA Kit + Portfolio",
        description: "Validation report, guidelines, and handoff docs",
      },
    ],
    tools: "Label Studio · Python · COCO / YOLO · GitHub",
    audience: "Students entering AI data ops. No ML engineering background required.",
    prerequisites: "Basic computer literacy · spreadsheets and web tools",
    trustLine:
      "Applied sprint aligned with NASSCOM Data Annotator (SSC/Q8120). Labels can feed Frameworks Lab.",
    ctaHeadline: "Ready to label like a pro?",
  },
  "research-fellowship": {
    id: "research-fellowship",
    heroHeadline: "Research-grade work. Not another certificate.",
    heroSubline: "3 months · 48 live hours · 30 seats · 5 groups of 6",
    projectStory: "Research-grade portfolio",
    uspChips: [
      "Selection-based enrollment",
      "One mentor-led problem per group",
      "Manuscript prep, not guaranteed publication",
    ],
    premiumBlurb:
      "Small research groups work one serious AI problem under structured mentorship: literature review, experiments, documentation, and a final demo. Domains include healthcare, agriculture, computer vision, and generative AI.",
    learnings: [
      "Formulate a research problem and situate it in existing work",
      "Run an end-to-end workflow from data to model to evaluation",
      "Design experiments with baselines and honest comparative analysis",
      "Produce research documentation, GitHub, and a demo-day presentation",
      "Draft a manuscript with submission guidance",
    ],
    deliverables: [
      {
        label: "Project",
        title: "Research-grade AI project",
        description: "Your contribution inside a 6-person group",
      },
      {
        label: "Code",
        title: "Public GitHub repository",
        description: "Reproducible experiments and clean structure",
      },
      {
        label: "Docs",
        title: "Technical report",
        description: "Methodology, implementation, and results",
      },
      {
        label: "Research",
        title: "Manuscript draft",
        description: "Literature review, design, and comparative analysis",
      },
    ],
    tools: "Python · PyTorch / TensorFlow · OpenCV · Jupyter · GitHub · Colab",
    audience:
      "B.Tech, BCA, MCA, and M.Tech students building a serious AI portfolio. Application required.",
    prerequisites: "Solid Python · ML fundamentals preferred · selection by application",
    trustLine:
      "3-month internship certificate on successful evaluation. Manuscript preparation with submission guidance.",
    honestyLines: [
      "We do not guarantee conference or journal acceptance.",
      "Seats are limited. Group placement follows selection.",
    ],
    ecosystemLine: "Completed a Seedqura lab? Apply as your research next step.",
    ctaHeadline: "Apply for selection.",
  },
};

export function getLabCourseDetail(courseId: string): LabCourseDetail | null {
  return LAB_COURSE_DETAILS[courseId] ?? null;
}

export function getLabCourseDetailIds(): string[] {
  return Object.keys(LAB_COURSE_DETAILS);
}
