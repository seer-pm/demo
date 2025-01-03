import { Alert } from "@/components/Alert";
import { usePageContext } from "vike-react/usePageContext";

function ConfirmEmailPage() {
  const { data } = usePageContext();

  const status = (data as { verificationResult?: "success" | "error" })?.verificationResult || "error";

  return (
    <div className="container-fluid py-[24px] lg:py-[65px]">
      <Alert type={status} title={status === "error" ? "Email verification failed" : "Email verified successfully"}>
        {status === "error"
          ? "We were unable to verify your email address. Please try clicking the verification link again or contact support if the issue persists."
          : "You will now receive email notifications for your followed markets and important updates."}
      </Alert>
    </div>
  );
}
export default ConfirmEmailPage;
