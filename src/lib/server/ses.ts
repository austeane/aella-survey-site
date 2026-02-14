import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const RECIPIENT = "austinwallacetech@gmail.com";

let client: SESClient | null = null;

function getClient(): SESClient {
  if (!client) {
    client = new SESClient({
      region: process.env.AWS_REGION ?? "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
      },
    });
  }
  return client;
}

export async function sendFeedbackEmail(opts: {
  message: string;
  email?: string;
  page?: string;
}): Promise<void> {
  const fromEmail = process.env.SES_FROM_EMAIL;
  if (!fromEmail) {
    throw new Error("SES_FROM_EMAIL is not configured");
  }

  const timestamp = new Date().toISOString();
  const lines = [
    `Message:\n${opts.message}`,
    `\nPage: ${opts.page ?? "(not provided)"}`,
    `Reply-to: ${opts.email ?? "(not provided)"}`,
    `Timestamp: ${timestamp}`,
  ];

  const command = new SendEmailCommand({
    Source: fromEmail,
    Destination: { ToAddresses: [RECIPIENT] },
    ReplyToAddresses: opts.email ? [opts.email] : undefined,
    Message: {
      Subject: { Data: "BKS Explorer Feedback", Charset: "UTF-8" },
      Body: {
        Text: { Data: lines.join("\n"), Charset: "UTF-8" },
      },
    },
  });

  await getClient().send(command);
}
