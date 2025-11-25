import SignInForm from "./signin-form";
import Header from "@/app/components/landing/Header";
import Footer from "@/app/components/landing/Footer";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center py-16 px-6">
        <div className="w-full max-w-md">
          <SignInForm />
        </div>
      </div>
      <Footer />
    </div>
  );
}
