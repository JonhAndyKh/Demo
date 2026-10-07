import { LegalList, LegalPageLayout, LegalSection } from "./LegalPage";

export default function PrivacyPolicy() {
  return (
    <LegalPageLayout title="Privacy Policy" eyebrow="KizoTopup privacy policy" showFooterLinks={false}>
      <p>
        KizoTopup cares about your privacy and security. This Privacy Policy explains how we handle information when you browse our store, place an order, contact support, or use our services.
      </p>

      <LegalSection title="1. Data privacy & security">
        <p>We do not share or sell your personal data, including your IP address, ID card information, or game user ID, to any third party. Sensitive data is stored using strong encryption technology, and access is limited strictly to internal systems for transaction verification and delivery.</p>
      </LegalSection>

      <LegalSection title="2. Data we collect">
        <LegalList>
          <li>User ID / Zone ID for top-up delivery</li>
          <li>Transaction history and payment method</li>
          <li>Device and browser information, such as IP address, operating system, and browser version</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="3. Children’s privacy">
        <p>Our services are not intended for children under 15 years old. We do not allow anyone under 15 to purchase products or register without parental consent. If we become aware of such use, the account may be suspended and a refund will be refused.</p>
      </LegalSection>

      <LegalSection title="4. Contact">
        <p>For privacy questions or support, contact us through Telegram at <a className="text-primary hover:underline" href="https://t.me/vindavit"> @vindavit</a> or email <a className="text-primary hover:underline" href="mailto:daviranzy@gmail.com">daviranzy@gmail.com</a>.</p>
      </LegalSection>
    </LegalPageLayout>
  );
}