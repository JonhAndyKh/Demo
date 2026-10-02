import { LegalList, LegalPageLayout, LegalSection } from "./LegalPage";

export default function AboutUs() {
  return (
    <LegalPageLayout
      title="About Us"
      eyebrow="About KizoTopUp"
      meta="Founded in 2026 · Cambodia"
      showFooterLinks={false}
    >
      <p>
        Welcome to <strong>KizoTopUp</strong>, a Cambodian game top-up platform created to make purchasing game credits easier, faster, and more affordable for gamers.
      </p>

      <LegalSection title="Our mission">
        <p>
          Our goal is simple: make game top-up easier, faster, and affordable for every gamer. KizoTopUp supports more than 70 games and continues to expand its selection so Cambodian gamers have more choices in one convenient place.
        </p>
      </LegalSection>

      <LegalSection title="Meet the founder">
        <p>
          <strong>Vin Davit</strong> is the founder of KizoTopUp, a Cambodian entrepreneur and student at Western University Cambodia, where he studies Marketing.
        </p>
        <p className="mt-3">
          KizoTopUp is currently operated and managed directly by Vin Davit. He is involved in the development, management, improvement, and day-to-day operation of the platform.
        </p>
      </LegalSection>

      <LegalSection title="Our story">
        <p>
          KizoTopUp began in 2026 with a simple idea: gaming top-ups should not be difficult. We wanted gamers to find their favorite game, choose a package, pay with familiar Cambodian payment methods, and receive their game credits quickly.
        </p>
        <p className="mt-3">
          From the beginning, the platform has been built and managed by Vin Davit with a focus on easy purchasing, fast service, and competitive prices.
        </p>
      </LegalSection>

      <LegalSection title="What we offer">
        <p>We provide digital game top-up services for popular titles including:</p>
        <LegalList>
          <li>Mobile Legends: Bang Bang</li>
          <li>Free Fire</li>
          <li>PUBG Mobile</li>
          <li>Zepto</li>
          <li>Delta Force</li>
          <li>Super Sus</li>
          <li>Growtopia</li>
          <li>Pixel Gun 3D</li>
          <li>Many more games as our catalog grows</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Built for Cambodian gamers">
        <p>
          KizoTopUp is designed with Cambodian gamers in mind. We support convenient local payment options including ABA, Wing, ACLEDA, TrueMoney, KHQR, and other supported Cambodian bank and payment services.
        </p>
      </LegalSection>

      <LegalSection title="Fast delivery and support">
        <p>
          We are focused on a fast and straightforward purchasing experience, from selecting a game and package to completing payment and receiving the top-up.
        </p>
        <p className="mt-3">
          If you need help, contact KizoTopUp through our official support channels on Telegram and Facebook. We aim to respond quickly and help resolve questions or problems clearly.
        </p>
        <p className="mt-3">
          Telegram support:{" "}
          <a className="text-primary hover:underline" href="https://t.me/vindavit" target="_blank" rel="noreferrer">
            @vindavit
          </a>
        </p>
      </LegalSection>

      <LegalSection title="Our vision and commitment">
        <p>
          Our vision is to build KizoTopUp into a trusted and convenient gaming platform for Cambodian gamers. We want gamers to have one place to find their games, choose a top-up package, pay conveniently, and receive their purchases quickly.
        </p>
        <p className="mt-3">
          KizoTopUp is still a new platform, and we are at the beginning of our journey. We focus on listening to customers, adding more games, improving the website, and building trust through our work.
        </p>
        <LegalList>
          <li>Fast and convenient service</li>
          <li>Easy purchasing</li>
          <li>Competitive prices</li>
          <li>Responsive customer support</li>
          <li>Continuous improvement</li>
          <li>Clear and transparent information</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Connect with KizoTopUp">
        <p>
          For game top-ups, support, and updates, visit{" "}
          <LinkText href="https://kizotopup.com">kizotopup.com</LinkText>, follow KizoTopUp on TikTok and Facebook, or contact us through{" "}
          <LinkText href="https://t.me/vindavit">@vindavit on Telegram</LinkText>.
        </p>
        <p className="mt-3 font-display font-bold text-white">
          Fast. Easy. Affordable. Built for Gamers.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}

function LinkText({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a className="text-primary hover:underline" href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}