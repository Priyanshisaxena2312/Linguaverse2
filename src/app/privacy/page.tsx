export default function PrivacyPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-12 md:py-20">
        <header className="mb-12 border-b pb-6">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline text-primary">
            Privacy Policy
          </h1>
          <p className="mt-2 text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </header>
        <div className="space-y-8 text-lg text-foreground/90">
          <section className="space-y-4">
            <h2 className="font-headline text-2xl font-bold text-primary/90">1. Information We Collect</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li><strong>Account Information:</strong> When you create an account, we collect your full name, email address, and an encrypted password. You may also optionally provide a separate contact email address.</li>
              <li><strong>Journal Entries:</strong> We collect and store the text-based journal entries that you create and save within the Service.</li>
              <li><strong>Audio Recordings (Temporary):</strong> When you use our voice input features, we collect your audio recording for the sole purpose of processing it. As explained below, this data is immediately deleted after processing.</li>
            </ul>
          </section>
          
          <section className="space-y-4">
            <h2 className="font-headline text-2xl font-bold text-primary/90">2. How We Use Your Information</h2>
            <p>We use the information we collect for the following purposes:</p>
            <ul className="list-disc space-y-2 pl-6">
                <li><strong>To Provide and Maintain the Service:</strong> We use your account information to authenticate you and give you access to your journal. Your written journal entries are encrypted and stored securely so you can view, edit, and manage them over time.</li>
                <li><strong>To Provide AI-Powered Features (With Your Consent):</strong> Our AI-powered analysis features (such as sentiment, mood, and productivity analysis) are strictly <strong>opt-in</strong>. These features will only process your journal entries if you have explicitly enabled "AI Analysis" in your profile settings. You can enable or disable this feature at any time. If disabled, your journal entries will never be sent to our AI models. Your journal content is never used to train AI models, regardless of your settings.</li>
                <li><strong>Voice Processing:</strong> When you use our voice journaling feature, your audio recording is securely transmitted to our AI model for processing. This processing may include transcription and generation of a journal entry. <span className="font-bold">The original audio file is used only for this single transaction and is immediately and permanently discarded. We do not store your audio recordings.</span></li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-headline text-2xl font-bold text-primary/90">3. Data Security</h2>
            <p>We are committed to protecting your data. We use commercially reasonable physical, administrative, and technological safeguards to preserve the integrity and security of all information collected through the Service.</p>
             <ul className="list-disc space-y-2 pl-6">
                <li><strong>Encryption:</strong> Your data is encrypted both in transit (using TLS/SSL) and at rest in our secure database.</li>
                <li><strong>Password Security:</strong> We do not store your password in plain text. It is protected using a strong, one-way cryptographic hashing algorithm. This means that we cannot read your password. If you forget your password, you must reset it through our secure password reset process.</li>
             </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-headline text-2xl font-bold text-primary/90">4. Your Rights & Control</h2>
            <p>You have full control over your User Content. You have the right to access, update, or delete your personal information and journal entries at any time through the Service's interface. Deleting an entry or your account is a permanent action.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
