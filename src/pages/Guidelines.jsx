import { Users } from 'lucide-react'
import LegalPage from '../components/legal/LegalPage'

const CONTACT_EMAIL = 'futurifydesigns@gmail.com'

const sections = [
  {
    heading: 'Our community promise',
    body: [
      'Ntlo connects students and landlords across Botswana. Everyone on the platform deserves to feel safe, respected, and treated fairly. These community guidelines explain how we expect you to behave — whether you are browsing for a room, listing a property, or messaging another user.',
      'Following these guidelines helps keep Ntlo trustworthy for students looking for accommodation and for landlords who list honestly.',
    ],
  },
  {
    heading: 'For everyone',
    body: [
      'Treat others with respect. Do not harass, threaten, discriminate against, or abuse anyone on Ntlo.',
      {
        items: [
          'Use your real identity and keep your profile information accurate.',
          'Communicate honestly — do not mislead people about availability, price, or intentions.',
          'Do not share another person’s private information without their consent.',
          'Report suspicious listings, fake profiles, or abusive behaviour to us.',
          'Do not attempt to scam, spam, or manipulate other users.',
        ],
      },
    ],
  },
  {
    heading: 'For students',
    body: [
      {
        items: [
          'Only submit applications and viewing requests you genuinely intend to follow through on.',
          'If your plans change, withdraw promptly and give a clear reason so landlords are not left waiting.',
          'Inspect a property in person and confirm details with the landlord before paying any deposit or rent.',
          'Leave fair, honest reviews based on your actual experience.',
          'Do not use Ntlo to collect landlord contact details for unrelated marketing or resale.',
        ],
      },
    ],
  },
  {
    heading: 'For landlords',
    body: [
      {
        items: [
          'List only real accommodation you have the legal right to rent out.',
          'Keep photos, prices, availability, and descriptions accurate and up to date.',
          'Complete verification honestly — do not submit forged or borrowed documents.',
          'Respond to applications and viewing requests in a reasonable time.',
          'Do not discriminate against students on the basis of ethnicity, gender, religion, disability, or other protected characteristics.',
          'Remove or mark listings unavailable as soon as a room is no longer on offer.',
        ],
      },
    ],
  },
  {
    heading: 'Listings and messaging',
    body: [
      'All listing content and messages must comply with our Terms of Service. In particular:',
      {
        items: [
          'No fake, duplicate, or misleading listings.',
          'No stolen or heavily edited photos that misrepresent the property.',
          'No offensive, illegal, or sexually explicit content.',
          'No off-platform payment demands before a student has had a fair chance to view the property.',
        ],
      },
      'We may remove content or restrict accounts that break these rules.',
    ],
  },
  {
    heading: 'Verification and trust badges',
    body: [
      'Verification helps students identify landlords and listings that have passed our review. A verified badge is a trust signal at a point in time — not a guarantee of future behaviour.',
      'Submitting false verification documents, impersonating another property owner, or repeatedly failing review after warnings may result in account suspension.',
    ],
  },
  {
    heading: 'Enforcement',
    body: [
      'When we find a violation, we may take one or more of the following steps:',
      {
        items: [
          'Request changes to a listing or verification documents.',
          'Remove a listing from the platform.',
          'Issue a temporary account suspension with a clear reason and end date.',
          'Permanently ban accounts for serious or repeated violations.',
        ],
      },
      'If your account was suspended and has since been lifted, please read any message from our team carefully and follow these guidelines going forward. Further violations may lead to a longer suspension or a permanent ban.',
    ],
  },
  {
    heading: 'Reporting problems',
    body: [
      'If you see something that does not belong on Ntlo — a suspicious listing, abusive messages, or a user behaving dishonestly — contact us at the email below. Include as much detail as you can (listing link, screenshots, dates).',
      'We review reports as quickly as we can and may follow up for more information.',
    ],
  },
  {
    heading: 'Related policies',
    body: [
      'These guidelines work alongside our Terms of Service and Privacy Policy. By using Ntlo you agree to all of them. If anything here conflicts with the Terms, the Terms take precedence.',
    ],
  },
]

export default function Guidelines() {
  return (
    <LegalPage
      icon={Users}
      title="Ntlo Community Guidelines"
      updated="30 May 2026"
      intro="These guidelines set the standard for respectful, honest behaviour on Ntlo. They apply to every student, landlord, and visitor using the platform."
      sections={sections}
      contactEmail={CONTACT_EMAIL}
    />
  )
}
