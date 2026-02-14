import * as Dialog from "@radix-ui/react-dialog";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

export function FeedbackDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const rawBasepath = useRouter({ warn: false }).basepath ?? "";
  const normalizedBasepath = rawBasepath.replace(/^\/+|\/+$/g, "");
  const apiBase = normalizedBasepath ? `/${normalizedBasepath}` : "";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const reset = () => {
    setMessage("");
    setEmail("");
    setStatus("idle");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || status === "sending") return;

    setStatus("sending");
    try {
      const res = await fetch(`${apiBase}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          email: email.trim() || undefined,
          page: pathname,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (body?.error?.code === "RATE_LIMITED") {
          setStatus("error");
          return;
        }
        throw new Error("Send failed");
      }

      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="feedback-overlay" />
        <Dialog.Content className="feedback-content" aria-describedby="feedback-description">
          <Dialog.Title className="feedback-title">Give Feedback</Dialog.Title>
          <p id="feedback-description" className="feedback-description">
            Bug reports, feature ideas, questions — all welcome.
          </p>

          {status === "sent" ? (
            <div className="feedback-sent">
              <p className="feedback-sent-message">Sent — thank you for writing.</p>
              <button type="button" className="editorial-button" onClick={() => handleOpenChange(false)}>
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="feedback-form">
              <label className="editorial-label">
                Message
                <textarea
                  className="editorial-control feedback-textarea"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What's on your mind?"
                  required
                  rows={5}
                />
              </label>
              <label className="editorial-label">
                Email (optional, for follow-up)
                <input
                  type="email"
                  className="editorial-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </label>

              {status === "error" && (
                <p className="feedback-error">Something went wrong. Please try again.</p>
              )}

              <div className="feedback-actions">
                <Dialog.Close asChild>
                  <button type="button" className="editorial-button">
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  className="editorial-button editorial-button--filled"
                  disabled={!message.trim() || status === "sending"}
                >
                  {status === "sending" ? "Sending..." : "Send Feedback"}
                </button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
