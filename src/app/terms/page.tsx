export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-3xl space-y-4">
        <h1 className="font-baloo text-3xl font-bold text-primary">Terms of Service</h1>
        <p className="text-muted-foreground">
          These terms govern your use of the site and purchases. Replace this content with your finalized terms before
          launch.
        </p>
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            By using this website, you agree to comply with applicable laws and to use the site for lawful purposes
            only.
          </p>
          <p>
            Product availability, pricing, and promotions may change. We reserve the right to refuse or cancel orders
            where permitted by law.
          </p>
          <p>
            All content on this site is provided for informational purposes and may be updated without notice.
          </p>
        </div>
      </div>
    </div>
  );
}
