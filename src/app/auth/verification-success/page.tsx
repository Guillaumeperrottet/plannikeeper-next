export default function VerificationSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-foreground">
            Email vérifié !
          </h2>
          <p className="mt-2 text-muted-foreground">
            Votre adresse email a été vérifiée avec succès. Vous pouvez
            maintenant vous connecter à votre compte.
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-center">
            <a
              href="/signin"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Se connecter
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
