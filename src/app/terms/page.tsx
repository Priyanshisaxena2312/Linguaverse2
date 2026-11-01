
export default function TermsPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-12 md:py-20">
        <header className="mb-12 border-b pb-6">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline text-primary">
            Terms of Service
          </h1>
          <p className="mt-2 text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </header>
        <div className="space-y-8 text-lg text-foreground/90">
          <section className="space-y-4">
            <h2 className="font-headline text-2xl font-bold text-primary/90">1. Introduction</h2>
            <p>Welcome to Linguaverse ("we," "our," "us"). These Terms of Service ("Terms") govern your use of our website and services (collectively, the "Service"). By accessing or using our Service, you agree to be bound by these Terms.</p>
          </section>
          
          <section className="space-y-4">
            <h2 className="font-headline text-2xl font-bold text-primary/90">2. User Accounts</h2>
            <p>To use certain features of our Service, you must register for an account. You agree to provide accurate, current, and complete information during the registration process. You are responsible for safeguarding your password and for all activities that occur under your account. Your password is encrypted and we cannot access it. If you forget your password, you must use the secure password reset functionality.</p>
          </section>

          <section className="space-y-4">
            <h2 className="font-headline text-2xl font-bold text-primary/90">3. User Content</h2>
            <p>You retain full ownership of the text, audio, and other content you submit to the Service ("User Content"). By using the Service, you grant us a limited, non-exclusive, worldwide, royalty-free license to use, process, and display your User Content <span className="font-bold">solely for the purpose of operating and providing the Service to you.</span> This includes processing your text and audio with our AI models to generate journal entries and analysis on your behalf.</p>
            <p><strong>Audio Content:</strong> For audio content submitted to the Service, this license is temporary and transactional. The audio data is processed to generate text content and is then <span className="font-bold">immediately and permanently discarded</span> from our systems. We do not store your audio recordings.</p>
            <p><strong>Generated Content:</strong> The journal entries and analyses generated from your input are considered your User Content. We store this text-based content securely in our database to make it available to you within your account.</p>
            <p>We will never use your User Content to train our AI models without your explicit, opt-in consent.</p>
          </section>

          <section className="space-y-4">
            <h2 className="font-headline text-2xl font-bold text-primary/90">4. Prohibited Activities</h2>
            <p>You agree not to engage in any of the following prohibited activities: (i) copying, distributing, or disclosing any part of the Service in any medium; (ii) using the Service for any illegal purpose; (iii) attempting to interfere with, compromise the system integrity or security or decipher any transmissions to or from the servers running the Service.</p>
          </section>

          <section className="space-y-4">
            <h2 className="font-headline text-2xl font-bold text-primary/90">5. Termination</h2>
            <p>We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
