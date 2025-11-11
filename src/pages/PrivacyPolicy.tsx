import { ArrowLeft } from 'lucide-react';
import { useNavigate } from './navigation';

function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-neutral-400 hover:text-emerald-400 transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>

        <div className="space-y-8">
          <h1 className="text-4xl font-bold text-neutral-100">Privacy Policy</h1>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-neutral-100">Introduction</h2>
            <p className="text-neutral-400 leading-relaxed">
              This is the Privacy Policy of apps of Intiqual and its various & next versions (hereinafter
              collectively referred to as "us", "we", or "our") and is incorporated into and is subject to our
              Terms of Use which can be found at https://survey.tricadtrack.com/terms. In this Privacy Policy, we refer
              to our products and services as the "Service". Please read on to learn more about our data handling
              practices. Your use of the Service signifies that you agree with the terms of this Privacy Policy.
              If you do not agree with the terms of this Privacy Policy, please do not use the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-neutral-100">Information We Collect</h2>
            <p className="text-neutral-400 leading-relaxed">
              When you install the Service on your device and register, personally identifiable information about
              you may be collected during the download process for the Service (as requested during the download
              process) and when you register with us. For registration, you are required to provide your your email
              address, city location, gender, name, depending on the device(s) you are using on the Service. You may
              also provide personally identifiable information, but that is optional. When you log in using your
              Facebook account, we may collect additional information you make available to us
              (see "Your User Profile" below).
            </p>
            <p className="text-neutral-400 leading-relaxed">
              In addition, when you install the Service on your device and register, you may will be asked to allow us
              access to your address book. If you consent, we will have access to contact information in your address
              book on the device you use for the Service (names, numbers, emails, and Facebook IDs, but not notes or
              other personal information in your address book) and we will store them on our servers and use them to
              help you use the Service, for example,
              by synchronizing your contacts between different devices you may want to use with the Service.
            </p>
            <p className="text-neutral-400 leading-relaxed">
              We may also collect and gather non-personally identifiable information, such as certain profile
              information including country of residence and preferences. In addition, we may collect and store
              information about your and others' usage of and interaction with the Service and our websites,
              including matches, numbers of matches made by members, match durations, text messages, usage by
              geographies, device and connection information, IP address, device capability, bandwidth, statistics
              on page views, network type and traffic to and from our websites.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-neutral-100">Sharing of Your Information</h2>
            <p className="text-neutral-400 leading-relaxed">
              We will not rent or sell your information to third parties without your consent, except as noted in
              this Privacy Policy.
            </p>
            <p className="text-neutral-400 leading-relaxed">
              Parties with whom we may share your information: We may share User Content and your information (including but not limited to, information from cookies, log files, device identifiers, location data, and usage data) with businesses that are legally part of the same group of companies that is part of, or that become part of that group ("Affiliates"). Affiliates may use this information to help provide, understand, and improve the Service (including by providing analytics) and Affiliates' own services (including by providing you with better and more relevant experiences). But these Affiliates will honor the choices you make about who can see your contents.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-neutral-100">How We Use Information We Collect</h2>
            <div className="text-neutral-400 leading-relaxed space-y-2">
              <p>We use or may disclose your personal information only as follows:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>To share your Profile with others on the Service</li>
                <li>To connect you with others as enabled by the Service</li>
                <li>To allow your use of certain features of the Service that may be offered from time to time</li>
                <li>To show you the names of persons you communicate with and to show your name to persons you communicate with on the Service</li>
                <li>To deliver to you any administrative notices, alerts and communications relevant to your use of the Service</li>
                <li>For internal operations, including troubleshooting problems, data analysis, testing, research, improvements to the Service</li>
                <li>When we have a good faith belief that the law, any legal process, law enforcement, national security or issue of public importance requires disclosure</li>
                <li>To protect and defend our rights or property</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-neutral-100">Your User Profile</h2>
            <p className="text-neutral-400 leading-relaxed">
              The information you enter into your user profile (your "Profile") may be shared with your contacts. You control your Profile and you can access and modify your Profile from the application at any time. In addition, if you register using your Facebook account (e.g. Facebook Connect), we may store your Facebook ID and corresponding token on our servers and, if you give us your express consent, we will have access to and may collect certain information that you make available on Facebook.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-neutral-100">Data Access and Removal</h2>
            <p className="text-neutral-400 leading-relaxed">
              You can always control what information you choose to share with us on the Service. To do so, you can change your settings in the Service or in your mobile device. Alternatively, you can remove the Service from your mobile device entirely. You can remove your data anytime you want. If you ask us to delete your account, we will use commercially reasonable efforts to remove your data from our servers.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-neutral-100">Security</h2>
            <p className="text-neutral-400 leading-relaxed">
              Protecting user privacy and personal information is a top priority for us. We make substantial efforts to ensure the privacy of all personally identifiable information you provide to us. Access to all personally identifiable information is restricted to those employees, contractors, agents and third-party service providers who need to know that information in order to provide, operate, develop, maintain, support or improve the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-neutral-100">Your Rights</h2>
            <p className="text-neutral-400 leading-relaxed">
              If you wish to use any of the rights described below, you may contact us at any time by emailing us at info@tricadtrack.com.
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-neutral-200 mb-2">1) Right to request access</h3>
                <p className="text-neutral-400 leading-relaxed">
                  You have the right to request access into the data that we are processing on you, including information about the purposes of the processing, the categories of personal data concerned, and the recipients or categories of recipient to whom the personal data have been or will be disclosed.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-neutral-200 mb-2">2) The right to object</h3>
                <p className="text-neutral-400 leading-relaxed">
                  You have the right to object to our processing of your personal data on grounds relating to your particular situation when the data are processed based on the balancing-of interest rule. You have the right to object to our processing of your personal data for direct marketing purposes at any time.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-neutral-200 mb-2">3) Right to rectification and erasure</h3>
                <p className="text-neutral-400 leading-relaxed">
                  You have the right to have inaccurate personal data rectified. Furthermore, you have the right to have your personal data erased where the personal data are no longer necessary in relation to the purposes for which they were collected or otherwise processed.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-neutral-200 mb-2">4) Right to withdraw consent</h3>
                <p className="text-neutral-400 leading-relaxed">
                  If we have asked for your consent to our processing of your data, you have the right to withdraw your consent at any time. The withdrawal of your consent does not affect the lawfulness of processing based on your consent before its withdrawal.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-neutral-200 mb-2">5) The right to data portability</h3>
                <p className="text-neutral-400 leading-relaxed">
                  You have the right to receive the personal data you have provided us with which we process in a structured, commonly used and machine-readable format and have the right to transmit those data to another controller if the processing is based on consent or contract performance.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-neutral-100">Contact Information</h2>
            <p className="text-neutral-400 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at info@tricadtrack.com.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-neutral-100">Date</h2>
            <p className="text-neutral-400 leading-relaxed">
              This privacy policy was posted on June 29, 2023.
            </p>
          </section>
        </div>

        <footer className="mt-16 pt-8 border-t border-neutral-800">
          <div className="flex flex-col items-center gap-4 text-neutral-500 text-sm">
            <div className="flex gap-4">
              <button onClick={() => navigate('/terms')} className="hover:text-emerald-400 transition-colors">
                Terms of Use
              </button>
              <span>|</span>
              <button onClick={() => navigate('/privacy')} className="hover:text-emerald-400 transition-colors">
                Privacy Policy
              </button>
            </div>
            <div>
              <span>2025 Intiqual. All Rights Reserved</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
