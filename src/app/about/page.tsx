
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Target, Feather } from 'lucide-react';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="bg-primary/5">
      <div className="container mx-auto max-w-5xl px-4 py-12 md:py-20">
        {/* Hero Section */}
        <section className="text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline text-primary">
            The Story of Linguaverse
          </h1>
          <p className="max-w-[700px] mx-auto mt-4 text-muted-foreground md:text-xl">
            We believe that understanding yourself is the first step to a better life. We built Linguaverse to make that journey of self-discovery effortless and insightful for everyone.
          </p>
        </section>

        {/* Mission & Vision Section */}
        <section className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
                 <h2 className="text-3xl font-bold tracking-tighter font-headline">Our Mission</h2>
                 <p className="text-lg text-muted-foreground">
                    Our mission is to empower individuals to build a deeper connection with themselves through the simple, consistent practice of journaling. We remove the friction, transforming raw thoughts into structured, beautiful reflections, and provide insights that illuminate personal growth over time.
                 </p>
            </div>
            
        </section>

        {/* Core Values Section */}
        <section className="mt-20 text-center">
             <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">What We Stand For</h2>
             <div className="mx-auto mt-8 grid max-w-5xl items-stretch gap-6 lg:grid-cols-3 lg:gap-8">
                <Card className="text-center p-4">
                    <CardHeader>
                        <Feather className="w-12 h-12 mx-auto mb-4 text-primary" />
                        <CardTitle className="font-headline">Simplicity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Journaling shouldn't be a chore. We focus on an intuitive, effortless experience from start to finish.</p>
                    </CardContent>
                </Card>
                 <Card className="text-center p-4">
                    <CardHeader>
                        <Target className="w-12 h-12 mx-auto mb-4 text-primary" />
                        <CardTitle className="font-headline">Insight</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>We go beyond words, providing you with meaningful analysis to help you understand your emotional and cognitive patterns.</p>
                    </CardContent>
                </Card>
                 <Card className="text-center p-4">
                    <CardHeader>
                        <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
                        <CardTitle className="font-headline">Privacy</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Your thoughts are your own. We are committed to protecting your data with the highest standards of security.</p>
                    </CardContent>
                </Card>
             </div>
        </section>
      </div>
    </div>
  );
}
