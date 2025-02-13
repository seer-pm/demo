import { createClient } from "@supabase/supabase-js";
import { getPostmarkClient } from "./utils/common";
import { FROM_EMAIL } from "./utils/common";

const supabase = createClient(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

async function sendPendingNotifications() {
  try {
    // Fetch pending notifications
    const { data: pendingNotifications, error } = await supabase
      .from("notifications_queue")
      .select("id, email, data")
      .is("sent_at", null)
      .order("created_at", { ascending: true })
      .limit(10);

    if (error) {
      throw error;
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      console.log("No pending notifications found");
      return;
    }

    console.log(`Processing ${pendingNotifications.length} notifications`);

    // Send emails and collect successful sends
    const sendResults = await Promise.all(
      pendingNotifications.map(async (notification) => {
        try {
          const { data } = notification;
          await getPostmarkClient().sendEmailWithTemplate({
            TemplateAlias: data.TemplateAlias,
            TemplateModel: data.TemplateModel,
            From: FROM_EMAIL,
            To: notification.email,
          });
          return { id: notification.id, success: true };
        } catch (error) {
          console.error("Error sending email:", error, notification);
          return { id: notification.id, success: false };
        }
      }),
    );

    // Get IDs of successfully sent notifications
    const successfulIds = sendResults.filter((result) => result.success).map((result) => result.id);

    if (successfulIds.length > 0) {
      // Update sent_at for successful sends
      const { error: updateError } = await supabase
        .from("notifications_queue")
        .update({ sent_at: new Date().toISOString() })
        .in("id", successfulIds);

      if (updateError) {
        throw updateError;
      }

      console.log(`Successfully sent ${successfulIds.length} notifications`);
    }

    // Log failed sends
    const failedCount = sendResults.filter((result) => !result.success).length;
    if (failedCount > 0) {
      console.log(`Failed to send ${failedCount} notifications`);
    }
  } catch (error) {
    console.error("Error processing notifications:", error);
    throw error;
  }
}

export default async () => {
  try {
    await sendPendingNotifications();
  } catch (e) {
    console.error("Error in notification events sender:", e);
  }
};

export const config = {
  schedule: "*/15 * * * *",
};
