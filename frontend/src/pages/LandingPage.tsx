import { Link, Navigate } from "react-router-dom";
import { useOnboarding } from "../state/OnboardingContext";
import { AppShell } from "../components/layout/AppShell";
import BlurText from "../components/reactbits/BlurText";
import ScrollReveal from "../components/reactbits/ScrollReveal";
import AccordionGallery from "../components/reactbits/AccordionGallery";
import "./LandingPage.css";

// Structural placeholders only — swap the `image` URLs for real campus
// photography whenever it's available. Everything else (layout, motion,
// captions) is already wired up; only this array needs to change.
const GALLERY_ITEMS = [
  { image: "https://picsum.photos/id/1074/900/1200", label: "Campus Grounds" },
  { image: "https://picsum.photos/id/1067/900/1200", label: "Library" },
  { image: "https://picsum.photos/id/1048/900/1200", label: "Moot Court Hall" },
  { image: "https://picsum.photos/id/1076/900/1200", label: "Auditorium" },
  { image: "https://picsum.photos/id/1080/900/1200", label: "Student Life" },
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
    answer: "No — once your application is submitted, it is reviewed as final and locked from further edits.",
  },
];

export function LandingPage() {
  const { userId } = useOnboarding();

  // This page is public-only, by design: an authenticated user is sent
  // straight to their application home instead, so no applicant-specific
  // data (name, ID, progress, payment) can ever end up rendered here.
  if (userId !== null) {
    return <Navigate to="/home" replace />;
  }

  return (
    <AppShell>
      {/* ---------------------------------------------------------- Hero */}
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
            Register, complete your application in a few guided steps, and track your submission
            and payment — all in one place.
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
        <div className="hero__media media-placeholder" aria-hidden="true">
          <span>Campus image placeholder</span>
        </div>
      </section>

      {/* ------------------------------------------------------ About SLAT */}
      <section className="editorial-section">
        <div className="editorial-section__media media-placeholder" aria-hidden="true">
          <span>Institution image placeholder</span>
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
        </div>
      </section>

      {/* ------------------------------------------------- How it works */}
      <section className="process-section">
        <p className="section-eyebrow section-eyebrow--center">The Process</p>
        <h2 className="process-section__heading">How Your Application Works</h2>
        <ol className="process-list">
          {PROCESS_STEPS.map((step, index) => (
            <li key={step.title} className="process-list__item">
              <span className="process-list__index" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="process-list__title">{step.title}</h3>
                <p className="process-list__description">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* --------------------------------------------------------- Gallery */}
      <section className="gallery-section">
        <p className="section-eyebrow section-eyebrow--center">Campus Life</p>
        <h2 className="gallery-section__heading">A Glimpse of Campus</h2>
        <p className="gallery-section__note">
          Photography to be added — hover or focus a panel to explore.
        </p>
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

      {/* ----------------------------------------------------- Before you begin */}
      <section className="key-info-section">
        <h2>Before You Begin</h2>
        <ul className="key-info-list">
          <li className="key-info-list__item">
            <span className="key-info-list__label">Documents needed</span>
            <span className="key-info-list__value">Recent passport-style photo (JPG/PNG, under 2 MB)</span>
          </li>
          <li className="key-info-list__item">
            <span className="key-info-list__label">Registration fee</span>
            <span className="key-info-list__value">Confirmed at payment, after submission</span>
          </li>
          <li className="key-info-list__item">
            <span className="key-info-list__label">Test dates & centres</span>
            <span className="key-info-list__value">Shown live during the application process</span>
          </li>
        </ul>
      </section>

      {/* -------------------------------------------------------------- FAQ */}
      <section className="faq-section">
        <p className="section-eyebrow section-eyebrow--center">Frequently Asked Questions</p>
        <h2 className="faq-section__heading">Common Questions</h2>
        <div className="faq-list">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="faq-item">
              <summary className="faq-item__question">{item.question}</summary>
              <p className="faq-item__answer">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </AppShell>
  );
}