/**
 * Email templates for various parts of notification emails
 * Contains both plain text and HTML versions
 */
import type { TemplateVariables } from "../types";

// Helper function to extract username from email address
const extractUserNameFromEmail = (email: string): string => {
  if (!email) return "";
  const username = email.split("@")[0];
  // Capitalize first letter and replace dots/underscores with spaces for better readability
  return username.charAt(0).toUpperCase() + username.slice(1).replace(/[._]/g, " ");
};

// Greeting templates
export const greetings = {
  text: (vars: Pick<TemplateVariables, "email">) =>
    `Hello${vars.email ? " " + extractUserNameFromEmail(vars.email) : ""},`,

  html: (vars: Pick<TemplateVariables, "email">) =>
    `<p>Hello${vars.email ? " <strong>" + extractUserNameFromEmail(vars.email) + "</strong>" : ""},</p>`,
};

// Alert introduction templates
export const alertIntro = {
  text: (vars: Pick<TemplateVariables, "totalFindings">) =>
    `We've detected ${vars.totalFindings === 1 ? "a new keyword match" : vars.totalFindings + " new keyword matches"} in your monitored darkweb sites.`,

  html: (vars: Pick<TemplateVariables, "totalFindings">) =>
    `<p>We've detected <strong>${vars.totalFindings === 1 ? "a new keyword match" : vars.totalFindings + " new keyword matches"}</strong> in your monitored darkweb sites.</p>`,
};

// Context display templates
export const contextDisplay = {
  text: (vars: Pick<TemplateVariables, "context">) =>
    vars.context ? `\nContext: "${vars.context}"` : "",

  html: (vars: Pick<TemplateVariables, "context" | "highlightedContext">) => {
    if (!vars.context && !vars.highlightedContext) return "";

    const displayContent = vars.highlightedContext || vars.context || "";

    return `
<div style="margin: 8px 0; padding: 8px; background-color: #f5f5f5; border-radius: 4px; font-size: 13px; color: #444;">
  <p style="margin: 0 0 5px 0;"><strong>Context:</strong></p>
  <p style="margin: 0; font-family: monospace; white-space: pre-wrap;">${displayContent}</p>
</div>`;
  },
};

// Single finding templates
export const singleFinding = {
  text: (
    vars: Pick<TemplateVariables, "keywords" | "url" | "findingTime" | "siteName" | "context">
  ) =>
    `ALERT: Keyword "${vars.keywords?.[0]}" was found at ${vars.siteName || vars.url} at ${vars.findingTime}.
URL: ${vars.url}${contextDisplay.text({ context: vars.context })}`,

  html: (
    vars: Pick<
      TemplateVariables,
      "keywords" | "url" | "findingTime" | "siteName" | "context" | "highlightedContext"
    >
  ) =>
    `<div style="margin: 15px 0; padding: 10px; border-left: 4px solid #ff3b30; background-color: #fff4f4;">
  <p><strong>⚠️ ALERT:</strong> Keyword "<strong>${vars.keywords?.[0]}</strong>" was found at ${vars.siteName || vars.url} at <em>${vars.findingTime}</em>.</p>
  <p>URL: <a href="${vars.url}" target="_blank" rel="noopener noreferrer">${vars.url}</a></p>
  ${contextDisplay.html({ context: vars.context, highlightedContext: vars.highlightedContext })}
</div>`,
};

// Multiple findings templates
export const multipleFindings = {
  text: (
    vars: Pick<TemplateVariables, "keywords" | "url" | "findingTime" | "siteName" | "context">
  ) => {
    const keywordsText =
      vars.keywords && vars.keywords.length > 0
        ? vars.keywords.map((k) => `"${k}"`).join(", ")
        : "multiple keywords";

    return `ALERT: ${keywordsText} were found at ${vars.siteName || vars.url} at ${vars.findingTime}.
URL: ${vars.url}${contextDisplay.text({ context: vars.context })}`;
  },

  html: (
    vars: Pick<
      TemplateVariables,
      "keywords" | "url" | "findingTime" | "siteName" | "context" | "highlightedContext"
    >
  ) => {
    const keywordsHtml =
      vars.keywords && vars.keywords.length > 0
        ? vars.keywords.map((k) => `<strong>"${k}"</strong>`).join(", ")
        : "<strong>multiple keywords</strong>";

    return `<div style="margin: 15px 0; padding: 10px; border-left: 4px solid #ff3b30; background-color: #fff4f4;">
  <p><strong>⚠️ ALERT:</strong> Keywords ${keywordsHtml} were found at ${vars.siteName || vars.url} at <em>${vars.findingTime}</em>.</p>
  <p>URL: <a href="${vars.url}" target="_blank" rel="noopener noreferrer">${vars.url}</a></p>
  ${contextDisplay.html({ context: vars.context, highlightedContext: vars.highlightedContext })}
</div>`;
  },
};

// Action instructions templates
export const actionInstructions = {
  text: () =>
    `Please log in to your monitoring dashboard to review the findings and take appropriate action.`,

  html: () =>
    `<p>Please <a href="${process.env.NEXT_PUBLIC_APP_URL || "/"}" target="_blank" rel="noopener noreferrer">log in to your monitoring dashboard</a> to review the findings and take appropriate action.</p>`,
};

// Signature templates
export const signature = {
  text: () =>
    `\nBest regards,
The ALERT Team`,

  html: () =>
    `<p>Best regards,<br>
The ALERT Team</p>`,
};

// Footer with disclaimer
export const disclaimer = {
  text: () =>
    `\n---
This is an automated alert. Please do not reply directly to this email.
If you need assistance, please contact your system administrator.`,

  html: () =>
    `<hr>
<p style="font-size: 12px; color: #666;">
  This is an automated alert. Please do not reply directly to this email.<br>
  If you need assistance, please contact your system administrator.
</p>`,
};

// Footer with ALERT open source information
export const openSourceInfo = {
  text: () =>
    `\n---
This email was generated by ALERT - Automated Leak Examination and Reporting Tool.
Built by Melvin2306. The source code is available on GitHub.`,

  html: () =>
    `<hr>
<p style="font-size: 12px; color: #666;">
    This email was generated by <strong>ALERT</strong> - Automated Leak Examination and Reporting Tool.<br>
    Built by <a href="" target="_blank" rel="noopener noreferrer">Melvin2306</a>. The source code is available on <a href="" target="_blank" rel="noopener noreferrer">GitHub</a>.
</p>`,
};

// Footer with unsubscribe link
export const unsubscribeFooter = {
  text: (vars: Pick<TemplateVariables, "emailId">) =>
    `\n---
To unsubscribe from these notifications, visit:
${process.env.NEXT_PUBLIC_APP_URL || ""}/unsubscribe/${vars.emailId}`,

  html: (vars: Pick<TemplateVariables, "emailId">) =>
    `<hr>
<p style="font-size: 12px; color: #666;">
  To unsubscribe from these notifications, <a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/unsubscribe/${vars.emailId}" target="_blank" rel="noopener noreferrer">click here</a>.
</p>`,
};
