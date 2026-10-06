# How-To: Email Draft Synchronization & Deliverability Health Safeguards

Aura provides seamless integration with your email providers via two delivery models:
1. **IMAP Draft Sync (Give-First Safe Mode)**: Connects via IMAP SSL and creates RFC-822 formatted messages straight into your provider's `Drafts` mailbox. You review and click send manually in your client.
2. **Direct SMTP Automated Send**: Automatically sends drafted outreach with built-in deliverability safety circuit breakers.

---

## 1. Supported Providers & Configuration

In the Settings overlay (**Tab 3: Email Integrations**), select your email provider:

| Provider | Inbound Protocol (IMAP) | Outbound Protocol (SMTP) | Authentication Notes |
| :--- | :--- | :--- | :--- |
| **Gmail** | `imap.gmail.com:993` | `smtp.gmail.com:465` | Requires a Google **App Password** (with 2FA enabled). |
| **Outlook / Office 365** | `outlook.office365.com:993` | `smtp.office365.com:587` | Requires SMTP/IMAP enabled on your tenant. |
| **Yahoo Mail** | `imap.mail.yahoo.com:993` | `smtp.mail.yahoo.com:465` | Requires Yahoo **App Password**. |
| **PrivateEmail (Namecheap)** | `mail.privateemail.com:993` | `mail.privateemail.com:465` | Standard mailbox credentials. |
| **Custom SMTP/IMAP** | Custom Host & Port | Custom Host & Port | Self-hosted or corporate mail servers. |

---

## 2. Understanding the Deliverability Health Circuit Breaker

Before every direct send, Aura evaluates your sending domain through `/api/email/health`:
1. **DNS SPF Record Resolution**: Verifies that your domain has an active, valid `v=spf1` TXT record authorizing your SMTP server.
2. **DNS DMARC Record Resolution**: Verifies `_dmarc.<domain>` contains a compliant policy (`p=none`, `p=quarantine`, or `p=reject`).
3. **Spamhaus DBL Real-time Query**: Resolves your domain against `dbl.spamhaus.org` to ensure your domain is not flagged for spam.
4. **Recent Bounce Telemetry**: Scans mailbox bounce messages over the last 7 days to calculate a dynamic bounce penalty.

### Safety Lockout Trigger
- If the calculated health score drops below **65%**:
  - The UI displays an alert banner: `⚠️ Email Deliverability Lockout Active`.
  - The **Auto-Send Emails** button is disabled.
  - The backend endpoint `/api/leads/send-email-smtp` actively returns `400 Bad Request` to safeguard your domain from burning its sender reputation.

---

## 3. Step-by-Step Draft Sync

1. Go to the workspace and select any lead in `Ready` or `DM Drafted` state.
2. In the **Outreach Studio**, select **Email**.
3. Edit the generated draft or customize the Give-First offer.
4. Click **Push Draft to Mail Client**.
5. Open your Gmail, Outlook, or PrivateEmail webmail/desktop app. Look in your **Drafts** folder. The personalized email is waiting for review with recipient, subject, and body ready.
