import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PageShell from '../../../components/layout/PageShell/PageShell';
import Container from '../../../components/layout/Container/Container';
import IconWrapper from '../../../components/common/IconWrapper/IconWrapper';
import styles from './Landing.module.css';

const services = [
  {
    icon: 'tools',
    label: 'Repair',
    title: 'More life. Less waste.',
    text: 'Connect with a repair partner and give your everyday electronics another chance.',
  },
  {
    icon: 'recycle',
    label: 'Recycle',
    title: 'A better way to let go.',
    text: 'Arrange recycling for devices that have reached the end of their useful life.',
  },
  {
    icon: 'gift',
    label: 'Rewards',
    title: 'Small actions add up.',
    text: 'Earn points from eligible activity and explore rewards in your account.',
  },
];

export function LandingPage() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const timer = setTimeout(
      () =>
        document
          .getElementById(hash.slice(1))
          ?.scrollIntoView({ behavior: 'smooth' }),
      80,
    );
    return () => clearTimeout(timer);
  }, [hash]);
  return (
    <PageShell>
      <section className={styles.hero} id="home">
        <Container size="lg">
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}>
                <span className={styles.liveDot} /> A SMALL CHANGE. A LONGER
                LIFE.
              </span>
              <h1>
                Good tech deserves
                <br />a <span>second life.</span>
              </h1>
              <p>
                That old phone still has a story. Find out whether to repair or
                recycle it, connect with a partner, and take the next step.
              </p>
              <div className={styles.actions}>
                <Link to="/user/assessment" className={styles.primary}>
                  Assess my device <IconWrapper name="arrow-right" size={19} />
                </Link>
                <a href="#how-it-works" className={styles.secondary}>
                  See how it works <span aria-hidden="true">↗</span>
                </a>
              </div>
              <div className={styles.heroFoot}>
                <IconWrapper name="shield" size={18} /> One place for
                assessment, booking, and tracking.
              </div>
            </div>
            <div
              className={styles.visual}
              role="img"
              aria-label="Illustration of a phone getting a second life"
            >
              <div className={styles.orbit} />
              <div className={styles.orbitInner} />
              <div className={styles.device} aria-hidden="true">
                <div className={styles.speaker} />
                <div className={styles.deviceTop}>
                  <span>vestige.</span>
                  <span>•••</span>
                </div>
                <div className={styles.leaf}>
                  <svg viewBox="0 0 100 100" fill="none">
                    <path
                      d="M76 20C79 57 61 79 32 69C18 42 41 23 76 20Z"
                      fill="currentColor"
                    />
                    <path
                      d="M23 79L59 43"
                      stroke="#d7f5a4"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <span className={styles.deviceKicker}>
                  MAKE ROOM FOR POSSIBILITY
                </span>
                <strong>
                  A fresh start
                  <br />
                  for your device.
                </strong>
                <div className={styles.deviceActions}>
                  <span>Repair</span>
                  <span>Recycle</span>
                </div>
                <div className={styles.homeBar} />
              </div>
              <div className={`${styles.floatingCard} ${styles.repairCard}`}>
                <span className={styles.tileIcon}>
                  <IconWrapper name="tools" size={22} />
                </span>
                <div>
                  <strong>Repair. Reuse. Repeat.</strong>
                  <span>Keep good technology going.</span>
                </div>
              </div>
              <div className={`${styles.floatingCard} ${styles.recycleCard}`}>
                <span className={styles.tileIcon}>
                  <IconWrapper name="recycle" size={22} />
                </span>
                <div>
                  <strong>Better choices, together.</strong>
                  <span>Every device has a next step.</span>
                </div>
              </div>
              <span className={styles.visualNote}>
                A little care goes a long way.
              </span>
            </div>
          </div>
          <div className={styles.deviceStrip}>
            <span>BIG POSSIBILITIES. EVERYDAY DEVICES.</span>
            <div>
              Smartphones <span>·</span> Laptops <span>·</span> Tablets{' '}
              <span>·</span> Electronics
            </div>
          </div>
        </Container>
      </section>
      <section className={styles.section} id="how-it-works">
        <Container size="lg">
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.eyebrow}>
                FROM YOUR PHONE, FOR THE PLANET
              </span>
              <h2>
                Your next step,
                <br />
                made simple.
              </h2>
            </div>
            <p>
              No more guessing what to do with old electronics. Follow a clear
              path from assessment to action.
            </p>
          </div>
          <div className={styles.steps}>
            {[
              [
                '01',
                'Tell us about your device',
                'Share its age, condition, and repair costs. Our assessment helps you understand your options.',
              ],
              [
                '02',
                'Choose a way forward',
                'Review the repair or recycle suggestion and book a service with a vendor.',
              ],
              [
                '03',
                'Follow every step',
                'Check progress from your phone and view rewards earned from eligible completed activity.',
              ],
            ].map(([number, title, description]) => (
              <article className={styles.step} key={number}>
                <span className={styles.stepNumber}>{number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>
      <section className={styles.services} id="services">
        <Container size="lg">
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.eyebrow}>
                ONE PLATFORM. MORE POSSIBILITIES.
              </span>
              <h2>Find the right next chapter.</h2>
            </div>
            <Link to="/portals" className={styles.textLink}>
              Explore your portal <IconWrapper name="arrow-right" size={18} />
            </Link>
          </div>
          <div className={styles.serviceGrid}>
            {services.map((service) => (
              <Link
                to="/login/user"
                key={service.label}
                className={styles.serviceCard}
              >
                <div className={styles.serviceTop}>
                  <span className={styles.serviceIcon}>
                    <IconWrapper name={service.icon} size={25} />
                  </span>
                  <span>{service.label}</span>
                  <IconWrapper name="arrow-right" size={21} />
                </div>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </Link>
            ))}
          </div>
        </Container>
      </section>
      <section className={styles.section} id="about">
        <Container size="lg">
          <div className={styles.mission} id="impact">
            <div>
              <span className={styles.eyebrow}>
                BUILT FOR A MORE CIRCULAR FUTURE
              </span>
              <h2>
                Less in the drawer.
                <br />
                More out of your tech.
              </h2>
            </div>
            <div>
              <p>
                We bring device owners, repair experts, and recycling partners
                together. Our goal is simple: help useful technology stay
                useful, and make the next step easier when it is time to move
                on.
              </p>
              <div className={styles.missionTags}>
                <span>Repair before replacing</span>
                <span>Track your requests</span>
                <span>Choose responsible reuse</span>
              </div>
            </div>
          </div>
        </Container>
      </section>
      <section className={styles.ctaSection}>
        <Container size="lg">
          <div className={styles.ctaPanel}>
            <div>
              <span className={styles.eyebrow}>START WITH ONE DEVICE</span>
              <h2>
                Your old tech.
                <br />A new possibility.
              </h2>
            </div>
            <Link to="/user/assessment" className={styles.lightButton}>
              Find my next step <IconWrapper name="arrow-right" size={20} />
            </Link>
          </div>
        </Container>
      </section>
    </PageShell>
  );
}
export default LandingPage;
