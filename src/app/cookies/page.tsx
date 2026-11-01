export default function CookiePolicyPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-12 md:py-20">
        <header className="mb-12 border-b pb-6">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline text-primary">
            Cookie Policy
          </h1>
          <p className="mt-2 text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </header>
        <div className="space-y-8 text-lg text-foreground/90">
          <section className="space-y-4">
            <h2 className="font-headline text-2xl font-bold text-primary/90">1. What Are Cookies?</h2>
            <p>Cookies are small text files that are placed on your device by websites that you visit. They are widely used in order to make websites work, or work more efficiently, as well as to provide information to the owners of the site.</p>
          </section>
          
          <section className="space-y-4">
            <h2 className="font-headline text-2xl font-bold text-primary/90">2. How We Use Cookies</h2>
            <p>We use cookies for essential functionalities, such as keeping you logged in. These are known as "strictly necessary" cookies. They are required for the operation of our Service. For example, we use cookies to manage your authentication and session status.</p>
          </section>

          <section className="space-y-4">
            <h2 className="font-headline text-2xl font-bold text-primary/90">3. Types of Cookies We Use</h2>
            <p><strong>Strictly Necessary Cookies:</strong> These cookies are essential for you to browse the website and use its features, such as accessing secure areas of the site. The services you have asked for cannot be provided without these cookies. We use cookies provided by our authentication partner, Supabase, for this purpose.</p>
          </section>
          
          <section className="space-y-4">
            <h2 className="font-headline text-2xl font-bold text-primary/90">4. Your Choices</h2>
            <p>Because the cookies we use are strictly necessary for the Service to function, we do not provide an option to opt-out of them. You can block or delete cookies by changing your browser settings, but be aware that this will break the login functionality of our Service.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
