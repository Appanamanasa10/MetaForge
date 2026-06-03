import { db } from '@/lib/db';

/**
 * Interpolates string templates with record data.
 * E.g., "Student {{name}} registered." -> "Student Alice registered."
 */
function interpolateTemplate(template: string, data: Record<string, any>): string {
  if (!template) return '';
  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    return data && data[trimmedKey] !== undefined ? String(data[trimmedKey]) : `[${trimmedKey}]`;
  });
}

/**
 * Triggers workflows registered for an application on data events.
 * Handles failures gracefully to ensure application resilience.
 */
export async function triggerWorkflows(
  applicationId: string,
  entityId: string,
  triggerType: 'RECORD_CREATED' | 'RECORD_UPDATED' | 'RECORD_DELETED',
  recordData: Record<string, any>
) {
  try {
    // 1. Fetch workflows matching the application and trigger
    const workflows = await db.workflow.findMany({
      where: {
        applicationId,
        triggerType,
      },
    });

    if (workflows.length === 0) return;

    // 2. Fetch application owner for notification recipient
    const app = await db.application.findUnique({
      where: { id: applicationId },
      select: { ownerId: true, name: true },
    });

    if (!app) return;

    const actionPromises = workflows.map(async (wf) => {
      try {
        const config = wf.configurationJson as {
          messageTemplate?: string;
          titleTemplate?: string;
        } | null;

        const messageTemplate = config?.messageTemplate || `Record in ${triggerType.toLowerCase().replace('record_', '')} action.`;
        const titleTemplate = config?.titleTemplate || `Workflow: ${app.name}`;

        const interpolatedMessage = interpolateTemplate(messageTemplate, recordData);
        const interpolatedTitle = interpolateTemplate(titleTemplate, recordData);

        if (wf.actionType === 'NOTIFICATION') {
          // Create user notification for application owner
          await db.notification.create({
            data: {
              userId: app.ownerId,
              title: interpolatedTitle,
              message: interpolatedMessage,
              readStatus: false,
            },
          });
        }

        if (wf.actionType === 'AUDIT_LOG') {
          // Create AuditLog entry
          const actionWord = triggerType.split('_')[1]; // CREATED -> CREATED, etc.
          await db.auditLog.create({
            data: {
              entityId,
              action: actionWord,
              payload: recordData || {},
            },
          });
        }
      } catch (err) {
        // Log individual workflow errors but do not disrupt other workflows
        console.error(`Error executing workflow ${wf.id}:`, err);
      }
    });

    await Promise.all(actionPromises);
  } catch (error) {
    // Graceful error catcher prevents crashing backend routing runtime
    console.error('Workflow engine execution error:', error);
  }
}
