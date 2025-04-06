import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign In | Kitabi Keeda - Book Management System",
  description: "Sign in to access your Kitabi Keeda dashboard",
};

// Loading fallback
function AuthLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-40 w-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<AuthLoadingFallback />}>
      <SignInForm />
    </Suspense>
  );
}
