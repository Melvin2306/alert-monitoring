import SetupClientEmail from "./SetupClientEmail";

export type SetupEmailProps = {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
  smtp_secure: boolean;
  smtp_from: string;
};

const SetupEmail = () => {
  const smtp_host = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtp_port = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtp_user = process.env.SMTP_USER || "";
  const smtp_pass = process.env.SMTP_PASSWORD || "";
  const smtp_secure = process.env.SMTP_SECURE === "true";
  const smtp_from = process.env.SMTP_FROM || "";

  const smtp_setup: SetupEmailProps = {
    smtp_host,
    smtp_port,
    smtp_user,
    smtp_pass,
    smtp_secure,
    smtp_from,
  };

  console.log("SMTP Setup:", smtp_setup);

  return <SetupClientEmail smtp_setup={smtp_setup} />;
};

export default SetupEmail;
