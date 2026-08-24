export type LabCourseDetail = {
  id: string;
  heroHeadline: string;
  heroSubline: string;
  projectStory: string;
  uspChips: string[];
  learnings: string[];
  deliverables: { label: string; title: string; description: string }[];
  arc: { week: string; theme: string }[];
  tools: string;
  audience: string;
  prerequisites: string;
  trustLine: string;
  ecosystemLine?: string;
  ctaHeadline: string;
  microcopy: string[];
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
      "Where computer vision shows up in industry (retail, health, mobility, manufacturing) and how those products are built end-to-end",
      "How to load, inspect, and organize image datasets for a real CV pipeline",
      "How to clean CV data: noise, outliers, normalization, balancing, train/val/test splits, light augmentation",
      "Core CV tasks: classification, localization, detection, segmentation — and which to pick when",
      "CNNs in practice (layers, ReLU, transfer learning) without drowning in math",
      "Train, evaluate, and lightly customize a model; peek inside predictions with activation/saliency maps",
      "How to package work as a public GitHub portfolio (README, demo GIF, structured folders, clear how-to-run)",
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
    arc: [
      { week: "1", theme: "See the problem — CV landscape, images as data" },
      { week: "2", theme: "Clean like a practitioner — prep, splits, augmentation" },
      { week: "3", theme: "Algorithms that ship — classification + detection" },
      { week: "4", theme: "Train, explain, ship — eval, interpretability, portfolio" },
    ],
    tools: "Python · OpenCV · PyTorch · Jupyter · GitHub · Google Colab",
    audience:
      "Students & early-career learners with Python basics who want visible GitHub proof.",
    prerequisites: "Python basics · Jupyter or VS Code · No deep math required",
    trustLine:
      "Aligned in spirit with NASSCOM Concepts of Computer Vision (SSC/N8139) — applied weekend sprint.",
    ctaHeadline: "Ready to ship vision projects?",
    microcopy: [
      "Commit #1 lands Week 1.",
      "Your README is the interview.",
      "Demo GIF > lecture slides.",
      "One domain. Four weekends. Three repos.",
    ],
  },
  "signal-lab": {
    id: "signal-lab",
    heroHeadline: "Analysts who ship get hired.",
    heroSubline: "8 live hours · 4 weekends",
    projectStory: "Student Success Predictor",
    uspChips: [
      "Every class ends in a commit",
      "Metrics that matter (not vanity accuracy)",
      "Live prediction API by the end",
      "LinkedIn-ready demo day",
    ],
    learnings: [
      "How to turn a business question into a clear ML problem statement and success metrics",
      "Why data quality matters and how poor data breaks models downstream",
      "How to collect and merge data from CSV, APIs, and open datasets",
      "Exploratory data analysis with the right charts — and what to do with the insights",
      "Data cleaning, encoding, normalization, and stratified sampling",
      "Feature engineering basics that improve model signal",
      "How to pick and train supervised models with scikit-learn",
      "Train and evaluate with accuracy, precision, recall, ROC-AUC, confusion matrix",
      "Model interpretability at a practical level (feature importance, SHAP/LIME peek)",
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
    arc: [
      { week: "1", theme: "Frame the problem — business → ML spec, data intake" },
      { week: "2", theme: "Understand and prepare — EDA, clean, encode, sample" },
      { week: "3", theme: "Model and ship — features, train, evaluate" },
      { week: "4", theme: "Explain and portfolio — interpret, deploy API, ship" },
    ],
    tools: "Python · pandas · scikit-learn · FastAPI · GitHub · Google Colab",
    audience:
      "Students & early-career learners with Python basics who want an end-to-end ML story on GitHub.",
    prerequisites: "Python basics · Jupyter or VS Code · No deep math required",
    trustLine:
      "Aligned in spirit with NASSCOM AI Machine Learning Analyst (SSC/Q8113) — applied weekend sprint.",
    ctaHeadline: "Ready to ship analyst-grade projects?",
    microcopy: [
      "Recall > vanity accuracy.",
      "Your API is the demo.",
      "Problem brief → model → deploy.",
      "Commit every weekend. Portfolio by Week 4.",
    ],
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
      "Why data annotation is the bottleneck in AI — and how labels drive model accuracy",
      "Supervised vs unsupervised learning — and when annotation matters",
      "Annotation types (boxes, polygons, tags, and more) — and which to use when",
      "How to turn a project brief into a clear label taxonomy and guidelines",
      "How to curate raw data: source, clean, organize, handle sensitive cases carefully",
      "Hands-on labeling with industry-standard tools (Label Studio; CVAT overview)",
      "Quality assurance: review workflows, class balance, spotting common label errors",
      "Validation basics and fixing bad labels before handoff",
      "How to write annotation docs and an ML-ready handoff package",
      "How AI-assisted tools speed labeling — and where human review still matters",
      "How to package annotation work as a public GitHub portfolio",
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
    arc: [
      { week: "1", theme: "Understand the work — annotation landscape, taxonomy, tools" },
      { week: "2", theme: "Curate and label — data prep + labeling sprint" },
      { week: "3", theme: "Quality and validation — QA, balance, fix & re-export" },
      { week: "4", theme: "Document and ship — guidelines, handoff, portfolio" },
    ],
    tools: "Label Studio · CVAT (overview) · Python · COCO / YOLO · GitHub · Google Sheets",
    audience:
      "Students & early-career learners entering AI data ops. No ML engineering background required.",
    prerequisites:
      "Basic computer literacy · spreadsheets & web tools · Python helpful later, not required to start",
    trustLine:
      "Aligned in spirit with NASSCOM Data Annotator (SSC/Q8120) — applied weekend sprint.",
    ecosystemLine:
      "Labels from this course can feed Frameworks Lab — data → detector pipeline.",
    ctaHeadline: "Ready to label like a pro?",
    microcopy: [
      "Tight boxes. Clean taxonomy. Happy ML engineers.",
      "Your guidelines are the product.",
      "No model without labels.",
      "Commit every weekend. Portfolio by Week 4.",
    ],
  },
};

export function getLabCourseDetail(courseId: string): LabCourseDetail | null {
  return LAB_COURSE_DETAILS[courseId] ?? null;
}

export function getLabCourseDetailIds(): string[] {
  return Object.keys(LAB_COURSE_DETAILS);
}
