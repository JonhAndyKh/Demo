import { LegalList, LegalPageLayout, LegalSection } from "./LegalPage";

export default function TermsOfService() {
  return (
    <LegalPageLayout title="Terms of Service" eyebrow="Using KizoTopup" showFooterLinks={false}>
      <p>
        By using KizoTopup, you agree to the terms, refund policies, and privacy practices listed below.
      </p>

      <LegalSection title="1. Our services">
        <p>KizoTopup offers instant and secure digital services including:</p>
        <LegalList>
          <li>Game top-ups, including Mobile Legends, Free Fire, PUBG, and other games</li>
          <li>Redeem codes and account activation keys</li>
          <li>Gift cards and prepaid items</li>
          <li>Voucher promotions and event-based packages</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="2. Payment & delivery">
        <p>We support all banks in Cambodia via KHQR (Bakong), providing instant nationwide payment. Once payment is confirmed, your item is usually delivered within seconds to 10 minutes. In rare cases of system delay or manual review, delivery may take up to 4 hours. After successful delivery, such as diamonds being added or a code being issued, no refunds or cancellations are allowed.</p>
      </LegalSection>

      <LegalSection title="3. Refund & dispute policy">
        <p>We understand that issues can happen. You can request a refund if you successfully paid but did not receive your product after 4 hours, or if there is a system error, duplicate payment, or item mismatch caused by our platform.</p>
        <p className="mt-3">You cannot request a refund if your order was delivered successfully, you entered the wrong User ID / Zone ID / Game ID, you changed your mind after paying, or you misused or shared a redeem code and it became invalid.</p>
      </LegalSection>

      <LegalSection title="4. Refund processing time">
        <p>Valid refund requests will be processed within 1 to 48 hours. We reserve the right to verify any claim before approval. Refunds are only issued through the original payment method.</p>
      </LegalSection>

      <LegalSection title="5. Video verification requirement">
        <p>When fraud, abuse, or unusual activity is suspected, we may require verification via video. You may be asked to use your front camera, hold your ID card or student card visibly, speak clearly to describe the issue, and submit the video to our support team. No refund, dispute, or claim will proceed without proper verification if your account is flagged for suspicious behavior.</p>
      </LegalSection>

      <LegalSection title="6. Game publisher rules">
        <p>We partner with several authorized distributors and digital publishers. If abuse or suspicious activity is detected, your game account may be suspended or banned by the publisher. We are not responsible for account penalties caused by the publisher’s own terms. Fake screenshots, duplicated claims, or chargebacks may result in blacklisting from our platform.</p>
      </LegalSection>

      <LegalSection title="7. Contact us">
        <p>For customer support, contact us on Telegram at <a className="text-primary hover:underline" href="https://t.me/vindavit">@vindavit</a>, email <a className="text-primary hover:underline" href="mailto:daviranzy@gmail.com">daviranzy@gmail.com</a>, or visit our support page. Our head office is in Russei Keo, Cambodia.</p>
      </LegalSection>

      <LegalSection title="8. Legal & ownership">
        <p>All logos, brand names, and trademarks belong to their respective owners. KizoTopup is an independent digital service provider and is not affiliated with any game publishers unless officially stated.</p>
      </LegalSection>
    </LegalPageLayout>
  );
}