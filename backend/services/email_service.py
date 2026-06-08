"""Resend integration — sends the magic-link email.

Config (RESEND_API_KEY, FROM_EMAIL) is read at call time so it's available
after load_dotenv(). Failures are logged, not raised, so the request endpoint
can keep its constant (enumeration-safe) response.
"""

import logging
import os

import resend

logger = logging.getLogger("resume-ai")

SUBJECT = "Your access link to Brad Belnap's resume"


def _html_body(link: str) -> str:
    return f"""\
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#111113;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background:#111113;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="max-width:480px;background:#1C1C20;border:1px solid rgba(255,255,255,0.08);
                        border-radius:12px;padding:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            <tr><td style="color:#ECECEF;font-size:18px;font-weight:600;padding-bottom:8px;">
              Brad Belnap — Interactive Resume
            </td></tr>
            <tr><td style="color:#7C7C87;font-size:14px;line-height:1.6;padding-bottom:24px;">
              Here's your secure access link. Click the button below to view the resume.
            </td></tr>
            <tr><td align="center" style="padding-bottom:24px;">
              <a href="{link}"
                 style="display:inline-block;background:#6366F1;color:#ffffff;text-decoration:none;
                        font-size:15px;font-weight:600;padding:12px 24px;border-radius:8px;">
                Access Resume &rarr;
              </a>
            </td></tr>
            <tr><td style="color:#7C7C87;font-size:13px;line-height:1.6;padding-bottom:16px;">
              This link expires in 15 minutes and can be used once.
            </td></tr>
            <tr><td style="border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;
                           color:#4A4A55;font-size:12px;line-height:1.6;">
              If you didn't request this, ignore this email.
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""


def _text_body(link: str) -> str:
    return (
        "Brad Belnap — Interactive Resume\n\n"
        "Here's your secure access link:\n"
        f"{link}\n\n"
        "This link expires in 15 minutes and can be used once.\n\n"
        "If you didn't request this, ignore this email.\n"
    )


def send_magic_link(to_email: str, link: str) -> None:
    """Send the magic-link email via Resend. Logs and returns on misconfig/error."""
    api_key = os.getenv("RESEND_API_KEY")
    from_email = os.getenv("FROM_EMAIL")
    if not api_key or not from_email:
        logger.error("Resend not configured (RESEND_API_KEY/FROM_EMAIL missing); cannot send link.")
        return

    resend.api_key = api_key
    try:
        resend.Emails.send(
            {
                "from": from_email,
                "to": [to_email],
                "subject": SUBJECT,
                "html": _html_body(link),
                "text": _text_body(link),
            }
        )
    except Exception:
        logger.exception("Failed to send magic-link email via Resend")
