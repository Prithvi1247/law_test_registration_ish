import { Link, Navigate } from "react-router-dom";
import { useOnboarding } from "../state/OnboardingContext";
import { AppShell } from "../components/layout/AppShell";
import BlurText from "../components/reactbits/BlurText";
import ScrollReveal from "../components/reactbits/ScrollReveal";
import AccordionGallery from "../components/reactbits/AccordionGallery";
import "./LandingPage.css";

const GALLERY_ITEMS = [
  { image: "/src/images/gallery/courtroom.png", label: "Moot Court Hall" },
  { image: "/src/images/gallery/library.png", label: "Library" },
  { image: "/src/images/gallery/campus.png", label: "Campus" },
  { image: "/src/images/gallery/audi.png", label: "Auditorium" },
  { image: "/src/images/gallery/campuslife.png", label: "Student Life" },
];

const QUICK_FACTS = [
  { value: "6", label: "guided steps in the application form" },
  { value: "Auto-save", label: "pick up where you left off" },
  { value: "OTP", label: "one-time code verifies your account" },
  { value: "Online", label: "fee payment from your dashboard" },
];

const PORTAL_TASKS = [
  "Register and verify your account",
  "Choose your test date and centre",
  "Upload your photo and review your details",
  "Submit and pay your registration fee",
];

const PROCESS_STEPS = [
  {
    title: "Register & verify",
    description:
      "Create your account with your email and mobile number, then verify it with a one-time code.",
  },
  {
    title: "Complete your application",
    description:
      "Fill in your personal details, education, test date, test centre preferences, and photo across a short, guided form. Progress is saved as you go.",
  },
  {
    title: "Review & submit",
    description:
      "Check every section on one screen before submitting. Once submitted, your application is locked.",
  },
  {
    title: "Pay & confirm",
    description:
      "Complete your registration payment from the payment dashboard to finish the process.",
  },
];

const KEY_INFO = [
  {
    label: "Documents needed",
    value: "Recent passport-style photo",
    detail: "JPG or PNG, under 2 MB",
  },
  {
    label: "Registration fee",
    value: "Confirmed at payment",
    detail: "Shown after you submit your application",
  },
  {
    label: "Test dates & centres",
    value: "Shown live",
    detail: "Choose them during the application",
  },
];

const FAQ_ITEMS = [
  {
    question: "How do I start my application?",
    answer:
      "Register with your email and mobile number, verify your account with the code we send you, then complete the six-step application form.",
  },
  {
    question: "Can I save my progress and finish later?",
    answer:
      "Yes. Your application is saved as you complete each section — log back in anytime before submitting to continue where you left off.",
  },
  {
    question: "When and how do I pay the registration fee?",
    answer:
      "After you submit your application, you'll be guided to the payment dashboard, where the fee breakdown and available payment methods are shown.",
  },
  {
    question: "Can I edit my application after submitting it?",
    answer:
      "No — once your application is submitted, it is reviewed as final and locked from further edits.",
  },
];

export function LandingPage() {
  const { userId } = useOnboarding();

  // Public-only page: authenticated users go straight to their application home.
  if (userId !== null) {
    return <Navigate to="/home" replace />;
  }

  return (
    <AppShell>
      {/* Hero */}
      <section className="hero">
        <div className="hero__copy">
          <p className="hero__eyebrow">Official Admission Portal</p>
          <BlurText
            text="Begin Your SLAT Admission Journey"
            className="hero__heading"
            animateBy="words"
            direction="top"
            delay={90}
          />
          <p className="hero__lede">
            Register, complete your application in a few guided steps, and track your
            submission and payment — all in one place.
          </p>
          <div className="hero__actions">
            <Link to="/register" className="btn btn-primary btn-shine">
              Apply Now
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Already Registered — Log In
            </Link>
          </div>
        </div>

        <div className="hero__media">
          <img src="/src/images/hero.png" alt="SLAT students in the moot court hall" className="hero__image" />
          {/* <div className="hero__badge">
            <strong>Your progress is saved</strong>
            <span>Finish your application at your own pace.</span>
          </div> */}
        </div>
      </section>

      {/* Quick facts */}
      <section className="facts" aria-label="Application at a glance">
        {QUICK_FACTS.map((fact) => (
          <div key={fact.label} className="facts__item">
            <span className="facts__value">{fact.value}</span>
            <span className="facts__label">{fact.label}</span>
          </div>
        ))}
      </section>

      {/* About */}
      <section className="editorial-section">
        <div className="editorial-section__media">
          <img src="/src/images/gallery/campus.png" alt="" className="editorial-section__image" />
        </div>
        <div className="editorial-section__copy">
          <p className="section-eyebrow">About the Examination</p>
          <ScrollReveal
            containerClassName="about-slat-reveal"
            textClassName="about-slat-reveal__text"
            baseOpacity={0.15}
            baseRotation={2}
            blurStrength={6}
          >
            SLAT is the entrance examination for admission to undergraduate and postgraduate law
            programmes.
          </ScrollReveal>
          <p className="editorial-section__note">
            This portal is where you register, complete your application, choose your test date
            and centre, and manage your submission and payment from start to finish.
          </p>
          <ul className="task-list">
            {PORTAL_TASKS.map((task) => (
              <li key={task} className="task-list__item">
                {task}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Process */}
      <section className="process-section">
        <p className="section-eyebrow section-eyebrow--center">The Process</p>
        <h2 className="process-section__heading">How Your Application Works</h2>
        <ol className="process-list">
          {PROCESS_STEPS.map((step, index) => (
            <li key={step.title} className="process-list__item">
              <span className="process-list__index" aria-hidden="true">
                {index + 1}
              </span>
              <h3 className="process-list__title">{step.title}</h3>
              <p className="process-list__description">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Gallery */}
      <section className="gallery-section">
        <p className="section-eyebrow section-eyebrow--center">Campus Life</p>
        <h2 className="gallery-section__heading">A Glimpse of Campus</h2>
        <p className="gallery-section__note">Hover or focus a panel to explore.</p>
        <AccordionGallery
          items={GALLERY_ITEMS}
          defaultIndex={2}
          accentColor="#b0913f"
          overlayColor="#0c1830"
          textColor="#ffffff"
          height={420}
          radius={12}
        />
      </section>

      {/* Before you begin */}
      <section className="key-info-section">
        <h2>Before You Begin</h2>
        <ul className="key-info-list">
          {KEY_INFO.map((info) => (
            <li key={info.label} className="key-info-list__item">
              <span className="key-info-list__label">{info.label}</span>
              <span className="key-info-list__value">{info.value}</span>
              <span className="key-info-list__detail">{info.detail}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section className="faq-section">
        <div className="faq-section__intro">
          <p className="section-eyebrow">Frequently Asked Questions</p>
          <h2 className="faq-section__heading">Common Questions</h2>
          <p className="faq-section__text">
            Everything you need to know before you start. Ready to begin? It takes a few minutes
            to register.
          </p>
          <Link to="/register" className="btn btn-primary">
            Create your account
          </Link>
        </div>
        <div className="faq-list">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="faq-item">
              <summary className="faq-item__question">{item.question}</summary>
              <p className="faq-item__answer">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Closing call to action */}
      <section className="cta-band">
        <div>
          <h2 className="cta-band__heading">Start your application today</h2>
          <p className="cta-band__text">Register, verify, and begin. Your progress is saved as you go.</p>
        </div>
        <div className="cta-band__actions">
          <Link to="/register" className="btn cta-band__primary">
            Apply Now
          </Link>
          <Link to="/login" className="cta-band__link">
            Log in
          </Link>
        </div>
      </section>
    </AppShell>
  );
}