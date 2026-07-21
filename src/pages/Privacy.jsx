import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import LegalPage from '../components/legal/LegalPage'

const CONTACT_EMAIL = 'futurifydesigns@gmail.com'

const sections = [
  {
    heading: 'Who we are (data controller)',
    body: [
      'Ntlo is a student accommodation platform operated by Futurify Designs ("Ntlo", "we", "us", "our"), based in Botswana. We act as the data controller for personal data processed through the Ntlo website and related services.',
      'This Privacy Policy explains what personal data we collect, why we process it, how we protect it, and the rights you have under Botswana\'s Data Protection Act, 2024 (Act No. 18 of 2024) ("the DPA").',
      'By creating an account or using Ntlo, you acknowledge this policy. Where the DPA requires consent for a specific processing activity (for example, optional cookies or analytics), we will ask for that consent separately and you may withdraw it at any time.',
    ],
  },
  {
    heading: 'Our commitment under the Data Protection Act, 2024',
    body: [
      'We process personal data in line with the principles of the DPA, including that processing must be:',
      {
        items: [
          'Lawful, fair, and transparent',
          'Collected for specified, explicit, and legitimate purposes (purpose limitation)',
          'Adequate, relevant, and limited to what is necessary (data minimisation)',
          'Accurate and kept up to date where appropriate',
          'Kept only for as long as needed for those purposes (storage limitation)',
          'Processed securely, with appropriate technical and organisational measures',
          'Handled with accountability — we are responsible for demonstrating compliance',
        ],
      },
      'We do not require you to consent to processing that is unnecessary for the service you request. Optional features (such as analytics cookies) are off by default until you opt in.',
    ],
  },
  {
    heading: 'Lawful bases for processing',
    body: [
      'Depending on the activity, we rely on one or more of the following lawful bases under the DPA:',
      {
        items: [
          'Contract: to create your account, show listings, enable contact between students and landlords, and provide the platform features you request.',
          'Legal obligation: where we must retain or disclose information to comply with Botswana law.',
          'Legitimate interests: to keep the platform secure, prevent fraud and abuse, improve reliability, and moderate content — balanced against your rights and expectations.',
          'Consent: for optional cookies/analytics, and where we ask you to agree to a specific non-essential use of your data. You can withdraw consent at any time without affecting processing that relies on another lawful basis.',
        ],
      },
    ],
  },
  {
    heading: 'Information we collect',
    body: [
      'We collect personal data that is necessary to operate Ntlo safely:',
      {
        items: [
          'Account details: name, email address, phone number, role (student or landlord), and password (stored in hashed form by our authentication provider).',
          'Profile details: for students, university and gender (where provided) so we can show relevant listings and apply platform rules.',
          'Listing information: for landlords, room details, area, city, approximate map location, price, photos, amenities, and contact number published on the listing.',
          'Verification documents: for landlords, identity and property-related documents (for example Omang / National ID, selfie with ID, proof of ownership or authority). These may include sensitive personal data and are used only for trust and safety verification.',
          'Housing workflow data: applications, viewing requests, messages or status updates needed to run the student–landlord flow.',
          'Billing / subscription data: where a landlord chooses a paid plan, payment or receipt information needed to manage that plan.',
          'Technical and usage data: IP address and basic device/browser information as needed for security; page views if you opt in to analytics cookies.',
          'Cookies and similar technologies: see the Cookies section below.',
        ],
      },
    ],
  },
  {
    heading: 'Sensitive personal data',
    body: [
      'Some landlord verification documents (such as National ID images) may constitute sensitive personal data under the DPA. We process this data only where necessary for identity and property verification to protect students from fraud, and with appropriate access controls.',
      'Verification documents are private. They are accessible only to you and authorised Ntlo administrators reviewing your account. They are never shown publicly on listings.',
    ],
  },
  {
    heading: 'How we use your information',
    body: [
      'We use personal data to:',
      {
        items: [
          'Create and manage accounts and keep you signed in securely.',
          'Show students relevant listings near their university and calculate distance to campus.',
          'Let students contact landlords (for example via WhatsApp) about a listing.',
          'Verify landlord identity and property authority, and display trust / verification status where appropriate.',
          'Operate applications, viewing requests, notifications, and support.',
          'Process landlord subscription or billing features where applicable.',
          'Protect the platform, prevent abuse, enforce our Terms and Guidelines, and respond to legal requests.',
          'Improve Ntlo — including optional first-party analytics if you consent.',
        ],
      },
      'We do not sell your personal data.',
    ],
  },
  {
    heading: 'Google sign-in',
    body: [
      'If you sign in with Google, we receive basic Google profile information (typically name, email address, and profile picture) to create or access your Ntlo account.',
      'We do not post to your Google account and we do not access your contacts, Drive files, or other Google data beyond what Google provides for sign-in.',
    ],
  },
  {
    heading: 'How we share information',
    body: [
      'We share personal data only where necessary:',
      {
        items: [
          'Between users: listing details and the landlord contact number you publish are visible to students; when a student contacts a landlord, they share what they choose to send.',
          'Service providers (processors): we use trusted providers to host and run Ntlo — including Supabase (database, authentication, file storage) and Google Maps (map display and geocoding). They process data on our instructions and must protect it appropriately.',
          'Legal and safety: if required by law, regulation, court order, or to protect the rights, safety, or security of users or the public.',
        ],
      },
    ],
  },
  {
    heading: 'Cross-border transfers',
    body: [
      'Some of our service providers may process or store data on servers outside Botswana. Where personal data is transferred internationally, we take steps consistent with the DPA — including using reputable providers, contractual safeguards where available, and limiting transfers to what is needed to operate the service.',
      'By using Ntlo, you understand that account and listing data may be processed by these providers. For optional analytics cookies, we only enable them after you consent.',
    ],
  },
  {
    heading: 'Retention',
    body: [
      'We keep personal data only for as long as needed for the purposes described in this policy, or as required by law:',
      {
        items: [
          'Account and profile data: while your account is active, and for a reasonable period after closure if needed for security, dispute resolution, or legal obligations.',
          'Listings and related housing records: while the listing is active and for a period afterwards needed for moderation, disputes, or audit.',
          'Verification documents: for as long as needed to complete verification and thereafter only as long as reasonably required for trust, safety, and compliance — then deleted or securely disposed of.',
          'Cookie consent records: stored in your browser so we can honour your choices.',
          'Analytics events (if enabled): kept in your browser queue on a limited basis and not sold to advertisers.',
        ],
      },
    ],
  },
  {
    heading: 'Security',
    body: [
      'We use technical and organisational measures appropriate to the risk, including encrypted connections (HTTPS), authentication controls, and Supabase row-level security so users generally only access their own data (administrators have limited access for moderation and verification).',
      'Verification documents are stored in private storage and accessed via temporary, expiring links. No method of transmission or storage is completely secure; please use a strong password and keep your login details private.',
    ],
  },
  {
    heading: 'Your rights under the DPA',
    body: [
      'Subject to the conditions and exceptions in the Data Protection Act, 2024, you may have the right to:',
      {
        items: [
          'Be informed about how your personal data is processed (this policy)',
          'Access personal data we hold about you',
          'Request rectification of inaccurate or incomplete data',
          'Request erasure ("right to be forgotten") where applicable',
          'Object to certain processing, or withdraw consent where processing is based on consent',
          'Not be subject to a decision based solely on automated processing that significantly affects you, where the DPA so provides',
        ],
      },
      'You can update much of your profile information directly in your account. To exercise other rights, or to request account deletion, email us at the contact address below. We may need to verify your identity before responding. We aim to respond within a reasonable time consistent with the DPA.',
      'If you are not satisfied with our response, you may lodge a complaint with Botswana\'s Information and Data Protection Commission (or the competent data protection authority under the DPA).',
    ],
  },
  {
    heading: 'Cookies and similar technologies',
    body: [
      'We use cookies and similar storage in your browser as follows:',
      {
        items: [
          'Essential: required for sign-in, security, and remembering your cookie consent choice. These do not require opt-in consent because the service cannot function without them.',
          'Functional (optional): remembers language and accessibility preferences across visits. Off until you opt in.',
          'Analytics (optional): first-party page-view insights to improve Ntlo. Off until you opt in. We do not use third-party advertising trackers.',
        ],
      },
      <>
        You can accept all, allow essential only, or manage categories via the cookie banner and the{' '}
        <span className="font-semibold text-primary">Cookie settings</span> link in the footer. Withdrawing optional consent does not affect essential cookies needed for the site to work. See also our{' '}
        <Link to="/terms" className="font-semibold text-accent hover:underline">Terms of Service</Link>.
      </>,
    ],
  },
  {
    heading: 'Children and young people',
    body: [
      'Ntlo is intended for university students and adults. You must be at least 18 years old (or the age of majority in Botswana) to create an account. We do not knowingly collect personal data from children under 18. If you believe a child has provided us with personal data, contact us and we will take appropriate steps to delete it.',
    ],
  },
  {
    heading: 'Direct marketing',
    body: [
      'We do not sell your contact details for third-party marketing. If we ever send promotional messages about Ntlo, we will do so in line with the DPA and provide a clear way to opt out.',
    ],
  },
  {
    heading: 'Automated decision-making',
    body: [
      'Ntlo uses rules and admin review for features such as listing approval and verification status. Significant account or verification decisions are not made solely by automated profiling without human involvement where that would conflict with the DPA.',
    ],
  },
  {
    heading: 'Changes to this policy',
    body: [
      'We may update this Privacy Policy to reflect changes in law, our services, or our practices. When we do, we will revise the "Last updated" date at the top of this page. Material changes may also be highlighted on the platform or via email where appropriate.',
    ],
  },
  {
    heading: 'Contact us (privacy & data protection)',
    body: [
      <>
        For privacy questions, data subject requests (access, correction, deletion, withdrawal of consent), or complaints about how we handle personal data, contact Futurify Designs at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-accent hover:underline">
          {CONTACT_EMAIL}
        </a>
        . Please include enough detail for us to identify your account and request.
      </>,
    ],
  },
]

export default function Privacy() {
  return (
    <LegalPage
      icon={ShieldCheck}
      title="Privacy Policy"
      updated="21 July 2026"
      intro="This policy describes how Ntlo collects, uses, stores, and protects personal data in accordance with Botswana's Data Protection Act, 2024, when you use our student accommodation platform."
      sections={sections}
      contactEmail={CONTACT_EMAIL}
      contactNote="For data protection requests under the DPA (access, correction, erasure, or withdrawal of consent), email us with the subject line “Data protection request”."
    />
  )
}
