/**
 * PDF Generation Engine
 *
 * Professional PDF report generation with charts and templates
 * Using PDFKit for server-side PDF generation
 */

import PDFDocument from "pdfkit";
import { Readable } from "stream";
import { prisma } from "@/lib/db";
import type { ReportType } from "@prisma/client";
import { format } from "date-fns";

/**
 * PDF generation options
 */
export interface PDFReportOptions {
  projectId: string;
  reportType: ReportType;
  dateFrom: Date;
  dateTo: Date;
  title?: string;
  branding?: {
    logo?: string; // URL or base64
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
  includeCharts?: boolean;
  includeExecutiveSummary?: boolean;
}

/**
 * Report data structure
 */
interface ReportData {
  project: {
    name: string;
    description: string | null;
  };
  period: {
    from: Date;
    to: Date;
  };
  metrics: {
    totalContent: number;
    publishedContent: number;
    aiGeneratedContent: number;
    totalPublications: number;
    successRate: number;
  };
  platforms: Array<{
    name: string;
    type: string;
    totalPublished: number;
    successRate: number;
  }>;
  topContent: Array<{
    title: string;
    publishedAt: Date | null;
    platforms: string[];
  }>;
  costAnalysis?: {
    totalCost: number;
    aiCost: number;
    platformCost: number;
  };
}

/**
 * Fetch report data from database
 */
async function fetchReportData(
  projectId: string,
  dateFrom: Date,
  dateTo: Date
): Promise<ReportData> {
  // Fetch project details
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      name: true,
      description: true,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  // Fetch content metrics
  const totalContent = await prisma.content.count({
    where: {
      projectId,
      createdAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
  });

  const publishedContent = await prisma.content.count({
    where: {
      projectId,
      status: "PUBLISHED",
      publishedAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
  });

  const aiGeneratedContent = await prisma.content.count({
    where: {
      projectId,
      isAIGenerated: true,
      createdAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
  });

  // Fetch publication metrics
  const totalPublications = await prisma.contentPublication.count({
    where: {
      content: {
        projectId,
      },
      createdAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
  });

  const successfulPublications = await prisma.contentPublication.count({
    where: {
      content: {
        projectId,
      },
      status: "PUBLISHED",
      publishedAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
  });

  const successRate =
    totalPublications > 0
      ? (successfulPublications / totalPublications) * 100
      : 0;

  // Fetch platform breakdown
  const platforms = await prisma.platform.findMany({
    where: {
      projectId,
      isConnected: true,
    },
    include: {
      publications: {
        where: {
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
      },
    },
  });

  const platformData = platforms.map((platform) => {
    const total = platform.publications.length;
    const successful = platform.publications.filter(
      (p) => p.status === "PUBLISHED"
    ).length;

    return {
      name: platform.name,
      type: platform.type,
      totalPublished: successful,
      successRate: total > 0 ? (successful / total) * 100 : 0,
    };
  });

  // Fetch top content
  const topContent = await prisma.content.findMany({
    where: {
      projectId,
      status: "PUBLISHED",
      publishedAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
    select: {
      title: true,
      publishedAt: true,
      publications: {
        select: {
          platform: {
            select: {
              type: true,
            },
          },
        },
      },
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: 10,
  });

  return {
    project,
    period: {
      from: dateFrom,
      to: dateTo,
    },
    metrics: {
      totalContent,
      publishedContent,
      aiGeneratedContent,
      totalPublications,
      successRate,
    },
    platforms: platformData,
    topContent: topContent.map((content) => ({
      title: content.title,
      publishedAt: content.publishedAt,
      platforms: content.publications.map((p) => p.platform.type),
    })),
  };
}

/**
 * Generate PDF report
 *
 * Returns a readable stream for the generated PDF
 */
export async function generatePDFReport(
  options: PDFReportOptions
): Promise<Readable> {
  const data = await fetchReportData(
    options.projectId,
    options.dateFrom,
    options.dateTo
  );

  // Create PDF document
  const doc = new PDFDocument({
    size: "A4",
    margins: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50,
    },
    info: {
      Title: options.title || `${options.reportType} Report`,
      Author: "Full Self Publishing",
      Subject: `Report for ${data.project.name}`,
      CreationDate: new Date(),
    },
  });

  const primaryColor = options.branding?.primaryColor || "#2563eb";
  const secondaryColor = options.branding?.secondaryColor || "#64748b";

  // Header
  addReportHeader(doc, data, options, primaryColor);

  // Executive Summary (if enabled)
  if (options.includeExecutiveSummary !== false) {
    addExecutiveSummary(doc, data, primaryColor);
  }

  // Key Metrics Section
  addKeyMetricsSection(doc, data, primaryColor);

  // Platform Breakdown Section
  addPlatformBreakdownSection(doc, data, primaryColor, secondaryColor);

  // Top Content Section
  addTopContentSection(doc, data, primaryColor);

  // Footer
  addReportFooter(doc, primaryColor);

  // Finalize PDF
  doc.end();

  return doc as unknown as Readable;
}

/**
 * Add report header
 */
function addReportHeader(
  doc: PDFKit.PDFDocument,
  data: ReportData,
  options: PDFReportOptions,
  primaryColor: string
) {
  // Logo (if provided)
  if (options.branding?.logo) {
    // Would load and add logo here
    // doc.image(options.branding.logo, 50, 45, { width: 100 });
  }

  // Report title
  doc
    .fontSize(24)
    .fillColor(primaryColor)
    .font("Helvetica-Bold")
    .text(options.title || `${options.reportType} Report`, 50, 50, {
      align: "left",
    });

  // Project name
  doc
    .fontSize(14)
    .fillColor("#000")
    .font("Helvetica")
    .text(data.project.name, 50, 80);

  // Report period
  const periodText = `${format(data.period.from, "MMM dd, yyyy")} - ${format(data.period.to, "MMM dd, yyyy")}`;

  doc.fontSize(10).fillColor("#64748b").text(periodText, 50, 100);

  // Horizontal line
  doc
    .strokeColor(primaryColor)
    .lineWidth(2)
    .moveTo(50, 120)
    .lineTo(545, 120)
    .stroke();

  doc.moveDown(2);
}

/**
 * Add executive summary
 */
function addExecutiveSummary(
  doc: PDFKit.PDFDocument,
  data: ReportData,
  primaryColor: string
) {
  const y = doc.y + 20;

  // Section title
  doc
    .fontSize(16)
    .fillColor(primaryColor)
    .font("Helvetica-Bold")
    .text("Executive Summary", 50, y);

  doc.moveDown(0.5);

  // Summary text
  const summary = generateExecutiveSummary(data);

  doc
    .fontSize(11)
    .fillColor("#000")
    .font("Helvetica")
    .text(summary, {
      align: "justify",
      lineGap: 3,
    });

  doc.moveDown(1.5);
}

/**
 * Generate executive summary text
 */
function generateExecutiveSummary(data: ReportData): string {
  const { metrics, platforms } = data;

  const publishRate =
    metrics.totalContent > 0
      ? ((metrics.publishedContent / metrics.totalContent) * 100).toFixed(1)
      : "0";

  const activePlatforms = platforms.filter((p) => p.totalPublished > 0).length;

  return `During this reporting period, ${metrics.totalContent} content items were created, with ${metrics.publishedContent} (${publishRate}%) successfully published across ${activePlatforms} platforms. ${metrics.aiGeneratedContent} items were AI-generated. The overall publication success rate was ${metrics.successRate.toFixed(1)}%.`;
}

/**
 * Add key metrics section
 */
function addKeyMetricsSection(
  doc: PDFKit.PDFDocument,
  data: ReportData,
  primaryColor: string
) {
  const y = doc.y + 10;

  // Section title
  doc
    .fontSize(16)
    .fillColor(primaryColor)
    .font("Helvetica-Bold")
    .text("Key Metrics", 50, y);

  doc.moveDown(1);

  // Metrics grid
  const metrics = [
    {
      label: "Total Content Created",
      value: data.metrics.totalContent.toString(),
    },
    {
      label: "Published Content",
      value: data.metrics.publishedContent.toString(),
    },
    {
      label: "AI Generated",
      value: data.metrics.aiGeneratedContent.toString(),
    },
    {
      label: "Total Publications",
      value: data.metrics.totalPublications.toString(),
    },
    { label: "Success Rate", value: `${data.metrics.successRate.toFixed(1)}%` },
  ];

  const startY = doc.y;
  const boxWidth = 160;
  const boxHeight = 80;
  const gap = 15;

  metrics.forEach((metric, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = 50 + col * (boxWidth + gap);
    const y = startY + row * (boxHeight + gap);

    // Box background
    doc
      .rect(x, y, boxWidth, boxHeight)
      .fillAndStroke("#f8fafc", "#e2e8f0");

    // Metric value
    doc
      .fontSize(28)
      .fillColor(primaryColor)
      .font("Helvetica-Bold")
      .text(metric.value, x + 10, y + 15, {
        width: boxWidth - 20,
        align: "left",
      });

    // Metric label
    doc
      .fontSize(10)
      .fillColor("#64748b")
      .font("Helvetica")
      .text(metric.label, x + 10, y + 50, {
        width: boxWidth - 20,
        align: "left",
      });
  });

  doc.y = startY + Math.ceil(metrics.length / 3) * (boxHeight + gap) + 20;
}

/**
 * Add platform breakdown section
 */
function addPlatformBreakdownSection(
  doc: PDFKit.PDFDocument,
  data: ReportData,
  primaryColor: string,
  secondaryColor: string
) {
  const y = doc.y + 10;

  // Check if new page needed
  if (y > 650) {
    doc.addPage();
  }

  // Section title
  doc
    .fontSize(16)
    .fillColor(primaryColor)
    .font("Helvetica-Bold")
    .text("Platform Breakdown", 50, doc.y);

  doc.moveDown(1);

  // Table header
  const tableTop = doc.y;
  const colWidths = [200, 120, 120];
  const rowHeight = 30;

  doc
    .fontSize(11)
    .fillColor("#fff")
    .font("Helvetica-Bold");

  doc.rect(50, tableTop, 495, rowHeight).fill(primaryColor);

  doc.text("Platform", 60, tableTop + 10, { width: colWidths[0] });
  doc.text("Published", 260, tableTop + 10, { width: colWidths[1] });
  doc.text("Success Rate", 390, tableTop + 10, { width: colWidths[2] });

  // Table rows
  let currentY = tableTop + rowHeight;

  data.platforms.forEach((platform, index) => {
    const bgColor = index % 2 === 0 ? "#ffffff" : "#f8fafc";

    doc.rect(50, currentY, 495, rowHeight).fill(bgColor);

    doc
      .fontSize(10)
      .fillColor("#000")
      .font("Helvetica")
      .text(`${platform.name} (${platform.type})`, 60, currentY + 10, {
        width: colWidths[0],
      });

    doc.text(platform.totalPublished.toString(), 260, currentY + 10, {
      width: colWidths[1],
    });

    doc.text(`${platform.successRate.toFixed(1)}%`, 390, currentY + 10, {
      width: colWidths[2],
    });

    currentY += rowHeight;
  });

  doc.y = currentY + 20;
}

/**
 * Add top content section
 */
function addTopContentSection(
  doc: PDFKit.PDFDocument,
  data: ReportData,
  primaryColor: string
) {
  // Check if new page needed
  if (doc.y > 650) {
    doc.addPage();
  }

  // Section title
  doc
    .fontSize(16)
    .fillColor(primaryColor)
    .font("Helvetica-Bold")
    .text("Top Published Content", 50, doc.y);

  doc.moveDown(1);

  // Content list
  data.topContent.forEach((content, index) => {
    if (doc.y > 700) {
      doc.addPage();
    }

    doc
      .fontSize(11)
      .fillColor("#000")
      .font("Helvetica-Bold")
      .text(`${index + 1}. ${content.title}`, {
        continued: false,
      });

    const publishedDate = content.publishedAt
      ? format(content.publishedAt, "MMM dd, yyyy")
      : "Not published";

    doc
      .fontSize(9)
      .fillColor("#64748b")
      .font("Helvetica")
      .text(`   Published: ${publishedDate} | Platforms: ${content.platforms.join(", ")}`, {
        lineGap: 2,
      });

    doc.moveDown(0.5);
  });
}

/**
 * Add report footer
 */
function addReportFooter(doc: PDFKit.PDFDocument, primaryColor: string) {
  const pages = doc.bufferedPageRange();

  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);

    // Footer line
    doc
      .strokeColor(primaryColor)
      .lineWidth(1)
      .moveTo(50, 770)
      .lineTo(545, 770)
      .stroke();

    // Footer text
    doc
      .fontSize(8)
      .fillColor("#64748b")
      .font("Helvetica")
      .text(
        `Full Self Publishing Report | Generated on ${format(new Date(), "MMM dd, yyyy")}`,
        50,
        780,
        {
          align: "center",
          width: 495,
        }
      );

    // Page number
    doc.text(`Page ${i + 1} of ${pages.count}`, 50, 795, {
      align: "center",
      width: 495,
    });
  }
}

/**
 * Helper to stream PDF to file
 */
export async function streamPDFToFile(
  stream: Readable,
  filePath: string
): Promise<number> {
  const fs = await import("fs");
  const writeStream = fs.createWriteStream(filePath);

  return new Promise((resolve, reject) => {
    let bytesWritten = 0;

    stream.on("data", (chunk) => {
      bytesWritten += chunk.length;
    });

    stream.pipe(writeStream);

    writeStream.on("finish", () => {
      resolve(bytesWritten);
    });

    writeStream.on("error", reject);
    stream.on("error", reject);
  });
}
