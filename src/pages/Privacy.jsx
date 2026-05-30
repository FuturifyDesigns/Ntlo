import { ShieldCheck } from 'lucide-react'
import LegalPage from '../components/legal/LegalPage'

const CONTACT_EMAIL = 'futurifydesigns@gmail.com'

const sections = [
  {
    heading: 'Who we are',
    body: [
      'Ntlo is a student accommodation platform operated by Futurify Designs ("Ntlo", "we", "us", "our"). Ntlo connects students in Botswana with verified landlords offering rooms and housing near universities.',
      'This Privacy Policy explains what information we collect, how we use it, and the choices you have. It applies to the Ntlo website and any related services.',
    ],
  },
  {
    heading: 'Information we collect',
    body: [
      'We collect the following types of information so the platform can work and stay safe:',
      {
        items: [
          'Account details: your name, email address, phone number, and whether you are a student or landlord.',
          'University information: for students, the university you select so we can show nearby listings and distances.',
          'Listing information: for landlords, the room details, address, area, price, photos, and contact number you publish.',
          'Verification documents: for landlords, identity and property documents (e.g. National ID, selfie with ID, proof of ownership) used only to confirm trust and safety.',
          'Usage data: basic technical information such as pages viewed and listing views, used to improve the service.',
          'Cookies: small files stored in your browser for sign-in sessions and preferences (see the Cookies section).',
        ],
      },
    ],
  },
  {
    heading: 'How we use your information',
    body: [
      'We use your information to:',
      {
        items: [
          'Create and manage your account and keep you signed in.',
          'Show students relevant listings near their university and calculate distance to campus.',
          'Let students contact landlords (for example, via WhatsApp) about a listing.',
          'Verify landlord identity and property ownership to reduce scams and fake listings.',
          'Display verified badges once a landlord or listing has been approved.',
          'Protect the platform, prevent abuse, and respond to support requests.',
        ],
      },
    ],
  },
  {
    heading: 'Google sign-in',
    body: [
      'If you sign in with Google, we receive your basic Google profile information — your name, email address, and profile picture. We use this only to create or access your Ntlo account.',
      'We do not post anything to your Google account and we do not access your contacts, files, or other Google data.',
    ],
  },
  {
    heading: 'How we share information',
    body: [
      'We do not sell your personal information. We share information only in these limited cases:',
      {
        items: [
          'Between students and landlords: a landlord’s listing details and contact number are visible to students; a student who contacts a landlord shares the details they choose to send.',
          'Service providers: we use Supabase to host our database, authentication, and file storage, and Google Maps to display locations. These providers process data on our behalf.',
          'Legal reasons: if required by law, regulation, or to protect the rights and safety of our users.',
        ],
      },
      'Verification documents are private and are only accessible to you and Ntlo administrators reviewing your account. They are never shown publicly.',
    ],
  },
  {
    heading: 'Data storage and security',
    body: [
      'Your data is stored securely using Supabase, with access controlled by row-level security so users can only access their own data (administrators have limited access for moderation and verification).',
      'Verification documents are stored in a private storage bucket and are accessed using temporary, expiring links. While we take reasonable measures to protect your information, no method of transmission or storage is completely secure.',
    ],
  },
  {
    heading: 'Your choices and rights',
    body: [
      'You can:',
      {
        items: [
          'Access and update your profile information at any time from your account.',
          'Edit or remove your listings (landlords).',
          'Request deletion of your account and associated data by contacting us.',
          'Manage cookie preferences from the link in the website footer.',
        ],
      },
    ],
  },
  {
    heading: 'Cookies',
    body: [
      'We use essential cookies to keep you signed in and remember your preferences (such as language). You can manage non-essential cookie preferences using the "Cookie settings" link in the footer. Disabling essential cookies may prevent sign-in from working.',
    ],
  },
  {
    heading: 'Children’s privacy',
    body: [
      'Ntlo is intended for university students and adults. It is not directed at children under the age of 13, and we do not knowingly collect information from them.',
    ],
  },
  {
    heading: 'Changes to this policy',
    body: [
      'We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date at the top of this page. Significant changes may be communicated through the platform.',
    ],
  },
  {
    heading: 'Contact us',
    body: [
      `If you have questions or requests regarding your privacy, contact us at ${CONTACT_EMAIL}.`,
    ],
  },
]

export default function Privacy() {
  return (
    <LegalPage
      icon={ShieldCheck}
      title="Privacy Policy"
      updated="30 May 2026"
      intro="Your privacy matters to us. This policy describes how Ntlo collects, uses, and protects your information when you use our student accommodation platform."
      sections={sections}
      contactEmail={CONTACT_EMAIL}
    />
  )
}
