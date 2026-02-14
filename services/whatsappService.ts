
import { Report, ReportStatus, User, Branch } from '../types';

/**
 * WhatsAppService
 * Handles generation of messages and triggering notifications.
 * In a real backend environment, this would call Twilio/UltraMsg API.
 * Here it generates Deep Links for the client side.
 */

const ADMIN_PHONE = "201000000000"; // Replace with actual system admin/warehouse number

export const whatsappService = {
  
  // 1. Trigger: New Ticket -> Send to Maintenance Manager
  notifyManagerNewTicket: (report: Report) => {
    const message = `
🔔 *بلاغ صيانة جديد*
-------------------
🆔 *رقم البلاغ:* #${report.id.split('-')[1]}
🏢 *الفرع:* ${report.branchName}
🚨 *الأولوية:* ${report.priority}
🛠 *المعدة:* ${report.machineType}
📝 *الوصف:* ${report.description}

يرجى تعيين فني في أقرب وقت.
    `.trim();
    return `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(message)}`;
  },

  // 2. Trigger: Assigned Ticket -> Send to Technician
  notifyTechnicianAssignment: (report: Report, tech: User, branch: Branch) => {
    if (!tech.phone) return null;

    const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.location)}`;
    
    const message = `
👷 *مهمة صيانة جديدة*
-------------------
يا ${tech.name}، تم تعيينك لبلاغ جديد.

📍 *الفرع:* ${branch.name}
🛠 *المعدة:* ${report.machineType}
📝 *الوصف:* ${report.description}
🗺 *الموقع:* ${googleMapsLink}

يرجى تأكيد الاستلام والتحرك للموقع.
    `.trim();
    
    return `https://wa.me/${tech.phone}?text=${encodeURIComponent(message)}`;
  },

  // 3. Trigger: Ticket Completed -> Send to Branch Manager
  notifyBranchCompletion: (report: Report, branchManagerPhone?: string) => {
    if (!branchManagerPhone) return null;

    const partsSummary = report.partsUsageList && report.partsUsageList.length > 0
        ? report.partsUsageList.map(p => `- ${p.partName} (${p.quantity})`).join('\n')
        : 'لا يوجد قطع غيار';

    const message = `
✅ *تم إنجاز الصيانة*
-------------------
🆔 *رقم البلاغ:* #${report.id.split('-')[1]}
🛠 *المعدة:* ${report.machineType}
👨‍🔧 *الفني:* ${report.assignedTechnicianName}

📦 *القطع المستخدمة:*
${partsSummary}

💰 *التكلفة الإجمالية:* ${report.cost} ج.م

يرجى مراجعة الجهاز وإغلاق البلاغ من النظام.
    `.trim();

    return `https://wa.me/${branchManagerPhone}?text=${encodeURIComponent(message)}`;
  },

  // Helper for Low Stock Alert
  notifyLowStock: (partName: string, currentQty: number) => {
    const message = `
⚠️ *تنبيه مخزون منخفض*
-------------------
الصنف: ${partName}
الكمية الحالية: ${currentQty}

يرجى إعادة الطلب فوراً.
    `.trim();
    return `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(message)}`;
  }
};
