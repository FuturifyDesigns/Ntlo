import { FileText } from 'lucide-react'
import LegalPage from '../components/legal/LegalPage'

const CONTACT_EMAIL = 'futurifydesigns@gmail.com'

const sections = [
  {
    heading: 'Acceptance of terms',
    body: [
      'These Terms of Service ("Terms") govern your use of Ntlo, a student accommodation platform operated by Futurify Designs ("Ntlo", "we", "us"). By creating an account or using the platform, you agree to these Terms and to our Privacy Policy. If you do not agree, please do not use Ntlo.',
    ],
  },
  {
    heading: 'Privacy and data protection',
    body: [
      'How we collect, use, store, and share personal data is described in our Privacy Policy. We process personal data in accordance with Botswana\'s Data Protection Act, 2024. By registering, you confirm that you have read the Privacy Policy. Optional cookies and analytics require a separate opt-in via our cookie settings.',
    ],
  },
  {
    heading: 'Who can use Ntlo',
    body: [
      'You must be at least 18 years old, or the age of majority in Botswana, to create an account. You agree to provide accurate information and to keep your account details up to date. You are responsible for activity that happens under your account.',
    ],
  },
  {
    heading: 'Accounts and roles',
    body: [
      'Ntlo offers two main roles:',
      {
        items: [
          'Students: can browse listings, save rooms, and contact landlords. Student use is free.',
          'Landlords: can publish listings after completing identity and property verification. Some features may require a paid plan.',
        ],
      },
      'You must keep your login credentials secure and notify us of any unauthorised use of your account.',
    ],
  },
  {
    heading: 'Landlord verification',
    body: [
      'To list a room, landlords must submit verification documents (such as a National ID, a selfie with ID, and proof of property ownership or authority). We review these to help keep students safe.',
      'Submitting documents does not guarantee approval. We may approve, reject, or request additional information at our discretion. Providing false or fraudulent documents will result in removal from the platform.',
    ],
  },
  {
    heading: 'Listings and content',
    body: [
      'Landlords are solely responsible for the accuracy of their listings, including price, availability, location, photos, and descriptions. You agree that:',
      {
        items: [
          'Listings must describe real, available accommodation that you have the right to rent.',
          'Photos must genuinely represent the property.',
          'You will not post misleading, offensive, illegal, or fraudulent content.',
          'You will keep availability up to date and remove listings that are no longer available.',
        ],
      },
      'We may remove any listing or content that violates these Terms or that we believe is harmful or misleading.',
    ],
  },
  {
    heading: 'Bookings and payments between users',
    body: [
      'Ntlo is a platform that connects students and landlords. We are not a party to any rental agreement. Any viewing arrangements, deposits, rent payments, and contracts are made directly between the student and the landlord.',
      'We strongly encourage you to inspect a property in person and confirm details with the landlord before making any payment. Ntlo does not hold funds and is not responsible for payments exchanged between users.',
    ],
  },
  {
    heading: 'Map locations are approximate',
    body: [
      'Map pins on Ntlo show the general area near a university, not exact addresses. Always confirm the precise location with the landlord before visiting or making any commitment.',
    ],
  },
  {
    heading: 'Acceptable use',
    body: [
      'You agree not to:',
      {
        items: [
          'Use Ntlo for any unlawful, fraudulent, or harmful purpose.',
          'Impersonate another person or misrepresent your identity.',
          'Scrape, copy, or misuse listings or user data.',
          'Attempt to disrupt, hack, or overload the platform.',
          'Harass, threaten, or abuse other users.',
        ],
      },
    ],
  },
  {
    heading: 'Verification badges',
    body: [
      'A "verified" badge means a landlord or listing has passed our review process at a point in time. It is a trust signal, not a guarantee. You remain responsible for your own due diligence before entering into any agreement.',
    ],
  },
  {
    heading: 'Intellectual property',
    body: [
      'The Ntlo name, logo, design, and platform are owned by Futurify Designs. You may not copy or reuse them without permission. You retain ownership of content you upload, but you grant us a licence to display it on the platform for the purpose of operating the service.',
    ],
  },
  {
    heading: 'Disclaimers and liability',
    body: [
      'Ntlo is provided "as is" without warranties of any kind. We do not guarantee that listings are accurate, that landlords or students will behave as expected, or that the service will always be available or error-free.',
      'To the fullest extent permitted by law, Futurify Designs is not liable for any loss or damage arising from rental arrangements between users, inaccurate listings, or your use of the platform.',
    ],
  },
  {
    heading: 'Suspension and termination',
    body: [
      'We may suspend or terminate accounts that violate these Terms, provide false information, or pose a risk to other users. You may stop using Ntlo and request account deletion at any time.',
    ],
  },
  {
    heading: 'Governing law',
    body: [
      'These Terms are governed by the laws of Botswana. Any dispute arising from these Terms or your use of Ntlo will be subject to the courts of Botswana, without prejudice to any mandatory consumer or data-protection rights you may have under Botswana law, including the Data Protection Act, 2024.',
    ],
  },
  {
    heading: 'Changes to these terms',
    body: [
      'We may update these Terms from time to time. The "Last updated" date at the top reflects the latest version. Continued use of Ntlo after changes means you accept the updated Terms.',
    ],
  },
  {
    heading: 'Contact us',
    body: [
      `For questions about these Terms, contact us at ${CONTACT_EMAIL}.`,
    ],
  },
]

export default function Terms() {
  return (
    <LegalPage
      icon={FileText}
      title="Terms of Service"
      updated="21 July 2026"
      intro="Please read these Terms carefully. They explain the rules for using Ntlo as a student or landlord, and the responsibilities of everyone on the platform."
      sections={sections}
      contactEmail={CONTACT_EMAIL}
    />
  )
}
