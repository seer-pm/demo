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
    v.maxLength(30, "Your email is too long."),
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
      <Input
        type="email"
        placeholder="Enter your email"
        useFormReturn={useFormReturn}
        {...useFormReturn.register("email", { required: "This field is required." })}
        className="w-full"
      />

      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          disabled={!isValid || watch("email") === email}
          isLoading={false}
          text="Save"
        />
      </div>
    </form>
  );
}
