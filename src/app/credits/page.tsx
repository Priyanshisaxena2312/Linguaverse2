
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreditsPage() {
  const contributors = [
    'Priyanshi Saxena',
  ];

  return (
    <div className="min-h-screen bg-primary/5 py-12 md:py-20">
      <div className="container mx-auto max-w-3xl">
        <Card className="shadow-lg">
            <CardHeader className="text-center">
                <CardTitle className="font-headline text-4xl sm:text-5xl font-bold text-primary mb-4">
                    Acknowledgements
                </CardTitle>
                <p className="max-w-[600px] mx-auto text-muted-foreground md:text-xl">
                    This project was made possible by the contributions and support of the following individuals.
                </p>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4 text-center">
                    {contributors.map((name, index) => (
                        <li key={index} className="text-2xl font-semibold text-foreground/80">
                           {name}
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
