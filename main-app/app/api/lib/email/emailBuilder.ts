/**
 * Email builder service to construct complete email content from templates
 */
import type { EmailOptions } from "../types";
import {
  actionInstructions,
  alertIntro,
  disclaimer,
  greetings,
  multipleFindings,
  signature,
  singleFinding,
  unsubscribeFooter,
} from "./templates";

/**
 * Builds a complete email with all necessary parts for notifications
 * @param options - Configuration options for the email
 * @returns Object containing HTML and plain text versions of the email
 */
export function buildAlertEmail(options: EmailOptions) {
  const { email, findings } = options;
  const totalFindings = findings.length;

  // Start with empty strings for text and HTML
  let textContent = "";
  let htmlContent = "";

  // Add greeting
  textContent += greetings.text({ email }) + "\n\n";
  htmlContent += greetings.html({ email });

  // Add alert introduction
  textContent += alertIntro.text({ totalFindings }) + "\n\n";
  htmlContent += alertIntro.html({ totalFindings });

  // Add findings section
  htmlContent += `<div style="margin: 20px 0;">`;

  // Loop through all findings
  findings.forEach((finding, index) => {
    const { url, findingTime, keywords, siteName } = finding;

    // For each finding, determine if it's a single or multiple keyword finding
    if (keywords.length === 1) {
      // Single keyword
      textContent +=
        singleFinding.text({
          keywords: [keywords[0]],
          url,
          findingTime,
          siteName,
        }) + "\n\n";

      htmlContent += singleFinding.html({
        keywords: [keywords[0]],
        url,
        findingTime,
        siteName,
      });
    } else {
      // Multiple keywords
      textContent +=
        multipleFindings.text({
          keywords,
          url,
          findingTime,
          siteName,
        }) + "\n\n";

      htmlContent += multipleFindings.html({
        keywords,
        url,
        findingTime,
        siteName,
      });
    }

    // Add spacing between multiple findings
    if (index < findings.length - 1) {
      textContent += "\n";
      htmlContent += '<div style="margin: 10px 0;"></div>';
    }
  });

  htmlContent += `</div>`;

  // Add action instructions
  textContent += actionInstructions.text() + "\n\n";
  htmlContent += actionInstructions.html();

  // Add signature
  textContent += signature.text();
  htmlContent += signature.html();

  // Add disclaimer
  textContent += disclaimer.text();
  htmlContent += disclaimer.html();

  // Add unsubscribe footer if emailId is provided
  if (options.emailId) {
    textContent += unsubscribeFooter.text({ emailId: options.emailId });
    htmlContent += unsubscribeFooter.html({ emailId: options.emailId });
  }

  // Wrap HTML content in basic styling
  htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Darkweb Monitoring Alert</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    a {
      color: #0066cc;
    }
    hr {
      border: none;
      border-top: 1px solid #eee;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>
  `.trim();

  return {
    text: textContent.trim(),
    html: htmlContent,
  };
}
