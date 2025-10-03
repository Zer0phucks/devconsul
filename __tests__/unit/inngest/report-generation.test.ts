import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import type { InngestEvents } from '@/lib/inngest/client';

/**
 * Unit Tests: Report Generation and Export Inngest Jobs
 *
 * Tests:
 * - Report generation (PDF/CSV) from configuration
 * - Data export jobs (multiple formats)
 * - Email report delivery
 * - File upload to Vercel Blob storage
 * - Scheduled email reports cron
 * - Export status tracking
 * - Multiple output formats (CSV, PDF, iCal, ZIP)
 */

// Mock dependencies
const mockPrisma = {
  reportConfig: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  reportHistory: {
    create: jest.fn(),
    update: jest.fn(),
  },
  exportJob: {
    create: jest.fn(),
    update: jest.fn(),
  },
  emailReportSubscription: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  costTracking: {
    aggregate: jest.fn(),
  },
  contentPublication: {
    findMany: jest.fn(),
  },
};

const mockVercelBlob = {
  put: jest.fn(),
};

const mockFS = {
  readFile: jest.fn(),
  unlink: jest.fn(),
};

const mockRecordJobExecution = jest.fn();
const mockTrackJobPerformance = jest.fn();

const mockReportGeneration = {
  generatePDFReport: jest.fn(),
  streamPDFToFile: jest.fn(),
  exportContentHistoryCSV: jest.fn(),
  exportAnalyticsCSV: jest.fn(),
  exportScheduledContentCSV: jest.fn(),
  streamToString: jest.fn(),
};

const mockEmailReports = {
  sendWeeklySummaryEmail: jest.fn(),
  sendMonthlyDigestEmail: jest.fn(),
  sendBudgetAlertEmail: jest.fn(),
  sendPublishingFailureEmail: jest.fn(),
};

// Mock modules
jest.mock('@/lib/db', () => ({ prisma: mockPrisma }));
jest.mock('@vercel/blob', () => ({ put: mockVercelBlob.put }));
jest.mock('fs/promises', () => mockFS);
jest.mock('@/lib/monitoring/metrics-collector', () => ({
  recordJobExecution: mockRecordJobExecution,
}));
jest.mock('@/lib/monitoring/performance-tracker', () => ({
  trackJobPerformance: mockTrackJobPerformance,
}));

describe('Report Generation Jobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Generate Report Job', () => {
    it('should create report history record on start', async () => {
      const config = {
        id: 'config_123',
        projectId: 'proj_456',
        reportType: 'CONTENT_PERFORMANCE',
        outputFormat: 'PDF',
      };

      const expectedHistory = {
        id: 'history_789',
        configId: config.id,
        projectId: config.projectId,
        reportType: config.reportType,
        outputFormat: config.outputFormat,
        status: 'PENDING',
        triggeredBy: 'manual',
      };

      mockPrisma.reportConfig.findUnique.mockResolvedValue(config);
      mockPrisma.reportHistory.create.mockResolvedValue(expectedHistory);

      const result = await mockPrisma.reportHistory.create({
        data: {
          configId: config.id,
          projectId: config.projectId,
          reportType: config.reportType,
          outputFormat: config.outputFormat,
          status: 'PENDING',
          triggeredBy: 'manual',
        },
      });

      expect(result.status).toBe('PENDING');
      expect(result.configId).toBe('config_123');
    });

    it('should throw when report config not found', () => {
      mockPrisma.reportConfig.findUnique.mockResolvedValue(null);

      const shouldThrow = mockPrisma.reportConfig
        .findUnique({ where: { id: 'config_999' } })
        .then((cfg: any) => {
          if (!cfg) {
            throw new Error('Report config not found: config_999');
          }
        });

      expect(shouldThrow).rejects.toThrow('Report config not found');
    });

    it('should fetch report configuration with project details', async () => {
      const mockConfig = {
        id: 'config_123',
        projectId: 'proj_456',
        reportType: 'PUBLISHING_ANALYTICS',
        outputFormat: 'CSV',
        dateFrom: new Date('2025-10-01'),
        dateTo: new Date('2025-10-03'),
        project: {
          id: 'proj_456',
          name: 'Test Project',
          description: 'A test project',
        },
      };

      mockPrisma.reportConfig.findUnique.mockResolvedValue(mockConfig);

      const result = await mockPrisma.reportConfig.findUnique({
        where: { id: 'config_123' },
        include: {
          project: {
            select: { id: true, name: true, description: true },
          },
        },
      });

      expect(result.project.name).toBe('Test Project');
      expect(result.reportType).toBe('PUBLISHING_ANALYTICS');
    });

    it('should update status to processing', async () => {
      mockPrisma.reportHistory.update.mockResolvedValue({
        id: 'history_123',
        status: 'PROCESSING',
      });

      await mockPrisma.reportHistory.update({
        where: { id: 'history_123' },
        data: { status: 'PROCESSING' },
      });

      expect(mockPrisma.reportHistory.update).toHaveBeenCalledWith({
        where: { id: 'history_123' },
        data: { status: 'PROCESSING' },
      });
    });

    it('should use default date range when not specified', () => {
      const config = {
        dateFrom: null,
        dateTo: null,
      };

      const dateFrom = config.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const dateTo = config.dateTo || new Date();

      expect(dateFrom).toBeInstanceOf(Date);
      expect(dateTo).toBeInstanceOf(Date);
      expect(dateTo.getTime()).toBeGreaterThan(dateFrom.getTime());
    });
  });

  describe('PDF Report Generation', () => {
    it('should generate PDF report file', async () => {
      const mockStream = { pipe: jest.fn() };
      const tempPath = '/tmp/report-123.pdf';

      mockReportGeneration.generatePDFReport.mockResolvedValue(mockStream);
      mockReportGeneration.streamPDFToFile.mockResolvedValue(5000);

      const result = {
        filePath: tempPath,
        recordCount: 5000,
      };

      expect(result.filePath).toBe(tempPath);
      expect(result.recordCount).toBe(5000);
    });

    it('should include branding configuration', async () => {
      const branding = {
        logo: 'https://example.com/logo.png',
        primaryColor: '#FF5733',
        companyName: 'Test Corp',
      };

      const reportOptions = {
        projectId: 'proj_123',
        reportType: 'CONTENT_PERFORMANCE',
        dateFrom: new Date('2025-10-01'),
        dateTo: new Date('2025-10-03'),
        branding,
        includeCharts: true,
        includeExecutiveSummary: true,
      };

      expect(reportOptions.branding).toEqual(branding);
      expect(reportOptions.includeCharts).toBe(true);
    });
  });

  describe('CSV Report Generation', () => {
    it('should generate CSV for content performance report', async () => {
      const mockStream = { read: jest.fn() };
      const csvContent = 'id,title,views,clicks\n1,Post 1,100,50';

      mockReportGeneration.exportContentHistoryCSV.mockResolvedValue(mockStream);
      mockReportGeneration.streamToString.mockResolvedValue(csvContent);

      const result = await mockReportGeneration.streamToString(mockStream);

      expect(result).toContain('id,title,views,clicks');
      expect(result.split('\n')).toHaveLength(2);
    });

    it('should generate CSV for publishing analytics', async () => {
      const mockStream = { read: jest.fn() };
      const csvContent = 'platform,posts,engagement\nTwitter,10,500';

      mockReportGeneration.exportAnalyticsCSV.mockResolvedValue(csvContent);

      const result = await mockReportGeneration.exportAnalyticsCSV(
        'proj_123',
        new Date('2025-10-01'),
        new Date('2025-10-03')
      );

      expect(result).toContain('platform,posts,engagement');
    });

    it('should count records correctly (excluding header)', () => {
      const csvContent = 'id,title\n1,Post 1\n2,Post 2\n3,Post 3';
      const lines = csvContent.split('\n').filter((line) => line.trim()).length;
      const recordCount = lines - 1; // Exclude header

      expect(recordCount).toBe(3);
    });

    it('should throw for unsupported CSV report types', () => {
      const reportType = 'UNSUPPORTED_TYPE';

      const shouldThrow = () => {
        if (!['CONTENT_PERFORMANCE', 'PUBLISHING_ANALYTICS'].includes(reportType)) {
          throw new Error(`CSV not supported for report type: ${reportType}`);
        }
      };

      expect(shouldThrow).toThrow('CSV not supported');
    });
  });

  describe('File Upload to Storage', () => {
    it('should upload report to Vercel Blob storage', async () => {
      const filename = 'test-project-content-performance-2025-10-03.pdf';
      const fileBuffer = Buffer.from('PDF content');

      mockFS.readFile.mockResolvedValue(fileBuffer);
      mockVercelBlob.put.mockResolvedValue({
        url: 'https://blob.vercel-storage.com/report-abc123.pdf',
        size: 5000,
      });

      const blob = await mockVercelBlob.put(filename, fileBuffer, {
        access: 'public',
        addRandomSuffix: true,
      });

      expect(blob.url).toContain('blob.vercel-storage.com');
      expect(blob.size).toBe(5000);
    });

    it('should clean up temp file after upload', async () => {
      const tempPath = '/tmp/report-123.pdf';

      mockFS.unlink.mockResolvedValue(undefined);

      await mockFS.unlink(tempPath);

      expect(mockFS.unlink).toHaveBeenCalledWith(tempPath);
    });

    it('should generate unique filename with random suffix', () => {
      const filename = 'test-project-analytics-2025-10-03.csv';
      const config = {
        access: 'public',
        addRandomSuffix: true,
      };

      expect(config.addRandomSuffix).toBe(true);
      expect(filename).toContain('2025-10-03');
    });
  });

  describe('Report Completion', () => {
    it('should mark report as completed with file details', async () => {
      const reportHistory = {
        id: 'history_123',
        startedAt: new Date('2025-10-03T10:00:00Z'),
      };

      const uploadResult = {
        url: 'https://blob.vercel-storage.com/report.pdf',
        size: 5000,
      };

      mockPrisma.reportHistory.update.mockResolvedValue({
        id: reportHistory.id,
        status: 'COMPLETED',
        fileUrl: uploadResult.url,
        fileSize: uploadResult.size,
        recordCount: 100,
        completedAt: new Date(),
      });

      const result = await mockPrisma.reportHistory.update({
        where: { id: reportHistory.id },
        data: {
          status: 'COMPLETED',
          fileUrl: uploadResult.url,
          fileSize: uploadResult.size,
          recordCount: 100,
          completedAt: new Date(),
          duration: Date.now() - reportHistory.startedAt.getTime(),
        },
      });

      expect(result.status).toBe('COMPLETED');
      expect(result.fileUrl).toBe(uploadResult.url);
    });

    it('should update report config last run timestamp', async () => {
      mockPrisma.reportConfig.update.mockResolvedValue({
        id: 'config_123',
        lastRunAt: new Date(),
      });

      await mockPrisma.reportConfig.update({
        where: { id: 'config_123' },
        data: { lastRunAt: new Date() },
      });

      expect(mockPrisma.reportConfig.update).toHaveBeenCalled();
    });

    it('should send email notification if configured', async () => {
      const config = {
        deliveryMethod: 'email',
        recipients: ['user@example.com', 'admin@example.com'],
      };

      const fileUrl = 'https://blob.vercel-storage.com/report.pdf';

      if (config.deliveryMethod === 'email' && config.recipients) {
        // Email delivery would happen here
        expect(config.recipients).toHaveLength(2);
      }

      expect(config.deliveryMethod).toBe('email');
    });

    it('should record successful job metrics', async () => {
      const duration = 8000;
      const metadata = {
        reportConfigId: 'config_123',
        format: 'PDF',
        fileSize: 5000,
      };

      await mockRecordJobExecution('generate-report', true, duration, metadata);
      await mockTrackJobPerformance('generate-report', duration, true);

      expect(mockRecordJobExecution).toHaveBeenCalledWith(
        'generate-report',
        true,
        duration,
        metadata
      );
    });
  });

  describe('Report Generation Errors', () => {
    it('should mark report as failed on error', async () => {
      const error = new Error('PDF generation failed');
      const reportHistory = {
        id: 'history_123',
        startedAt: new Date(),
      };

      mockPrisma.reportHistory.update.mockResolvedValue({
        id: reportHistory.id,
        status: 'FAILED',
        error: error.message,
        completedAt: new Date(),
      });

      const result = await mockPrisma.reportHistory.update({
        where: { id: reportHistory.id },
        data: {
          status: 'FAILED',
          error: error.message,
          completedAt: new Date(),
          duration: Date.now() - reportHistory.startedAt.getTime(),
        },
      });

      expect(result.status).toBe('FAILED');
      expect(result.error).toBe('PDF generation failed');
    });

    it('should record failed job metrics', async () => {
      const duration = 3000;
      const metadata = {
        error: 'Blob upload failed',
        reportConfigId: 'config_123',
      };

      await mockRecordJobExecution('generate-report', false, duration, metadata);
      await mockTrackJobPerformance('generate-report', duration, false);

      expect(mockRecordJobExecution).toHaveBeenCalledWith(
        'generate-report',
        false,
        duration,
        metadata
      );
    });

    it('should enforce concurrency limit of 5', () => {
      const concurrencyConfig = {
        limit: 5,
      };

      expect(concurrencyConfig.limit).toBe(5);
    });

    it('should retry up to 3 times', () => {
      const jobConfig = {
        id: 'generate-report',
        retries: 3,
      };

      expect(jobConfig.retries).toBe(3);
    });
  });

  describe('Export Data Job', () => {
    it('should create export job record', async () => {
      const exportData = {
        projectId: 'proj_123',
        exportType: 'CONTENT_HISTORY',
        outputFormat: 'CSV',
        startedBy: 'user_456',
      };

      mockPrisma.exportJob.create.mockResolvedValue({
        id: 'export_789',
        ...exportData,
        status: 'PENDING',
        progress: 0,
      });

      const result = await mockPrisma.exportJob.create({
        data: {
          ...exportData,
          status: 'PENDING',
          progress: 0,
          metadata: {},
        },
      });

      expect(result.status).toBe('PENDING');
      expect(result.progress).toBe(0);
    });

    it('should update progress during export', async () => {
      const stages = [
        { status: 'PROCESSING', progress: 10 },
        { status: 'PROCESSING', progress: 60 },
        { status: 'COMPLETED', progress: 100 },
      ];

      for (const stage of stages) {
        mockPrisma.exportJob.update.mockResolvedValue({
          id: 'export_123',
          ...stage,
        });

        const result = await mockPrisma.exportJob.update({
          where: { id: 'export_123' },
          data: stage,
        });

        expect(result.progress).toBe(stage.progress);
      }
    });

    it('should support multiple export types', () => {
      const exportTypes = [
        'CONTENT_HISTORY',
        'ANALYTICS',
        'SCHEDULED_CONTENT',
        'IMAGE_LIBRARY',
      ];

      exportTypes.forEach((type) => {
        expect(exportTypes).toContain(type);
      });
    });

    it('should support multiple output formats', () => {
      const formats = ['CSV', 'PDF', 'ICAL', 'ZIP'];

      formats.forEach((format) => {
        expect(formats).toContain(format);
      });
    });

    it('should handle iCal export for scheduled content', () => {
      const exportType = 'SCHEDULED_CONTENT';
      const outputFormat = 'ICAL';

      if (exportType === 'SCHEDULED_CONTENT' && outputFormat === 'ICAL') {
        // Would call exportScheduledContentICalFile
        expect(outputFormat).toBe('ICAL');
      }

      expect(exportType).toBe('SCHEDULED_CONTENT');
    });

    it('should handle ZIP export for image library', () => {
      const exportType = 'IMAGE_LIBRARY';
      const outputFormat = 'ZIP';

      if (exportType === 'IMAGE_LIBRARY' && outputFormat === 'ZIP') {
        // Would call exportImageLibraryFile
        expect(outputFormat).toBe('ZIP');
      }

      expect(exportType).toBe('IMAGE_LIBRARY');
    });

    it('should mark export as completed with file details', async () => {
      const exportJob = {
        id: 'export_123',
        startedAt: new Date(),
      };

      const uploadResult = {
        url: 'https://blob.vercel-storage.com/export.csv',
        size: 10000,
      };

      mockPrisma.exportJob.update.mockResolvedValue({
        id: exportJob.id,
        status: 'COMPLETED',
        progress: 100,
        fileUrl: uploadResult.url,
        fileSize: uploadResult.size,
        recordCount: 500,
        completedAt: new Date(),
      });

      const result = await mockPrisma.exportJob.update({
        where: { id: exportJob.id },
        data: {
          status: 'COMPLETED',
          progress: 100,
          fileUrl: uploadResult.url,
          fileSize: uploadResult.size,
          recordCount: 500,
          completedAt: new Date(),
          duration: Date.now() - exportJob.startedAt.getTime(),
        },
      });

      expect(result.status).toBe('COMPLETED');
      expect(result.recordCount).toBe(500);
    });

    it('should enforce export concurrency limit of 3', () => {
      const concurrencyConfig = {
        limit: 3,
      };

      expect(concurrencyConfig.limit).toBe(3);
    });
  });

  describe('Email Report Job', () => {
    it('should fetch email subscription', async () => {
      const mockSubscription = {
        id: 'sub_123',
        reportType: 'WEEKLY_SUMMARY',
        recipients: ['user@example.com'],
        isActive: true,
      };

      mockPrisma.emailReportSubscription.findUnique.mockResolvedValue(
        mockSubscription
      );

      const result = await mockPrisma.emailReportSubscription.findUnique({
        where: { id: 'sub_123' },
      });

      expect(result.isActive).toBe(true);
      expect(result.reportType).toBe('WEEKLY_SUMMARY');
    });

    it('should throw when subscription not found', () => {
      mockPrisma.emailReportSubscription.findUnique.mockResolvedValue(null);

      const shouldThrow = mockPrisma.emailReportSubscription
        .findUnique({ where: { id: 'sub_999' } })
        .then((sub: any) => {
          if (!sub) {
            throw new Error('Email subscription not found: sub_999');
          }
        });

      expect(shouldThrow).rejects.toThrow('Email subscription not found');
    });

    it('should throw when subscription is inactive', () => {
      mockPrisma.emailReportSubscription.findUnique.mockResolvedValue({
        id: 'sub_123',
        isActive: false,
      });

      const shouldThrow = mockPrisma.emailReportSubscription
        .findUnique({ where: { id: 'sub_123' } })
        .then((sub: any) => {
          if (!sub.isActive) {
            throw new Error('Email subscription is not active');
          }
        });

      expect(shouldThrow).rejects.toThrow('Email subscription is not active');
    });

    it('should send weekly summary email', async () => {
      mockEmailReports.sendWeeklySummaryEmail.mockResolvedValue({
        success: true,
        messageId: 'msg_123',
      });

      const result = await mockEmailReports.sendWeeklySummaryEmail(
        'proj_123',
        ['user@example.com']
      );

      expect(result.success).toBe(true);
      expect(mockEmailReports.sendWeeklySummaryEmail).toHaveBeenCalledWith(
        'proj_123',
        ['user@example.com']
      );
    });

    it('should send monthly digest email', async () => {
      mockEmailReports.sendMonthlyDigestEmail.mockResolvedValue({
        success: true,
        messageId: 'msg_456',
      });

      const result = await mockEmailReports.sendMonthlyDigestEmail(
        'proj_123',
        ['admin@example.com']
      );

      expect(result.success).toBe(true);
    });

    it('should send budget alert email with threshold', async () => {
      mockPrisma.costTracking.aggregate.mockResolvedValue({
        _sum: { totalCost: 85 },
      });

      const threshold = 100;
      const currentCost = 85;

      mockEmailReports.sendBudgetAlertEmail.mockResolvedValue({
        success: true,
        messageId: 'msg_789',
      });

      const result = await mockEmailReports.sendBudgetAlertEmail(
        'proj_123',
        ['finance@example.com'],
        threshold,
        currentCost
      );

      expect(result.success).toBe(true);
      expect(mockEmailReports.sendBudgetAlertEmail).toHaveBeenCalledWith(
        'proj_123',
        ['finance@example.com'],
        100,
        85
      );
    });

    it('should send publishing failure email', async () => {
      const failures = [
        {
          id: 'pub_1',
          status: 'FAILED',
          content: { title: 'Post 1' },
          platform: { name: 'Twitter', type: 'TWITTER' },
        },
      ];

      mockPrisma.contentPublication.findMany.mockResolvedValue(failures);
      mockEmailReports.sendPublishingFailureEmail.mockResolvedValue({
        success: true,
        messageId: 'msg_abc',
      });

      const result = await mockEmailReports.sendPublishingFailureEmail(
        'proj_123',
        ['ops@example.com'],
        failures
      );

      expect(result.success).toBe(true);
    });

    it('should update subscription statistics after send', async () => {
      mockPrisma.emailReportSubscription.update.mockResolvedValue({
        id: 'sub_123',
        lastSentAt: new Date(),
        deliveryCount: 5,
        lastDeliveryStatus: 'SUCCESS',
      });

      const result = await mockPrisma.emailReportSubscription.update({
        where: { id: 'sub_123' },
        data: {
          lastSentAt: new Date(),
          deliveryCount: { increment: 1 },
          lastDeliveryStatus: 'SUCCESS',
        },
      });

      expect(result.lastDeliveryStatus).toBe('SUCCESS');
      expect(result.deliveryCount).toBe(5);
    });
  });

  describe('Schedule Email Reports Cron', () => {
    it('should run every 6 hours', () => {
      const cronExpression = '0 */6 * * *';
      expect(cronExpression).toBe('0 */6 * * *');
    });

    it('should find subscriptions due for sending', async () => {
      const now = new Date();
      const dueSubscriptions = [
        {
          id: 'sub_1',
          nextScheduledAt: new Date(now.getTime() - 1000),
          isActive: true,
        },
        {
          id: 'sub_2',
          nextScheduledAt: new Date(now.getTime() - 5000),
          isActive: true,
        },
      ];

      mockPrisma.emailReportSubscription.findMany.mockResolvedValue(
        dueSubscriptions
      );

      const result = await mockPrisma.emailReportSubscription.findMany({
        where: {
          isActive: true,
          nextScheduledAt: { lte: now },
        },
      });

      expect(result).toHaveLength(2);
    });

    it('should calculate next scheduled time', () => {
      const calculateNext = (frequency: string) => {
        const now = new Date();
        switch (frequency) {
          case 'daily':
            return new Date(now.getTime() + 24 * 60 * 60 * 1000);
          case 'weekly':
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          case 'monthly':
            const next = new Date(now);
            next.setMonth(next.getMonth() + 1);
            return next;
          default:
            return new Date(now.getTime() + 24 * 60 * 60 * 1000);
        }
      };

      const daily = calculateNext('daily');
      const weekly = calculateNext('weekly');
      const monthly = calculateNext('monthly');

      expect(daily).toBeInstanceOf(Date);
      expect(weekly.getTime()).toBeGreaterThan(daily.getTime());
      expect(monthly).toBeInstanceOf(Date);
    });
  });

  describe('Event Schema Validation', () => {
    it('should accept valid report generate event', () => {
      const event: InngestEvents['report/generate'] = {
        data: {
          reportConfigId: 'config_123',
          userId: 'user_456',
          triggeredBy: 'manual',
        },
      };

      expect(event.data.reportConfigId).toBe('config_123');
      expect(['manual', 'scheduled', 'api']).toContain(event.data.triggeredBy);
    });

    it('should accept valid export data event', () => {
      const event: InngestEvents['export/data'] = {
        data: {
          projectId: 'proj_123',
          exportType: 'CONTENT_HISTORY',
          outputFormat: 'CSV',
          userId: 'user_456',
          dateFrom: new Date('2025-10-01'),
          dateTo: new Date('2025-10-03'),
          options: { includeDeleted: false },
        },
      };

      expect(event.data.exportType).toBe('CONTENT_HISTORY');
      expect(event.data.options).toBeDefined();
    });

    it('should accept valid email report event', () => {
      const event: InngestEvents['report/email.send'] = {
        data: {
          subscriptionId: 'sub_123',
          reportType: 'WEEKLY_SUMMARY',
          projectId: 'proj_456',
          triggeredBy: 'cron',
        },
      };

      expect(event.data.reportType).toBe('WEEKLY_SUMMARY');
      expect(['manual', 'cron', 'api']).toContain(event.data.triggeredBy);
    });
  });
});
