import { ArrowLeft } from 'lucide-react';
import { useNavigate } from './navigation';

function Terms() {
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
          <h1 className="text-4xl font-bold text-neutral-100">Terms & Conditions</h1>

          <section className="space-y-4">
            <p className="text-neutral-400 leading-relaxed">
              By downloading or using the app, these terms will automatically apply to you – you should make sure therefore that you read them carefully before using the app. You're not allowed to copy, or modify the app, any part of the app, or our trademarks in any way. You're not allowed to attempt to extract the source code of the app, and you also shouldn't try to translate the app into other languages, or make derivative versions. The app itself, and all the trade marks, copyright, database rights and other intellectual property rights related to it, still belong to Intiqual.
            </p>
            <p className="text-neutral-400 leading-relaxed">
              Intiqual is committed to ensuring that the app is as useful and efficient as possible. For that reason, we reserve the right to make changes to the app or to charge for its services, at any time and for any reason. We will never charge you for the app or its services without making it very clear to you exactly what you're paying for.
            </p>
            <p className="text-neutral-400 leading-relaxed">
              The app stores and processes personal data that you have provided to us, in order to provide our Service. It's your responsibility to keep your phone and access to the app secure. We therefore recommend that you do not jailbreak or root your phone, which is the process of removing software restrictions and limitations imposed by the official operating system of your device. It could make your phone vulnerable to malware/viruses/malicious programs, compromise your phone's security features and it could mean that the app won't work properly or at all.
            </p>
            <p className="text-neutral-400 leading-relaxed">
              The app does use third party services that declare their own Terms and Conditions.
            </p>
            <p className="text-neutral-400 leading-relaxed">
              Link to Terms and Conditions of third party service providers used by the app: Google Play Services
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-neutral-100">Service Availability</h2>
            <p className="text-neutral-400 leading-relaxed">
              You should be aware that there are certain things that Intiqual will not take responsibility for. Certain functions of the app will require the app to have an active internet connection. The connection can be Wi-Fi, or provided by your mobile network provider, but Intiqual cannot take responsibility for the app not working at full functionality if you don't have access to Wi-Fi, and you don't have any of your data allowance left.
            </p>
            <p className="text-neutral-400 leading-relaxed">
              If you're using the app outside of an area with Wi-Fi, you should remember that your terms of the agreement with your mobile network provider will still apply. As a result, you may be charged by your mobile provider for the cost of data for the duration of the connection while accessing the app, or other third party charges. In using the app, you're accepting responsibility for any such charges, including roaming data charges if you use the app outside of your home territory (i.e. region or country) without turning off data roaming. If you are not the bill payer for the device on which you're using the app, please be aware that we assume that you have received permission from the bill payer for using the app.
            </p>
            <p className="text-neutral-400 leading-relaxed">
              Along the same lines, Intiqual cannot always take responsibility for the way you use the app i.e. You need to make sure that your device stays charged – if it runs out of battery and you can't turn it on to avail the Service, Intiqual cannot accept responsibility.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-neutral-100">Updates and Maintenance</h2>
            <p className="text-neutral-400 leading-relaxed">
              With respect to Intiqual's responsibility for your use of the app, when you're using the app, it's important to bear in mind that although we endeavour to ensure that it is updated and correct at all times, we do rely on third parties to provide information to us so that we can make it available to you. Intiqual accepts no liability for any loss, direct or indirect, you experience as a result of relying wholly on this functionality of the app.
            </p>
            <p className="text-neutral-400 leading-relaxed">
              At some point, we may wish to update the app. The app is currently available on Android & iOS – the requirements for both systems (and for any additional systems we decide to extend the availability of the app to) may change, and you'll need to download the updates if you want to keep using the app. Intiqual does not promise that it will always update the app so that it is relevant to you and/or works with the Android & iOS version that you have installed on your device. However, you promise to always accept updates to the application when offered to you. We may also wish to stop providing the app, and may terminate use of it at any time without giving notice of termination to you. Unless we tell you otherwise, upon any termination, (a) the rights and licenses granted to you in these terms will end; (b) you must stop using the app, and (if needed) delete it from your device.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-neutral-100">Changes to Terms & Conditions</h2>
            <p className="text-neutral-400 leading-relaxed">
              We may update our Terms and Conditions from time to time. Thus, you are advised to review this page periodically for any changes. We will notify you of any changes by posting the new Terms and Conditions on this page. These terms and conditions are effective as of 2025-08-01.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-neutral-100">Contact Us</h2>
            <p className="text-neutral-400 leading-relaxed">
              If you have any questions or suggestions about our Terms and Conditions, do not hesitate to contact us at info@tricadtrack.com.
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

export default Terms;
