import { PageContext } from "vike/types";

export default async function onBeforeRender(pageContext: PageContext) {
  const verificationToken = pageContext.routeParams?.token || "";

  if (!verificationToken) {
    return {
      pageContext: {
        data: {
          verificationResult: "error",
        },
      },
    };
  }

  try {
    const result = await fetch(
      `${import.meta.env.VITE_WEBSITE_URL || "https://www.seer.pm"}/.netlify/functions/confirm-email?token=${verificationToken}`,
    );
    const data = await result.json();

    return {
      pageContext: {
        data: {
          verificationResult: data.success === 1 ? "success" : "error",
        },
      },
    };
  } catch {
    return {
      pageContext: {
        data: { verificationResult: "error" },
      },
    };
  }
}
