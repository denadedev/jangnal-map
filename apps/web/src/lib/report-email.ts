import nodemailer from "nodemailer";

import {
  MARKET_REPORT_TYPES,
  SERVICE_REPORT_TYPES,
  type ResolvedReport,
} from "./report";

export interface SmtpConfig {
  user: string;
  pass: string;
  to: string;
}

interface ReportMailOptions {
  from: string;
  to: string;
  subject: string;
  text: string;
  disableFileAccess: boolean;
  disableUrlAccess: boolean;
}

export interface MailTransport {
  sendMail(options: ReportMailOptions): Promise<unknown>;
}

export function readSmtpConfig(
  env: Readonly<Record<string, string | undefined>> = process.env,
): SmtpConfig {
  const user = env.SMTP_USER?.trim() ?? "";
  const pass = env.SMTP_PASS?.trim() ?? "";
  const to = env.REPORT_TO_EMAIL?.trim() || user;
  if (!user || !pass || !to) throw new Error("SMTP 설정이 필요합니다.");
  return { user, pass, to };
}

const reportTypeLabel = (report: ResolvedReport): string => {
  const types = report.scope === "market" ? MARKET_REPORT_TYPES : SERVICE_REPORT_TYPES;
  return types.find(([type]) => type === report.detailType)?.[1] ?? report.detailType;
};

export function createReportMessage(report: ResolvedReport): { subject: string; text: string } {
  const scopeLabel = report.scope === "market" ? "시장 정보" : "서비스 불편";
  const marketSuffix = report.market ? ` - ${report.market.name.replace(/[\r\n]+/g, " ")}` : "";
  const subject = report.scope === "market"
    ? `[오늘장날] 시장 정보 수정 제보${marketSuffix}`
    : "[오늘장날] 서비스 불편 신고";
  return {
    subject,
    text: [
      `제보 범위: ${scopeLabel}`,
      report.market ? `시장: ${report.market.name} (${report.market.id})` : "",
      `유형: ${reportTypeLabel(report)}`,
      `내용: ${report.message}`,
      report.evidenceUrl ? `근거 URL: ${report.evidenceUrl}` : "",
      report.contact ? `연락처: ${report.contact}` : "",
      report.pageUrl ? `제출 화면: ${report.pageUrl}` : "",
    ].filter(Boolean).join("\n"),
  };
}

export const createSmtpOptions = (config: SmtpConfig) => ({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user: config.user, pass: config.pass },
  connectionTimeout: 5_000,
  greetingTimeout: 5_000,
  socketTimeout: 10_000,
  dnsTimeout: 5_000,
});

const createSmtpTransport = (config: SmtpConfig): MailTransport => nodemailer.createTransport(
  createSmtpOptions(config),
) as MailTransport;

export async function sendReportEmail(
  report: ResolvedReport,
  transport?: MailTransport,
  config: SmtpConfig = readSmtpConfig(),
): Promise<void> {
  const message = createReportMessage(report);
  await (transport ?? createSmtpTransport(config)).sendMail({
    from: `오늘 장날 <${config.user}>`,
    to: config.to,
    subject: message.subject,
    text: message.text,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
}
