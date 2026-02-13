import { Report } from '../types';

export const generatePartsRequestUrl = (report: Report, partsNote: string) => {
  // Warehouse or Admin Number (Mock)
  const PHONE_NUMBER = "201000000000"; 
  
  const message = `
🚨 *طلب قطع غيار عاجل* 
------------------------
📋 *رقم البلاغ:* #${report.id.split('-')[1]}
🏢 *الفرع:* ${report.branchName}
🛠 *الجهاز:* ${report.machineType}
📝 *وصف العطل:* 
${report.description}
------------------------
📦 *القطع المطلوبة:*
${partsNote}
------------------------
📍 *يرجى التجهيز فوراً*
`.trim();

  return `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
};
