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
  /** Research Fellowship expand sections */
  premiumBlurb?: string;
  researchTracks?: { title: string; items: string[] }[];
  programMonths?: { label: string; theme: string }[];
  liveTrainingLine?: string;
  honestyLines?: string[];
};

export const LAB_COURSE_DETAILS: Record<string, LabCourseDetail> = {
  "frameworks-lab": {
    id: "frameworks-lab",
    heroHeadline: "You don't leave with notes. You leave with repos.",
    heroSubline: "8 live hours · 4 weekends",
    projectStory: "Campus Vision",
    uspChips: [
      "Every class ends in a commit",
      "Colab-friendly · no GPU drama",
      "3 shippable GitHub artifacts",
      "LinkedIn-ready demo day",
    ],
    learnings: [
      "Where computer vision shows up in industry and how those products are built end to end",
      "How to load, inspect, and organize image datasets for a real CV pipeline",
      "Data cleaning for vision: noise, outliers, normalization, balancing, splits, light augmentation",
      "Core CV tasks: classification, localization, detection, segmentation, and which to pick when",
      "CNNs in practice without drowning in math",
      "Train, evaluate, and customize a model; peek inside predictions with activation maps",
      "Package work as a public GitHub portfolio recruiters can actually run",
    ],
    deliverables: [
      {
        label: "A",
        title: "Vision Data Lab",
        description: "Cleaned image pipeline + split/augment notebook",
      },
      {
        label: "B",
        title: "Scene Classifier",
        description: "Transfer-learning classifier + metrics + sample predictions",
      },
      {
        label: "C",
        title: "Detection Mini",
        description: "Object/person detection demo + inference script",
      },
      {
        label: "Hub",
        title: "Portfolio monorepo",
        description: "README, run instructions, demo GIF",
      },
    ],
    tools: "Python · OpenCV · PyTorch · Jupyter · GitHub · Google Colab",
    audience:
      "Students and early-career learners with Python basics who want visible GitHub proof.",
    prerequisites: "Python basics · Jupyter or VS Code · No deep math required",
    trustLine:
      "Aligned in spirit with NASSCOM Concepts of Computer Vision (SSC/N8139). An applied weekend sprint.",
    ctaHeadline: "Ready to ship vision projects?",
  },
  "signal-lab": {
    id: "signal-lab",
    heroHeadline: "Analysts who ship get hired.",
    heroSubline: "8 live hours · 4 weekends",
    projectStory: "Student Success Predictor",
    uspChips: [
      "Every class ends in a commit",
      "Metrics that matter, not vanity accuracy",
      "Live prediction API by the end",
      "LinkedIn-ready demo day",
    ],
    learnings: [
      "Turn a business question into a clear ML problem statement and success metrics",
      "Why data quality matters and how poor data breaks models downstream",
      "Collect and merge data from CSV, APIs, and open datasets",
      "Exploratory analysis with the right charts and what to do with the insights",
      "Data cleaning, encoding, normalization, and stratified sampling",
      "Feature engineering basics that improve model signal",
      "Pick and train supervised models with scikit-learn",
      "Evaluate with accuracy, precision, recall, ROC-AUC, and confusion matrix",
      "Model interpretability at a practical level",
      "Deploy a model as a simple API and package the full workflow for GitHub",
    ],
    deliverables: [
      {
        label: "A",
        title: "Data Intake Lab",
        description: "Problem brief, merged data, EDA + cleaning pipeline",
      },
      {
        label: "B",
        title: "At-Risk Classifier",
        description: "Trained model, evaluation report, feature importance",
      },
      {
        label: "C",
        title: "Prediction API",
        description: "FastAPI endpoint returning at-risk probability",
      },
      {
        label: "Hub",
        title: "Portfolio monorepo",
        description: "README, metrics summary, demo GIF",
      },
    ],
    tools: "Python · pandas · scikit-learn · FastAPI · GitHub · Google Colab",
    audience:
      "Students and early-career learners with Python basics who want an end-to-end ML story on GitHub.",
    prerequisites: "Python basics · Jupyter or VS Code · No deep math required",
    trustLine:
      "Aligned in spirit with NASSCOM AI Machine Learning Analyst (SSC/Q8113). An applied weekend sprint.",
    ctaHeadline: "Ready to ship analyst-grade projects?",
  },
  "groundtruth-lab": {
    id: "groundtruth-lab",
    heroHeadline: "Models are only as good as their labels.",
    heroSubline: "8 live hours · 4 weekends",
    projectStory: "Campus Safety Labeling Kit",
    uspChips: [
      "Every class ends in a commit",
      "No ML degree required",
      "Labeled dataset + docs shipped",
      "Docs ML teams actually use",
    ],
    learnings: [
      "Why data annotation is the bottleneck in AI and how labels drive model accuracy",
      "Supervised vs unsupervised learning and when annotation matters",
      "Annotation types and which to use when",
      "Turn a project brief into a clear label taxonomy and guidelines",
      "Curate raw data: source, clean, organize, handle sensitive cases carefully",
      "Hands-on labeling with industry-standard tools",
      "Quality assurance: review workflows, class balance, spotting common label errors",
      "Validation basics and fixing bad labels before handoff",
      "Write annotation docs and an ML-ready handoff package",
      "Where AI-assisted tools speed labeling and where human review still matters",
      "Package annotation work as a public GitHub portfolio",
    ],
    deliverables: [
      {
        label: "A",
        title: "Annotation Brief & Taxonomy",
        description: "Project brief, label classes, tool setup",
      },
      {
        label: "B",
        title: "Labeled Dataset",
        description: "Labeled images in COCO or YOLO format + manifest",
      },
      {
        label: "C",
        title: "QA & Validation Kit",
        description: "Validation script, QA report, cleaned labels",
      },
      {
        label: "Hub",
        title: "Portfolio monorepo",
        description: "Guidelines, handoff report, demo GIF",
      },
    ],
    tools: "Label Studio · CVAT (overview) · Python · COCO / YOLO · GitHub · Google Sheets",
    audience:
      "Students and early-career learners entering AI data ops. No ML engineering background required.",
    prerequisites:
      "Basic computer literacy · spreadsheets & web tools · Python helpful later, not required to start",
    trustLine:
      "Aligned in spirit with NASSCOM Data Annotator (SSC/Q8120). An applied weekend sprint.",
    ecosystemLine:
      "Labels from this course can feed Frameworks Lab. Data flows into the detector pipeline.",
    ctaHeadline: "Ready to label like a pro?",
  },
  "research-fellowship": {
    id: "research-fellowship",
    heroHeadline: "This is not a course with a certificate stapled on.",
    heroSubline:
      "3 months · 30 students · 5 research groups · one problem that looks like research, not homework.",
    projectStory: "Research-grade portfolio",
    uspChips: [
      "Apply for Selection, not open enroll",
      "6 students · 1 mentor-led research problem",
      "End to end: data to model to eval to demo",
      "Publication-oriented output",
    ],
    premiumBlurb:
      "Students work in small research groups on real-world, publication-oriented AI projects under structured mentorship: literature review, experiments, comparative analysis, documentation, and a final research demo. The goal is something substantial to show. A research-grade project, a GitHub portfolio, a technical report, and a publication-oriented manuscript. Not another PDF certificate.",
    learnings: [
      "Formulate a research problem and find the gap in existing work",
      "Literature review and research methodology for AI projects",
      "End-to-end AI workflow from data processing to model development, evaluation, and demo",
      "Advanced skills across ML, deep learning, computer vision, and Generative AI by track",
      "Experiment design, baselines, comparative analysis, and honest evaluation",
      "Explainability where it matters for medical and agricultural vision",
      "Research documentation, GitHub craft, and demo-day presentation",
      "Structure a publication-oriented manuscript and prepare for submission guidance",
    ],
    deliverables: [
      {
        label: "Project",
        title: "Major research-grade AI project",
        description: "Your individual contribution inside a 6-person group",
      },
      {
        label: "Code",
        title: "Public GitHub repository",
        description: "Reproducible experiments and clean project structure",
      },
      {
        label: "Docs",
        title: "Technical project report",
        description: "Methodology, implementation, results",
      },
      {
        label: "Research",
        title: "Publication-oriented manuscript",
        description: "Literature review, experimental design, comparative analysis",
      },
      {
        label: "Demo",
        title: "Final demonstration",
        description: "Structured feedback on demo day",
      },
      {
        label: "Credentials",
        title: "Internship certificates",
        description: "3-month internship + project completion on successful evaluation",
      },
    ],
    researchTracks: [
      {
        title: "Healthcare AI",
        items: [
          "MedVision-AI: Explainable deep learning for medical image diagnosis",
          "HealthRisk-AI: Multimodal AI for early healthcare risk prediction",
        ],
      },
      {
        title: "AI for Agriculture",
        items: [
          "AgriVision-AI: Crop disease detection and severity assessment",
          "CropGuard-AI: Crop health and stress monitoring with computer vision",
        ],
      },
      {
        title: "Generative AI & LLM",
        items: [
          "RAGMed-AI: Domain RAG for healthcare with trustworthy GenAI",
          "ResearchCopilot-AI: LLM research assistant for literature and summarization",
        ],
      },
      {
        title: "Also available as group tracks",
        items: [
          "Computer Vision: advanced vision research aligned with Frameworks Lab depth",
          "Advanced AI / Research: stretch and cross-domain research problems",
        ],
      },
    ],
    programMonths: [
      {
        label: "Month 1",
        theme:
          "Research and foundation. Orientation, problem formulation, literature review, dataset, baseline, experimental protocol",
      },
      {
        label: "Month 2",
        theme:
          "AI development. Advanced models, experiments, tuning, comparative analysis, explainability, group meetings",
      },
      {
        label: "Month 3",
        theme:
          "Research and ship. Final experiments, analysis, manuscript prep, GitHub polish, Demo Day, evaluation, submission guidance",
      },
    ],
    liveTrainingLine:
      "48 hours of live weekend training across the program. Saturday and Sunday pulses reinforce concepts with immediate implementation inside your research group.",
    tools:
      "Python · PyTorch / TensorFlow · OpenCV · Jupyter · GitHub · Colab · domain stacks for medical/agri CV and RAG / LLM tooling",
    audience:
      "B.Tech / BCA / MCA / M.Tech students, undergraduate researchers, and anyone building a strong AI portfolio rather than collecting weekend certificates.",
    prerequisites:
      "Solid Python basics · comfort with ML fundamentals preferred · selection is application-based",
    trustLine:
      "Publication-oriented research and manuscript preparation with submission guidance.",
    honestyLines: [
      "We do not guarantee conference or journal acceptance.",
      "Seats are limited. Placement into a research group follows selection.",
    ],
    ecosystemLine:
      "Finished Frameworks Lab, Signal Lab, or Groundtruth Lab? Apply here as your research-grade next step.",
    ctaHeadline: "Six minds. One problem. Research that shows.",
  },
};

export function getLabCourseDetail(courseId: string): LabCourseDetail | null {
  return LAB_COURSE_DETAILS[courseId] ?? null;
}

export function getLabCourseDetailIds(): string[] {
  return Object.keys(LAB_COURSE_DETAILS);
}
