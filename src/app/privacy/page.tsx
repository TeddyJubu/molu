export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-3xl space-y-4">
        <h1 className="font-baloo text-3xl font-bold text-primary">Privacy Policy</h1>
        <p className="text-muted-foreground">
          This page explains what information we collect and how we use it. Replace this content with your finalized
          policy before launch.
        </p>
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            We may collect information you provide during checkout or account creation (such as name, email, shipping
            address) and information needed to process payments and fulfill orders.
          </p>
          <p>
            We use cookies and similar technologies to provide essential site functionality, improve performance, and
            understand usage patterns.
          </p>
          <p>
            We do not sell personal information. We may share data with service providers strictly to operate the store
            (payments, shipping, analytics).
          </p>
        </div>
      </div>
    </div>
  );
}
