import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import { toastify } from "@/lib/toastify";
import { fetchAuth } from "@/lib/utils";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useForm } from "react-hook-form";
import * as v from "valibot";

type NotificationsFormData = {
  email: string;
};

const schema = v.object({
  email: v.pipe(
    v.string(),
    v.nonEmpty("Please enter your email."),
    v.email("The email is badly formatted."),
    // RFC 5321 caps an email path at 254 characters. A lower ceiling turns ordinary long corporate
    // addresses into a "badly formatted" error, which points the user at the wrong problem.
    v.maxLength(254, "Your email is too long."),
  ),
});

export function NotificationsForm({ email, accessToken }: { email: string; accessToken: string }) {
  const useFormReturn = useForm<NotificationsFormData>({
    mode: "all",
    defaultValues: {
      email: email,
    },
    resolver: valibotResolver(schema),
  });

  const {
    watch,
    handleSubmit,
    formState: { isValid },
  } = useFormReturn;

  const onSubmit = async (data: NotificationsFormData) => {
    await toastify(() => fetchAuth(accessToken, "/.netlify/functions/me", "POST", { email: data.email }), {
      txSent: { title: "Updating email..." },
      txSuccess: { title: "Please check your inbox for a verification email." },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-[24px]">
      <div>
        <label htmlFor="notification-email" className="block text-[14px] font-medium mb-2">
          Email address
        </label>
        <Input
          id="notification-email"
          autoComplete="email"
          inputMode="email"
          type="email"
          {...useFormReturn.register("email")}
          className="w-full"
          useFormReturn={useFormReturn}
        />
      </div>
      <Button
        type="submit"
        text="Save email"
        disabled={!isValid || watch("email") === email}
        isLoading={useFormReturn.formState.isSubmitting}
      />
    </form>
  );
}
